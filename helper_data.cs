using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

public class PopItem { public string Number, Title, Text, Codec, Type, Note, Fine; public bool IsFavorite; }
public class HbItem { public string Id, Title; public string[] Content; }
public class CheckItem { public string Text; public bool Done; }
public class NoteItem { public long Id; public string Title; public List<CheckItem> Items = new List<CheckItem>(); }
public class AiMsg { public string Role, Content; }

public static class AppData
{
    public static string Dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Правовой помощник");
    public static string FavoritesFile = Path.Combine(Dir, "favorites.txt");
    public static string NotesFile = Path.Combine(Dir, "notes.txt");
    public static string AiFile = Path.Combine(Dir, "ai_history.txt");
    public static PopItem[] Popular;
    public static HbItem[] Handbook;
    public static List<NoteItem> Notes = new List<NoteItem>();
    public static List<AiMsg> AiHistory = new List<AiMsg>();

    static AppData() { Directory.CreateDirectory(Dir); InitData(); LoadAll(); }

    static void InitData()
    {
        Popular = new PopItem[] {
            new PopItem{Number="17.6",Title="Неповиновение законному распоряжению",Text="Неповиновение законному распоряжению. Штраф до 35.000 руб либо лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная",Fine="35000"},
            new PopItem{Number="17.4",Title="Воспрепятствование",Text="Воспрепятствование. Штраф до 40.000 руб либо лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная",Fine="40000"},
            new PopItem{Number="17.3",Title="Оскорбление представителя власти",Text="Публичное оскорбление представителя власти. Штраф до 40.000 руб либо лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная",Fine="40000"},
            new PopItem{Number="17.2",Title="Насилие в отношении представителя власти",Text="Применение насилия в отношении представителя власти. Штраф до 60.000 руб либо лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная",Fine="60000"},
            new PopItem{Number="17.1",Title="Посягательство на жизнь сотрудника",Text="Посягательство на жизнь сотрудника. Лишение свободы от 40 до 50 мес.",Codec="УК РФ",Type="уголовная"},
            new PopItem{Number="15.5",Title="Дача взятки",Text="Дача взятки. Штраф до 70.000 руб либо лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная",Fine="70000"},
            new PopItem{Number="13.2ч1",Title="Нарушение ПДД с тяжким вредом",Text="Нарушение ПДД, тяжкий вред. Штраф до 60.000 руб либо лишение свободы до 20 мес.",Codec="УК РФ",Type="уголовная",Fine="60000"},
            new PopItem{Number="13.2ч2",Title="Нарушение ПДД со смертью",Text="Нарушение ПДД, смерть человека. Лишение свободы до 30 мес.",Codec="УК РФ",Type="уголовная"},
            new PopItem{Number="12.8ч1",Title="Незаконный оборот оружия",Text="Оборот оружия. Штраф 20-50 тыс руб, лишение свободы до 40 мес.",Codec="УК РФ",Type="уголовная",Fine="50000"},
            new PopItem{Number="12.8ч2",Title="Оборот спецсредств",Text="Оборот спецсредств. Штраф 50-80 тыс руб, лишение свободы до 50 мес.",Codec="УК РФ",Type="уголовная",Fine="80000"},
            new PopItem{Number="12.7ч1",Title="Проникновение на закрытые территории",Text="Проникновение на закрытые территории. Лишение до 30 мес + штраф до 35.000 руб.",Codec="УК РФ",Type="уголовная",Fine="35000"},
            new PopItem{Number="12.7ч2",Title="Проникновение на режимные территории",Text="Проникновение на режимные территории. Лишение до 40 мес + штраф до 65.000 руб.",Codec="УК РФ",Type="уголовная",Fine="65000"},
            new PopItem{Number="12.2ч1",Title="Кража",Text="Кража. Штраф до 30.000 руб, лишение свободы до 20 мес.",Codec="УК РФ",Type="уголовная",Fine="30000"},
            new PopItem{Number="12.2ч2",Title="Грабеж",Text="Грабеж. Штраф до 50.000 руб, лишение свободы до 40 мес.",Codec="УК РФ",Type="уголовная",Fine="50000"},
            new PopItem{Number="12.2ч3",Title="Разбой",Text="Разбой. Лишение свободы до 50 мес.",Codec="УК РФ",Type="уголовная"},
            new PopItem{Number="12.1ч1",Title="Убийство",Text="Убийство. Лишение свободы от 30 до 50 мес.",Codec="УК РФ",Type="уголовная"},
            new PopItem{Number="12.1ч2",Title="Причинение смерти по неосторожности",Text="Причинение смерти по неосторожности. Лишение свободы до 25 мес.",Codec="УК РФ",Type="уголовная"},
            new PopItem{Number="7.1",Title="Побои",Text="Побои. Штраф до 15.000 руб.",Codec="КоАП РФ",Type="административная",Fine="15000"},
            new PopItem{Number="6.3",Title="Оскорбление",Text="Оскорбление. Штраф до 10.000 руб.",Codec="КоАП РФ",Type="административная",Fine="10000"},
            new PopItem{Number="5.4",Title="Курение",Text="Курение в неположенном месте. Штраф до 15.000 руб.",Codec="КоАП РФ",Type="административная",Fine="15000"},
            new PopItem{Number="5.5",Title="Распитие спиртного",Text="Распитие спиртных напитков. Штраф до 15.000 руб.",Codec="КоАП РФ",Type="административная",Fine="15000"},
            new PopItem{Number="5.3",Title="Мат в общественном месте",Text="Нецензурная лексика. Штраф до 15.000 руб.",Codec="КоАП РФ",Type="административная",Fine="15000"},
            new PopItem{Number="12",Title="Пьяное вождение",Text="Управление авто при алкоголе выше нормы. Штраф до 10.000 руб.",Codec="ДК РФ",Type="административная",Fine="10000"},
            new PopItem{Number="17",Title="Телефон за рулем",Text="Использование телефона за рулем. Штраф до 7.000 руб.",Codec="ДК РФ",Type="административная",Fine="7000"},
            new PopItem{Number="37",Title="Езда по обочине",Text="Движение по обочинам и тротуарам. Штраф до 4.000 руб.",Codec="ДК РФ",Type="административная",Fine="4000"},
            new PopItem{Number="42",Title="Незаконная парковка",Text="Стоянка в запрещенных местах. Штраф до 5.000 руб.",Codec="ДК РФ",Type="административная",Fine="5000"},
            new PopItem{Number="7",Title="Неподчинение сотруднику",Text="Невыполнение требования об остановке. Штраф до 7.000 руб.",Codec="ДК РФ",Type="административная",Fine="7000"},
        };

        Handbook = new HbItem[] {
            new HbItem{Id="osn",Title="Основания для задержания",Content=new[]{"Лицо застигнуто в момент преступления","На лице/одежде следы преступления","Постановление или ордер","Лицо в розыске","Фото/видео фиксация"}},
            new HbItem{Id="por",Title="Порядок задержания",Content=new[]{"Надеть наручники","Представиться","Сообщить причину","Зачитать Миранду","Обыск","Установить личность","Снять маску","Объявить розыск","Доставить в КПЗ","Вызвать адвоката","Вызвать прокурора","Вызвать начальника"}},
            new HbItem{Id="vrm",Title="Время задержания",Content=new[]{"Адвокат/прокурор 3 мин","Начальство 6 мин","Ожидание 10 мин","Max 60 мин"}},
            new HbItem{Id="arst",Title="Порядок ареста",Content=new[]{"Вторичный обыск","Уровень розыска","Огласить статьи","Оформить арест"}},
            new HbItem{Id="mrd",Title="Миранда",Content=new[]{"Вы имеете право хранить молчание...","Зачитать повторно"}},
            new HbItem{Id="sbk",Title="Субъекты задержания",Content=new[]{"Проводящий+2","Задержанный","Адвокат","Прокурор","СК","Советник ГП","Глава коллегии адвокатов","Руководитель","Министр юстиции","УБОП","СМИ","Медик","ФСБ"}},
            new HbItem{Id="zps",Title="Передача записи",Content=new[]{"Прокурору","СК","Суду","Руководству"}},
            new HbItem{Id="lcn",Title="Установка личности",Content=new[]{"Наручники","Представиться","Снять маску","Проверить доки","Обыск","Нелегал-задержание","Нет-отпустить"}},
            new HbItem{Id="svb",Title="Освобождение",Content=new[]{"Нет лишения свободы","Нет доказательств","Непричастность","Примирение","Работа с УБОП","Нет прокурора"}},
            new HbItem{Id="dsm",Title="Личный досмотр",Content=new[]{"Объект/ордер/согласие","Как первичный обыск"}},
            new HbItem{Id="prz",Title="Презумпция невиновности",Content=new[]{"Невиновен до доказательства","Не обязан доказывать","Сомнения в пользу"}},
        };
    }

