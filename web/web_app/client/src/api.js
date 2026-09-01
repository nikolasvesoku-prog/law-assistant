// Локальные вызовы Rust-команды (Tauri). Никакого сервера и ключей — всё вшито в приложение.
// В браузере (vite dev) работает фолбэк, читающий codecs/*.json напрямую.

// Вызов Rust-команды (Tauri). В Tauri аргументы в camelCase,
// в Rust — соответствующие snake_case параметры.
function invoke(cmd, args) {
  if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
    return window.__TAURI__.core.invoke(cmd, args || {})
  }
  return browserInvoke(cmd, args || {})
}

/* ================= Браузерный фолбэк (без Tauri) ================= */

const FAV_KEY = 'law_helper_favs_v1'

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || [] } catch (e) { return [] }
}
function saveFavs(list) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)) } catch (e) {}
}

let manifestCache = null
let codecCache = {} // id -> codec object (with articles)

function codecPrefix(id) {
  const map = {
    ugolovnyi_kodeks: 'uk',
    кодекс_об_административных_правонарушени: 'coap',
    дорожный_кодекс_российской_федерации: 'road',
  }
  return map[id] || id
}

function makeKey(codec, article) {
  return codecPrefix(codec.id) + ':' + String(article.number).replace(/^ст\.\s*/, '')
}

async function getManifest() {
  if (manifestCache) return manifestCache
  const r = await fetch('/manifest.json')
  if (!r.ok) throw new Error('manifest ' + r.status)
  manifestCache = await r.json()
  return manifestCache
}

async function getCodec(codec) {
  if (codecCache[codec.id]) return codecCache[codec.id]
  const r = await fetch('/' + codec.file)
  if (!r.ok) throw new Error(codec.file + ' ' + r.status)
  const j = await r.json()
  codecCache[codec.id] = j
  return j
}

async function collectArticles() {
  const manifest = await getManifest()
  const all = []
  for (const c of manifest) {
    const j = await getCodec(c)
    ;(j.articles || []).forEach((a) => {
      all.push({
        key: makeKey(c, a),
        number: a.number,
        title: a.title,
        text: a.text,
        fine: a.fine != null ? Number(a.fine) : null,
        stars: a.stars != null ? Number(a.stars) : null,
        variable: !!a.variable,
        note: a.note || '',
        type: a.type || 'прочее',
        category: a.category || '',
        codec_id: c.id,
        codec_name: c.short_name || c.name,
        codec_short: c.short_name || c.name,
      })
    })
  }
  return all
}

async function browserInvoke(cmd, args) {
  switch (cmd) {
    case 'get_codecs': {
      const manifest = await getManifest()
      return {
        codecs: manifest.map((c) => ({
          id: c.id,
          name: c.name,
          short_name: c.short_name,
          articles_count: c.articles_count,
        })),
      }
    }
    case 'get_articles': {
      const all = await collectArticles()
      const favs = loadFavs()
      const favSet = new Set(favs)
      const q = String(args.q || '').trim().toLowerCase()
      const codecId = String(args.codecId || '').trim()
      const articleType = String(args.articleType || '').trim()

      const scoped = codecId ? all.filter((a) => a.codec_id === codecId) : all
      const type_counts = { административная: 0, уголовная: 0, прочее: 0 }
      scoped.forEach((a) => { type_counts[a.type] = (type_counts[a.type] || 0) + 1 })

      let list = scoped.map((a) => ({ ...a, is_fav: favSet.has(a.key) }))
      if (args.favorites) list = list.filter((a) => a.is_fav)
      if (q) {
        list = list.filter((a) =>
          (a.title || '').toLowerCase().includes(q) || (a.number || '').toLowerCase().includes(q)
        )
      }
      if (articleType) list = list.filter((a) => a.type === articleType)
      return { articles: list, favorites_count: favs.length, type_counts }
    }
    case 'toggle_favorite': {
      let favs = loadFavs()
      const k = args.articleKey
      if (args.favorite) {
        if (favs.indexOf(k) === -1) favs.push(k)
      } else {
        favs = favs.filter((x) => x !== k)
      }
      saveFavs(favs)
      return { is_fav: !!args.favorite }
    }
    case 'get_favorites_count': {
      return loadFavs().length
    }
    case 'open_note':
    case 'open_helper': {
      return 'note_web'
    }
    case 'gigachat_ask': {
      const q = (args.question || '').toString().trim()
      if (!q) return ''
      return (
        'Браузерная версия: ИИ-помощник работает только в десктопном приложении.\n\n' +
        'Ваш вопрос: ' + q
      )
    }
    case 'ai_new_dialog': return 'web_dialog'
    case 'ai_list_dialogs': return { dialogs: [] }
    case 'ai_get_history': return { history: [] }
    case 'ai_rename_dialog': return {}
    case 'ai_delete_dialog': return {}
    case 'situation_check': return 'Браузерная версия: анализ ситуации доступен в десктопном приложении.'
    default:
      return Promise.reject(new Error('Нет команды в браузере: ' + cmd))
  }
}

export const api = {
  getCodecs() {
    return invoke('get_codecs')
  },
  getArticles(params = {}) {
    return invoke('get_articles', {
      q: params.q || '',
      codecId: params.codec_id || '',
      articleType: params.article_type || '',
      favorites: !!params.favorites,
    })
  },
  toggleFavorite(articleKey, favorite) {
    return invoke('toggle_favorite', { articleKey, favorite })
  },
  getFavoritesCount() {
    return invoke('get_favorites_count')
  },
  askAi(question, history, conversationId, mode = 'auto') {
    return invoke('gigachat_ask', { question, history: history || [], conversationId, mode })
  },
  checkSituation(description, conversationId) {
    return invoke('situation_check', { description, conversationId })
  },
  getAiHistory(limit = 50, conversationId) {
    return invoke('ai_get_history', { limit, conversationId })
  },
  aiNewDialog() {
    return invoke('ai_new_dialog')
  },
  aiListDialogs() {
    return invoke('ai_list_dialogs')
  },
  aiRenameDialog(conversationId, title) {
    return invoke('ai_rename_dialog', { conversationId, title })
  },
  aiDeleteDialog(conversationId) {
    return invoke('ai_delete_dialog', { conversationId })
  },
  openNote() {
    return invoke('open_note')
  },
  openHelper() {
    return invoke('open_helper')
  },
}
