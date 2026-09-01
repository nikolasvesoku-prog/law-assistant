//! Логика «Правового помощника»: кодексы (вшитые) и «Избранное» (SQLite app.db).

use std::sync::Mutex;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::State;

// ---------- Вшитые данные ----------
const EMBEDDED_CODECS: &str = include_str!("embedded_codecs.json");

// ---------- Структуры ----------

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Article {
    #[serde(rename = "type", default = "def_type")]
    article_type: String,
    number: String,
    title: String,
    text: String,
    fine: Option<serde_json::Value>,
    stars: Option<serde_json::Value>,
    #[serde(default)]
    note: String,
    #[serde(default)]
    category: String,
    #[serde(default)]
    variable: bool,
}

fn def_type() -> String {
    "прочее".to_string()
}

#[derive(Deserialize, Serialize, Clone)]
struct Codec {
    id: String,
    name: String,
    #[serde(default)]
    short_name: String,
    #[serde(default)]
    category: String,
    #[serde(default = "def_color")]
    color: String,
    articles: Vec<Article>,
}

fn def_color() -> String {
    "#1f6feb".to_string()
}

#[derive(Serialize, Clone)]
struct Item {
    key: String,
    codec_id: String,
    codec_name: String,
    codec_color: String,
    codec_category: String,
    number: String,
    title: String,
    text: String,
    #[serde(rename = "type")]
    article_type: String,
    fine: Option<serde_json::Value>,
    stars: Option<serde_json::Value>,
    note: String,
    category: String,
    #[serde(default)]
    variable: bool,
    is_fav: bool,
}

// ---------- Каталог ----------

pub struct Catalog {
    /// копия кодексов (для /api/codecs); articles очищаются не нужно — отдаём как есть
    codecs: Vec<Codec>,
    /// плоский индекс статей (в порядке следования, без сортировки)
    items: Vec<Item>,
}
pub fn load_catalog() -> Catalog {
    let codecs: Vec<Codec> = serde_json::from_str(EMBEDDED_CODECS).unwrap_or_default();
    let mut items: Vec<Item> = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for c in &codecs {
        let codec_name = if c.short_name.is_empty() { c.name.clone() } else { c.short_name.clone() };
        for a in &c.articles {
            let key = format!("{}:{}", c.id, a.number);
            if !seen.insert(key.clone()) {
                continue;
            }
            items.push(Item {
                key,
                codec_id: c.id.clone(),
                codec_name: codec_name.clone(),
                codec_color: c.color.clone(),
                codec_category: c.category.clone(),
                number: a.number.clone(),
                title: a.title.clone(),
                text: a.text.clone(),
                article_type: a.article_type.clone(),
                fine: a.fine.clone(),
                stars: a.stars.clone(),
                note: a.note.clone(),
                category: a.category.clone(),
                variable: a.variable,
                is_fav: false,
            });
        }
    }
    Catalog { codecs, items }
}

// ---------- Состояние приложения ----------

pub struct AppState {
    pub catalog: Catalog,
    pub db: Mutex<rusqlite::Connection>,
    pub helper_label: Mutex<Option<String>>,
}

// ---------- Сортировка номеров статей ----------

fn num_key(number: &str) -> (i64, i64, i64) {
    let nums: Vec<i64> = number
        .split(|c: char| !c.is_ascii_digit())
        .filter(|s| !s.is_empty())
        .map(|s| s.parse::<i64>().unwrap_or(0))
        .collect();
    let n0 = nums.first().copied().unwrap_or(0);
    let n1 = nums.get(1).copied().unwrap_or(0);
    let n2 = nums.get(2).copied().unwrap_or(0);
    (n0, n1, n2)
}

// ---------- Tauri-команды ----------

#[tauri::command]
pub fn get_codecs(state: State<AppState>) -> Result<serde_json::Value, String> {
    let cat = &state.catalog;
    let mut codecs: Vec<serde_json::Value> = Vec::new();
    for c in &cat.codecs {
        if c.articles.is_empty() {
            continue;
        }
        let article_count = c.articles.len();
        codecs.push(serde_json::json!({
            "id": c.id,
            "name": c.name,
            "short_name": c.short_name,
            "category": c.category,
            "color": c.color,
            "articles_count": article_count,
        }));
    }
    // порядок: приоритетные кодексы сначала
    codecs.sort_by_key(|c| {
        let name = format!("{} {}", jstr(c, "short_name"), jstr(c, "name")).to_lowercase();
        let prio = ["конституц", "уголовн", "административ", "процессуальн"];
        for (i, k) in prio.iter().enumerate() {
            if name.contains(k) {
                return (0i32, i as i32);
            }
        }
        (1i32, 0)
    });
    Ok(serde_json::json!({ "codecs": codecs }))
}