    public static void LoadAll()
    {
        try {
            if (File.Exists(FavoritesFile)) {
                var set = new HashSet<string>(File.ReadAllLines(FavoritesFile));
                foreach (var a in Popular) if (set.Contains(a.Number)) a.IsFavorite = true;
            }
        } catch {}

        try {
            if (File.Exists(NotesFile)) {
                NoteItem cur = null;
                foreach (var l in File.ReadAllLines(NotesFile)) {
                    if (l.StartsWith("## ")) {
                        cur = new NoteItem();
                        long.TryParse(l.Substring(2), out cur.Id);
                        Notes.Add(cur);
                    } else if (l.StartsWith("!! ") && cur != null) {
                        cur.Title = l.Substring(3);
                    } else if (l.StartsWith("- [") && cur != null) {
                        bool done = l.Length > 3 && l[3] == 'x';
                        string txt = l.Length > 6 ? l.Substring(6) : "";
                        cur.Items.Add(new CheckItem { Text = txt, Done = done });
                    }
                }
            }
        } catch {}

        try {
            if (File.Exists(AiFile)) {
                foreach (var l in File.ReadAllLines(AiFile)) {
                    int idx = l.IndexOf('|');
                    if (idx > 0) AiHistory.Add(new AiMsg { Role = l.Substring(0, idx), Content = l.Substring(idx + 1).Replace("\\n", "\n") });
                }
            }
        } catch {}
    }

    public static void SaveFavorites() {
        try { var l = new List<string>(); foreach (var a in Popular) if (a.IsFavorite) l.Add(a.Number); File.WriteAllLines(FavoritesFile, l); } catch {} }
    public static void SaveNotes() {
        try { var l = new List<string>(); foreach (var n in Notes) { l.Add("## " + n.Id); l.Add("!! " + (n.Title ?? "")); foreach (var i in n.Items) l.Add("- [" + (i.Done ? "x" : " ") + "] " + (i.Text ?? "")); } File.WriteAllLines(NotesFile, l); } catch {} }
    public static void SaveAiHistory() {
        try { var l = new List<string>(); foreach (var m in AiHistory) l.Add(m.Role + "|" + (m.Content ?? "").Replace("\n", "\\n")); File.WriteAllLines(AiFile, l); } catch {} }
    public static void SaveAll() { SaveFavorites(); SaveNotes(); SaveAiHistory(); }
}