// Локальные вызовы Rust-команды (Tauri). Никакого сервера и ключей — всё вшито в приложение.

// Вызов Rust-команды (Tauri). В Tauri аргументы в camelCase,
// в Rust — соответствующие snake_case параметры.
function invoke(cmd, args) {
  if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
    return window.__TAURI__.core.invoke(cmd, args || {})
  }
  return Promise.reject(new Error('Приложение запущено вне Tauri'))
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