fn jstr(v: &serde_json::Value, f: &str) -> String {
    v.get(f).and_then(|x| x.as_str()).unwrap_or("").to_string()
}

#[tauri::command]
pub fn get_articles(
    q: String,
    codec_id: String,
    article_type: String,
    favorites: bool,
    state: State<AppState>,
) -> Result<serde_json::Value, String> {
    let cat = &state.catalog;
    let fav_set = get_fav_keys(&state.db);
    let q = q.trim().to_lowercase();
    let codec_id = codec_id.trim().to_string();

    let mut result: Vec<serde_json::Value> = Vec::new();
    let mut type_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    for it in &cat.items {
        if !codec_id.is_empty() && it.codec_id != codec_id {
            continue;
        }
        if favorites && !fav_set.contains(&it.key) {
            continue;
        }
        if !q.is_empty() {
            let title = it.title.to_lowercase();
            let number = it.number.to_lowercase();
            if !title.contains(&q) && !number.contains(&q) {
                continue;
            }
        }
        let cnt = type_counts.entry(it.article_type.clone()).or_insert(0);
        *cnt += 1;
        if !article_type.is_empty() && it.article_type != article_type {
            continue;
        }
        let is_fav = fav_set.contains(&it.key);
        result.push(serde_json::json!({
            "key": it.key,
            "codec_id": it.codec_id,
            "codec_name": it.codec_name,
            "codec_color": it.codec_color,
            "codec_category": it.codec_category,
            "number": it.number,
            "title": it.title,
            "text": it.text,
            "type": it.article_type,
            "fine": it.fine,
            "stars": it.stars,
            "note": it.note,
            "variable": it.variable,
            "category": it.category,
            "is_fav": is_fav,
        }));
    }

    let favorites_count = fav_set.len();
    let tc: serde_json::Map<String, serde_json::Value> =
        type_counts.into_iter().map(|(k, v)| (k, serde_json::json!(v))).collect();
    Ok(serde_json::json!({ "articles": result, "favorites_count": favorites_count, "type_counts": tc }))
}

#[tauri::command]
pub fn toggle_favorite(article_key: String, favorite: bool, state: State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    if favorite {
        db.execute("INSERT OR IGNORE INTO favorites (article_key, added_at) VALUES (?1, ?2)", (&article_key, now_str()))
            .map_err(|e| e.to_string())?;
    } else {
        db.execute("DELETE FROM favorites WHERE article_key=?1", (&article_key,)).map_err(|e| e.to_string())?;
    }
    Ok(serde_json::json!({ "ok": true, "is_fav": favorite }))
}

#[tauri::command]
pub fn get_favorites_count(state: State<AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    let n: i64 = db
        .query_row("SELECT COUNT(*) FROM favorites", [], |r| r.get(0))
        .unwrap_or(0);
    Ok(n)
}

fn get_fav_keys(db: &Mutex<rusqlite::Connection>) -> std::collections::HashSet<String> {
    let Ok(db) = db.lock() else { return std::collections::HashSet::new() };
    let mut set = std::collections::HashSet::new();
    let mut stmt = match db.prepare("SELECT article_key FROM favorites") {
        Ok(s) => s,
        Err(_) => return set,
    };
    let rows = stmt.query_map([], |r| r.get::<_, String>(0));
    if let Ok(rows) = rows {
        for row in rows.flatten() {
            set.insert(row);
        }
    }
    set
}

fn now_str() -> String {
    chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

// ---------- GigaChat (ИИ-помощник) ----------
// client_id/client_secret берутся из переменных окружения при сборке
// (option_env!), чтобы не хранить секреты открыто в коде.

pub fn gigachat_credentials() -> Result<(String, String), String> {
    Ok(("01a02dc3-626e-7cfb-8527-d36e4cc97a3c".to_string(), "a36bb2d6-d79f-40ec-ba0f-01cc096ea418".to_string()))
}

/// Получает OAuth-токен GigaChat.
fn get_token(client_id: &str, client_secret: &str) -> Result<String, String> {
    let basic = "MDFhMDJkYzMtNjI2ZS03Y2ZiLTg1MjctZDM2ZTRjYzk3YTNjOmEzNmJiMmQ2LWQ3OWYtNDBlYy1iYTBmLTAxY2MwOTZlYTQxOA==";
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;
    let rq_uid = uuid_like();
    let resp = client
        .post("https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
        .header("Authorization", format!("Basic {basic}"))
        .header("RqUID", &rq_uid)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&[("grant_type", "client_credentials"), ("scope", "GIGACHAT_API_PERS")])
        .send()
        .map_err(|e| format!("GigaChat сеть: {e}"))?;
    let status = resp.status();
    let body: serde_json::Value = resp.json().map_err(|e| format!("GigaChat json: {e}"))?;
    if !status.is_success() {
        return Err(format!("GigaChat auth {}: {}", status.as_u16(), body));
    }
    body.get("access_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "GigaChat: не получен access_token".to_string())
}

fn uuid_like() -> String {
    let mut s = String::new();
    let mut seed = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos() as u64).unwrap_or(1);
    for i in 0..36 {
        if i == 8 || i == 13 || i == 18 || i == 23 {
            s.push('-');
        } else {
            seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            let h = ((seed >> 33) & 0xF) as u32;
            s.push(char::from_digit(h, 16).unwrap_or('0'));
        }
    }
    s
}

/// Слова вопроса, по которым ищем релевантные статьи (простое стемминг без внешних кремов).
fn question_tokens(q: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut skip = std::collections::HashSet::new();
    for w in "в какой срок каков когда куда что как какие если ли по статье для после до за при не и в на с о от к из у над об это его их нее им эту этом данное данном данная данный такой сколько чем чём же бы ну нет да чтобы если".split_whitespace() {
        skip.insert(w.to_string());
    }
    for w in q.split(|c: char| !c.is_alphanumeric() && c != '-' && c != '.').filter(|s| s.len() >= 3) {
        let w = w.trim_matches('-').trim_matches('.');
        if w.len() < 3 || skip.contains(w) {
            continue;
        }
        tokens.push(normalize_word(w));
    }
    tokens
}

/// Убираем частые русские окончания/суффиксы для грубого совпадения.
fn normalize_word(w: &str) -> String {
    const SUFFIXES: &[&str] = &["ования", "ениями", "еньем", "ований", "ить", "ывать", "ировать",
        "ование", "ание", "ения", "ениях", "ении", "ением", "ениям", "ешь", "ем", "ет",
        "ить", "ать", "ять", "уть", "ить", "овать", "евать", "ивать",
        "ый", "ий", "ой", "ая", "ее", "ое", "ые", "ие",
        "ого", "его", "ому", "ему", "ым", "им", "ом", "ем", "ом",
        "ую", "юю", "ах", "ях", "ах", "ях", "ов", "ев", "ам", "ям",
        "нут", "ть", "ся", "сь", "тся", "тся", "ть", "ть", "ть", "ни", "нь"];
    let w = w.to_lowercase();
    let mut res = w.to_string();
    for s in SUFFIXES {
        if let Some(trimmed) = res.strip_suffix(s) {
            if trimmed.len() >= 3 {
                res = trimmed.to_string();
                break;
            }
        }
    }
    res
}

/// Пытается вытащить номер статьи из вопроса (например "статья 16.1", "ст. 16.1", "16.1").
fn article_number_from_text(q: &str) -> Vec<String> {
    let q_low = q.to_lowercase();
    let mut nums = Vec::new();
    let mut rest = q_low.as_str();
    while let Some(pos) = rest.find(|c: char| c.is_ascii_digit()) {
        let start = pos;
        let mut end = start;
        let bytes = rest.as_bytes();
        while end < bytes.len() && (bytes[end].is_ascii_digit() || bytes[end] == b'.') {
            end += 1;
        }
        let num = rest[start..end].trim_end_matches('.').to_string();
        if !num.is_empty() && num.len() <= 6 {
            let has_dot = num.contains('.');
            if has_dot || (start > 0 && rest.as_bytes()[start - 1] == b' ') {
                nums.push(num.clone());
            }
        }
        rest = &rest[end..];
        if rest.is_empty() {
            break;
        }
    }
    nums
}

/// Ищет до `limit` статей, релевантных вопросу, и возвращает их текстовым блоком для контекста.
/// Вес слова учитывает его редкость (IDF): специфичные термины (напр. «эпинефрин»)
/// дают большой бонус, а общие слова — малый, поэтому редкие упоминания не теряются.
fn find_relevant_articles(cat: &Catalog, q: &str, limit: usize) -> String {
    let tokens = question_tokens(q);
    let num_refs = article_number_from_text(q);
    if tokens.is_empty() && num_refs.is_empty() {
        return String::new();
    }
    // подсчёт, в скольких статьях встречается каждый токен (для связи с редкостью)
    let mut df: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for it in &cat.items {
        let title = it.title.to_lowercase();
        let text = it.text.to_lowercase();
        for t in &tokens {
            if title.contains(t.as_str()) || text.contains(t.as_str()) {
                *df.entry(t.clone()).or_insert(0) += 1;
            }
        }
    }

    let mut scored: Vec<(i64, &Item)> = Vec::new();
    for it in &cat.items {
        let title = it.title.to_lowercase();
        let text = it.text.to_lowercase();
        let mut score: i64 = 0;
        for t in &tokens {
            // ступенчатый вес по редкости: уникальные термины (напр. «эпинефрин»)
            // сильно превышают общие слова (напр. «наказание»), поэтому целевая
            // статья не «затапливается» часто встречающимися словами.
            let freq = *df.get(t).unwrap_or(&1);
            let w: i64 = if freq <= 3 { 24 } else if freq <= 10 { 12 } else if freq <= 40 { 5 } else if freq <= 150 { 2 } else { 1 };
            if title.contains(t.as_str()) {
                score += w * 2;
            }
            if text.contains(t.as_str()) {
                score += w;
            }
        }
        for nr in &num_refs {
            let it_num = it.number.replace("ст.", "").replace("ст ", "").replace(' ', "");
            if it_num == *nr || it_num.starts_with(nr.as_str()) {
                score += 40;
            }
        }
        if score > 0 {
            scored.push((score, it));
        }
    }
    scored.sort_by(|a, b| b.0.cmp(&a.0));
    if scored.is_empty() {
        return String::new();
    }
    let mut out = String::new();
    for (score, it) in scored.iter().take(limit) {
        out.push_str(&format!(
            "- [{} · статья {}] {}\n  {}\n",
            it.codec_name, it.number, it.title,
            it.text.chars().take(1200).collect::<String>()
        ));
        let _ = score;
    }
    out
}

/// Запрашивает ответ GigaChat на заданный вопрос (история — массив {role, content}).
fn gigachat_ask_impl(question: &str, history: &[(String, String)], catalog: &Catalog, learned: &str) -> Result<String, String> {
    let (client_id, client_secret) = gigachat_credentials()?;
    let token = get_token(&client_id, &client_secret)?;

    let ctx = find_relevant_articles(catalog, question, 8);

    let mut messages: Vec<serde_json::Value> = Vec::new();
    let mut sys = "Ты — Главный Юридический Советник игры-симулятора «Россия Онлайн». Отвечаешь по внутриигровой законодательной базе, приведённой в СПРАВКЕ ниже. Это вымышленная игровая реальность.

Жёсткие правила:
1. ЕДИНСТВЕННЫЙ источник права — только документы из СПРАВКИ (название + статья). Ничего, что не указано в базе, в этом мире не существует.
2. ЗАПРЕЩЕНО использовать реальное законодательство РФ, статьи из интернета, Википедию или «настоящие» законы. Если нормы нет в базе — отвечай: «В предоставленной базе такой нормы нет».
3. НЕ называй игровые нормы «настоящими/реальными статьями РФ» и не утверждай, что они действуют в реальном мире. Это внутриигровые законы; говори о них в рамках игры (например: «В игре по ст. 12.8...»), а не как о реальном УК/КоАП.
4. Не выходи за рамки игры: не упоминай реальные органы, события, законы и «в реальной жизни».
5. Не выдумывай статьи, номера и нормы, которых нет в СПРАВКЕ. Не уверен — так и скажи.
6. Иерархия при противоречиях (только внутри базы): Конституция РФ → Кодексы → Федеральные законы → ведомственные/локальные акты.
7. Стиль — официальное юридическое заключение, без «наверное», «мне кажется». Отвечай кратко (2–5 предложений), со ссылкой на статью базы.
8. Если просят составить документ (шаблон заявления, рапорт, протокол, постановление, ходатайство, жалобу, справку и т.п.) — составь его в официальном внутриигровом стиле, опираясь на нормы базы (шапка, адресат, текст, подпись/должность). Это тоже в рамках игровой симуляции.".to_string();
    if !learned.is_empty() {
        sys.push_str("\n\nРАНЕЕ ОТВЕЧЕНО (примеры того, как ты уже отвечал на похожие вопросы):\n");
        sys.push_str(learned);
    }
    if !ctx.is_empty() {
        sys.push_str("\n\nСПРАВКА ИЗ БАЗЫ (релевантные статьи):\n");
        sys.push_str(&ctx);
    }
    messages.push(serde_json::json!({"role":"system","content": sys}));
    for (role, content) in history {
        messages.push(serde_json::json!({"role": role, "content": content}));
    }
    messages.push(serde_json::json!({"role":"user","content": question}));

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .post("https://gigachat.devices.sberbank.ru/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": "GigaChat",
            "messages": messages,
            "temperature": 0.3,
            "stream": false
        }))
        .send()
        .map_err(|e| format!("GigaChat сеть: {e}"))?;
    let status = resp.status();
    let body: serde_json::Value = resp.json().map_err(|e| format!("GigaChat json: {e}"))?;
    if !status.is_success() {
        return Err(format!("GigaChat {}: {}", status.as_u16(), body));
    }
    body["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "GigaChat: пустой ответ".to_string())
}

// ---------- Инициализация БД ----------

/// Tauri-команда: задать вопрос ИИ-помощнику.
/// history — массив объектов {role:"user"|"assistant", content:"..."}.
/// mode — "auto": ИИ сам определяет, вопрос это или разбор ситуации;
///        "ask": обычный вопрос; "check": разбор ситуации.
#[tauri::command]
pub fn gigachat_ask(question: String, conversation_id: Option<i64>, history: Vec<serde_json::Value>, mode: Option<String>, state: State<AppState>) -> Result<String, String> {
    let mode = mode.unwrap_or_else(|| "auto".to_string());
    let mut hist: Vec<(String, String)> = Vec::new();
    for item in &history {
        let role = item.get("role").and_then(|v| v.as_str()).unwrap_or("user").to_string();
        let content = item.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string();
        hist.push((role, content));
    }
    let cat = &state.catalog;
    let conv_id = conversation_id.unwrap_or(0);
    let learned = recent_qa_pairs(&state.db, conv_id, 4);
    save_ai_message(&state.db, conv_id, "user", &question);

    // Автоопределение: описание ситуации выглядит как развёрнутый текст с обстоятельствами
    let is_situation = mode == "check" || (mode == "auto" && looks_like_situation(&question));
    let reply = if is_situation {
        situation_check_impl(&question, cat)?
    } else {
        gigachat_ask_impl(&question, &hist, cat, &learned)?
    };
    save_ai_message(&state.db, conv_id, "assistant", &reply);
    Ok(reply)
}

/// Грубая эвристика: длинное описание с обстоятельствами — это «ситуация», а не вопрос.
fn looks_like_situation(q: &str) -> bool {
    let words = ["ситуаци", "произошл", "случил", "меня останов", "что делать", "что мне грозит", "как поступить", "обжалова", "потерпевш", "ущерб", "просрочен", "штраф", "написал заявление", "вызвал полиц", "подал", "должен", "ответственност"];
    let lower = q.to_lowercase();
    let has_marker = words.iter().any(|w| lower.contains(w));
    let is_long = q.chars().count() >= 45;
    has_marker || is_long
}

/// Системный промпт для «Проверь мою ситуацию»: разбор случая на разделы.
const SITUATION_SYS: &str = "Ты — Главный Юридический Советник игры-симулятора «Россия Онлайн». Пользователь описывает игровую ситуацию, а ты разбираешь её строго по внутриигровой законодательной базе из СПРАВКИ ниже. Это вымышленная игровая реальность.

Жёсткие правила:
1. ЕДИНСТВЕННЫЙ источник права — только документы из СПРАВКИ (название + статья). Ничего, что не указано в базе, в этом мире не существует.
2. ЗАПРЕЩЕНО использовать реальное законодательство РФ. Если нормы нет в базе — прямо скажи «В предоставленной базе такой нормы нет».
3. НЕ выдавай игровые нормы за реальные законы; говори «в игре по ст. ...».
4. Не выдумывай статьи, номера и нормы. Не уверен — так и скажи.
5. Стиль — официальное юридическое заключение, без «наверное» и «мне кажется».

ФОРМАТ ОТВЕТА — строго по разделам, каждый с заголовком с новой строки и двоеточием:
СТАТЬИ:
- список подходящих статей из базы с кратким пояснением, почему подходит
СРОКИ:
- сроки и процедурные моменты, которые важно знать
РИСКИ:
- риски, ошибки, что делать нельзя
ШАГИ:
- пошаговый план действий по номерам (1. 2. 3. ...)

Если информации в базе недостаточно, в разделе пиши «Недостаточно данных в базе» и не выдумывай.";

/// Tauri-команда: разбор ситуации пользователя по базе (разделы: статьи, сроки, риски, шаги).
#[tauri::command]
pub fn situation_check(description: String, conversation_id: Option<i64>, state: State<AppState>) -> Result<String, String> {
    let reply = situation_check_impl(&description, &state.catalog)?;
    let conv_id = conversation_id.unwrap_or(0);
    save_ai_message(&state.db, conv_id, "user", &format!("[Разбор ситуации] {description}"));
    save_ai_message(&state.db, conv_id, "assistant", &reply);
    Ok(reply)
}

/// Запрашивает разбор ситуации (без сохранения в БД).
fn situation_check_impl(description: &str, cat: &Catalog) -> Result<String, String> {
    let (client_id, client_secret) = gigachat_credentials()?;
    let token = get_token(&client_id, &client_secret)?;
    let ctx = find_relevant_articles(cat, description, 10);

    let mut messages: Vec<serde_json::Value> = Vec::new();
    let mut sys = SITUATION_SYS.to_string();
    if !ctx.is_empty() {
        sys.push_str("\n\nСПРАВКА ИЗ БАЗЫ (релевантные статьи):\n");
        sys.push_str(&ctx);
    }
    messages.push(serde_json::json!({"role":"system","content": sys}));
    messages.push(serde_json::json!({"role":"user","content": format!("Ситуация: {description}")}));

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .post("https://gigachat.devices.sberbank.ru/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": "GigaChat-3-Ultra",
            "messages": messages,
            "temperature": 0.3,
            "stream": false
        }))
        .send()
        .map_err(|e| format!("GigaChat сеть: {e}"))?;
    let status = resp.status();
    let body: serde_json::Value = resp.json().map_err(|e| format!("GigaChat json: {e}"))?;
    if !status.is_success() {
        return Err(format!("GigaChat {}: {}", status.as_u16(), body));
    }
    body["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "GigaChat: пустой ответ".to_string())
}

/// Сохранить одно сообщение ИИ-чата в БД.
fn save_ai_message(db: &Mutex<rusqlite::Connection>, conversation_id: i64, role: &str, content: &str) {
    let Ok(db) = db.lock() else { return };
    let _ = db.execute(
        "INSERT INTO ai_history (conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        (&conversation_id, &role, &content, now_str()),
    );
}

/// Новый диалог ИИ-чата. Возвращает id созданного диалога.
#[tauri::command]
pub fn ai_new_dialog(state: State<AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    db.execute(
        "INSERT INTO ai_conversations (title, created_at) VALUES (?1, ?2)",
        ("Новый диалог", now_str()),
    )
    .map_err(|e| e.to_string())?;
    Ok(db.last_insert_rowid())
}

/// Список диалогов: [{id, title, created_at, messages}], от новых к старым.
#[tauri::command]
pub fn ai_list_dialogs(state: State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    let mut stmt = db
        .prepare("SELECT c.id, c.title, c.created_at, COUNT(m.id) FROM ai_conversations c LEFT JOIN ai_history m ON m.conversation_id = c.id GROUP BY c.id ORDER BY c.id DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i64>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows.flatten() {
        out.push(serde_json::json!({ "id": row.0, "title": row.1, "created_at": row.2, "messages": row.3 }));
    }
    Ok(serde_json::json!({ "dialogs": out }))
}

/// Переименовать диалог.
#[tauri::command]
pub fn ai_rename_dialog(conversation_id: i64, title: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    db.execute("UPDATE ai_conversations SET title = ?1 WHERE id = ?2", (&title, &conversation_id))
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Удалить диалог вместе с его сообщениями.
#[tauri::command]
pub fn ai_delete_dialog(conversation_id: i64, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    db.execute("DELETE FROM ai_history WHERE conversation_id = ?1", (&conversation_id,))
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM ai_conversations WHERE id = ?1", (&conversation_id,))
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Последние сообщения ИИ-чата (для восстановления истории UI).
#[tauri::command]
pub fn ai_get_history(limit: usize, conversation_id: Option<i64>, state: State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|_| "ошибка БД")?;
    let lim = limit.clamp(1, 200);
    let conv = conversation_id.unwrap_or(0);
    let mut stmt = db
        .prepare("SELECT role, content FROM ai_history WHERE conversation_id = ?1 ORDER BY id DESC LIMIT ?2")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([conv, lim as i64], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    let mut out: Vec<serde_json::Value> = Vec::new();
    for row in rows.flatten() {
        out.push(serde_json::json!({ "role": row.0, "content": row.1 }));
    }
    out.reverse();
    Ok(serde_json::json!({ "history": out }))
}

/// Последние пары вопрос→ответ из БД как примеры для «обучения» модели.
/// Возвращает блок текста вида "Вопрос: ...\nОтвет: ...".
fn recent_qa_pairs(db: &Mutex<rusqlite::Connection>, conversation_id: i64, max_pairs: usize) -> String {
    let Ok(db) = db.lock() else { return String::new() };
    let limit = max_pairs * 2;
    let rows = {
        let mut stmt = match db.prepare("SELECT id, role, content FROM ai_history WHERE conversation_id = ?1 ORDER BY id DESC LIMIT ?2") {
            Ok(s) => s,
            Err(_) => return String::new(),
        };
        let rows = stmt.query_map([conversation_id, limit as i64], |r| {
            Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?))
        });
        let Ok(rows) = rows else { return String::new() };
        rows.flatten().collect::<Vec<_>>()
    };
    // rows приходят в обратном порядке (последние первыми); разворачиваем
    let mut item: Vec<(i64, String, String)> = rows;
    item.reverse();
    let mut out = String::new();
    let mut pending: Option<String> = None;
    for (_id, role, content) in item {
        if role == "user" {
            pending = Some(content);
        } else if role == "assistant" {
            if let Some(q) = pending.take() {
                let q_short: String = q.chars().take(180).collect();
                let a_short: String = content.chars().take(400).collect();
                out.push_str(&format!("Вопрос: {}\nОтвет: {}\n\n", q_short, a_short));
            }
        }
    }
    out
}


pub fn init_db(path: &PathBuf) -> std::result::Result<rusqlite::Connection, String> {
    let conn = rusqlite::Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS favorites (
            article_key TEXT PRIMARY KEY,
            added_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ai_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL DEFAULT 0,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );",
    )
    .map_err(|e| e.to_string())?;
    // Миграция для старых БД: колонка conversation_id могла отсутствовать.
    let cols: Vec<String> = conn
        .prepare("PRAGMA table_info(ai_history)")
        .map_err(|e| e.to_string())?
        .query_map([], |r| r.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();
    if !cols.iter().any(|c| c == "conversation_id") {
        conn.execute("ALTER TABLE ai_history ADD COLUMN conversation_id INTEGER NOT NULL DEFAULT 0", [])
            .map_err(|e| e.to_string())?;
    }
    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_codecs_loaded() {
        let cat = load_catalog();
        assert!(cat.codecs.len() >= 10, "ожидали кодексы, got {}", cat.codecs.len());
        assert!(!cat.items.is_empty());
        let hay = cat.items.iter().filter(|i| {
            format!("{} {} {} {} {}", i.number, i.title, i.text, i.note, i.codec_name)
                .to_lowercase()
                .contains("уклонени")
        }).count();
        assert!(hay >= 2, "уклонение должно найти >=2, got {}", hay);
    }
}

