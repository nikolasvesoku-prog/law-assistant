import React, { useEffect, useRef, useState } from 'react'
import { Search, Sparkles, X, Layers, Pin, FilePlus, Send, ChevronUp, ChevronDown, ChevronRight, Bookmark, Clipboard, BookOpen, Star } from 'lucide-react'
import logo from '../assets/logo.png'
import { api } from '../api'
import { POPULAR_ARTICLES } from './popular_articles.js'
import { HANDBOOK_SECTIONS } from './handbook_sections.js'

const tw = window.__TAURI__
const invoke = (cmd, args) => { try { tw?.core?.invoke?.(cmd, args) } catch {} }

function Stars({ value }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} style={{ color: i <= value ? 'var(--star)' : 'var(--star-empty)', fill: i <= value ? 'var(--star)' : 'transparent', marginRight: 1 }} />
      ))}
    </span>
  )
}

function effectiveStars(article) {
  if (article.variable) return null
  if (article.stars != null && article.stars > 0) return article.stars
  const mins = inGameMinutes(article.text)
  if (mins != null && mins > 0) return Math.max(1, Math.min(5, Math.round(mins / 10)))
  return null
}

function inGameMinutes(text) {
  if (!text) return null
  let best = null, re = /(?:до|от|на срок)\s*(\d+)\s*мес(?:\s*(?:до|по)\s*(\d+)\s*мес)?/gi, m
  while ((m = re.exec(text)) !== null) { const v = Math.max(+m[1], +(m[2]||m[1])); if (best === null || v > best) best = v }
  return best
}

function MiniBadge({ type }) {
  const cls = type === 'административная' ? 'admin' : type === 'уголовная' ? 'crim' : 'other'
  const label = type === 'административная' ? 'Административная' : type === 'уголовная' ? 'Уголовная' : 'Прочее'
  return <span className={`badge ${cls}`}>{label}</span>
}

function MiniArticleCard({ article, onSelect, onToggleFav }) {
  const estars = effectiveStars(article)
  const showStars = article.type !== 'административная' && estars != null
  const showFine = article.type === 'административная' && article.fine != null
  return (
    <div className="card clickable" style={{ padding: '10px 12px', marginBottom: 6 }} onClick={onSelect}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', marginTop: 1 }}>{article.number}</span>
        <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{(article.title || '').length > 70 ? article.title.slice(0, 67) + '...' : article.title}</span>
        {article.codec_id != null && (
          <button className="ghost" style={{ fontSize: 14, padding: '2px 2px', color: 'var(--star)' }} onClick={e => { e.stopPropagation(); onToggleFav(article) }}>
            <Star size={15} fill={article.is_fav ? 'var(--star)' : 'none'} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <MiniBadge type={article.type} />
        {showFine && <span style={{ color: 'var(--accent-text)', fontWeight: 600, fontSize: 12 }}>{Number(article.fine).toLocaleString('ru-RU')} ₽</span>}
        {showStars && <Stars value={Number(estars)} />}
        <span className="tiny muted" style={{ marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.codec_name || article.category}</span>
      </div>
    </div>
  )
}

export default function HelperWindow() {
  const [tab, setTab] = useState('search')
  const [collapsed, setCollapsed] = useState(false)
  const [onTop, setOnTop] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => { document.title = 'Помощник' }, [])

  function drag(e) { if (pinned || e.target.closest('button')) return; }

  async function close() { invoke('helper_hide') }

  async function toggleCollapse() {
    if (!collapsed) { await invoke('helper_collapse'); setCollapsed(true) }
    else { await invoke('helper_restore'); setCollapsed(false) }
  }

  async function toggleOnTop() {
    const n = !onTop
    invoke('helper_toggle_top', { onTop: n })
    setOnTop(n)
  }
  async function togglePin() {
    const n = !pinned
    invoke('helper_toggle_pin', { pinned: n })
    setPinned(n)
  }

  const tabBtn = (t, label, Icon) => (
    <button className={tab === t ? 'active' : 'ghost'} onClick={() => setTab(t)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <Icon size={14} /> {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 50, flexShrink: 0, background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', userSelect: 'none' }} onMouseDown={e => { if (!pinned && !e.target.closest('button')) invoke('helper_start_drag') }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 12, flex: 1, minWidth: 0 }}>
          <img src={logo} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Помощник</span>
        </div>
        <div style={{ display: 'flex', paddingRight: 6 }} onMouseDown={e => e.stopPropagation()}>
          <button className="note-btn" onClick={toggleOnTop} style={onTop ? { color: '#e53935' } : undefined}><Layers size={15} /></button>
          <button className="note-btn" onClick={togglePin} style={pinned ? { color: '#e53935' } : undefined}><Pin size={15} /></button>
          <button className="note-btn" onClick={() => invoke('open_note')}><FilePlus size={15} /></button>
          <button className="note-btn" onClick={toggleCollapse}>{collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>
          <button className="note-btn" onClick={close} style={{ color: '#eb5050' }}><X size={15} /></button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div style={{ display: 'flex', gap: 6, padding: '9px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
            {tabBtn('search', 'Все', Search)}
            {tabBtn('popular', 'Популярные', Bookmark)}
            {tabBtn('handbook', 'Памятка', Clipboard)}
            {tabBtn('fav', 'Избранное', BookOpen)}
            {tabBtn('ai', 'ИИ', Sparkles)}
          </div>
          <div style={{ flex: 1, padding: '12px 14px', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {tab === 'search' && <SearchTab goAi={() => setTab('ai')} />}
            {tab === 'popular' && <PopularTab />}
            {tab === 'handbook' && <HandbookTab />}
            {tab === 'fav' && <FavTab goAi={() => setTab('ai')} />}
            {tab === 'ai' && <AiTab />}
          </div>
        </>
      )}
    </div>
  )
}

function SearchTab({ goAi }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState([])
  const [selected, setSelected] = useState(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const reqId = ++reqRef.current; setLoading(true)
    api.getArticles({ q, codec_id: '', favorites: '' }).then(r => { if (reqId === reqRef.current) setArticles(r.articles || []) }).catch(() => {}).finally(() => { if (reqId === reqRef.current) setLoading(false) })
  }, [q])

  async function toggleFav(a) {
    const next = !a.is_fav; const res = await api.toggleFavorite(a.key, next).catch(() => null)
    if (res) { setArticles(prev => prev.map(x => x.key === a.key ? { ...x, is_fav: res.is_fav } : x)); if (selected?.key === a.key) setSelected({ ...selected, is_fav: res.is_fav }) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0 }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 11, top: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input style={{ paddingLeft: 34 }} placeholder="Поиск по законам..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {loading && <p className="muted small" style={{ padding: 16, textAlign: 'center' }}>Загрузка...</p>}
        {!loading && articles.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}><p className="muted small">Ничего не найдено</p><button className="ghost" style={{ marginTop: 6, color: 'var(--accent-text)' }} onClick={goAi}>Спросить Советника</button></div>}
        {articles.map(a => <MiniArticleCard key={a.key} article={a} onSelect={() => setSelected(a)} onToggleFav={toggleFav} />)}
      </div>
      {selected && <ArticleDetail article={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ArticleDetail({ article, onClose }) {
  return (
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 300, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontWeight: 700, fontSize: 14 }}>{article.number}</span><button className="ghost" onClick={onClose}><X size={16} /></button></div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{article.title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{article.text}</div>
      {article.note && <div className="muted small" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{article.note}</div>}
      {article.fine != null && <div style={{ marginTop: 10, color: 'var(--accent-text)', fontWeight: 700 }}>{Number(article.fine).toLocaleString('ru-RU')} ₽</div>}
    </div>
  )
}

function PopularTab() {
  const [selected, setSelected] = useState(null)
  const list = [...POPULAR_ARTICLES].reverse()
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, position: 'relative' }}>
      {list.map(a => <MiniArticleCard key={a.key} article={a} onSelect={() => setSelected(a)} onToggleFav={() => {}} />)}
      {selected && <ArticleDetail article={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function HandbookTab() {
  const [open, setOpen] = useState({})
  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
      {HANDBOOK_SECTIONS.map(sec => (
        <div key={sec.id} className="card" style={{ padding: 0 }}>
          <button className="ghost" onClick={() => toggle(sec.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 13, textAlign: 'left', flex: 1 }}>{sec.title}</span>
            <ChevronRight size={16} style={{ transform: open[sec.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
          </button>
          {open[sec.id] && (
            <div style={{ padding: '0 12px 12px' }}>
              {sec.images && sec.images.filter(im => im.alt !== 'Погоны ФСБ России').map((im, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <img src={im.src} alt={im.alt} style={{ width: '100%', borderRadius: 8 }} />
                  {im.caption && <div className="tiny muted" style={{ marginTop: 4, textAlign: 'center' }}>{im.caption}</div>}
                </div>
              ))}
              {(['zaderzhanie-poryadok', 'arest-poryadok', 'stadii-sily'].includes(sec.id)) ? (
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.65, color: 'var(--text)' }}>
                  {sec.content.map((line, i) => {
                    const isNote = sec.id === 'stadii-sily' && i === sec.content.length - 1
                    if (isNote) {
                      return <p key={i} style={{ color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4, fontSize: 12 }}>{line}</p>
                    }
                    return <li key={i} style={{ marginBottom: 3 }}>{line}</li>
                  })}
                </ol>
              ) : (
                (sec.content || []).map((line, i) => {
                  const isBullet = line.trim().startsWith('—')
                  return <p key={i} style={{ fontSize: 12, lineHeight: 1.55, margin: '4px 0', paddingLeft: isBullet ? 6 : 0, color: isBullet ? 'var(--text-secondary)' : 'var(--text)', fontWeight: isBullet ? 400 : 500 }}>{line}</p>
                })
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FavTab({ goAi }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { refresh() }, [])

  function refresh() { setLoading(true); api.getArticles({ q: '', codec_id: '', favorites: '1' }).then(r => setArticles(r.articles || [])).catch(() => {}).finally(() => setLoading(false)) }

  async function toggleFav(a) {
    const res = await api.toggleFavorite(a.key, !a.is_fav).catch(() => null)
    if (res) { setArticles(prev => prev.filter(x => x.key !== a.key)); if (selected?.key === a.key) setSelected(null) }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, position: 'relative' }}>
      {loading && <p className="muted small" style={{ padding: 16, textAlign: 'center' }}>Загрузка...</p>}
      {!loading && articles.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}><p className="muted small">В избранном пусто.</p></div>}
      {articles.map(a => <MiniArticleCard key={a.key} article={a} onSelect={() => setSelected(a)} onToggleFav={toggleFav} />)}
      {selected && <ArticleDetail article={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function AiTab() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chatRef = useRef(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages, busy])

  async function send(e) {
    e.preventDefault(); const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next); setInput(''); setBusy(true); setError('')
    try {
      const history = next.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const reply = await api.askAi(text, history, null, 'auto')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) { setError(typeof err === 'string' ? err : err?.message || err?.toString() || 'Ошибка') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, padding: '2px 2px 10px' }}>
        {messages.length === 0 && <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: 320 }}><Sparkles size={24} color="var(--accent-text)" style={{ marginBottom: 8 }} /><p className="muted small">Вопрос или описание ситуации</p></div>}
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? { alignSelf: 'flex-end', maxWidth: '84%', background: 'var(--accent-soft)', border: '1px solid rgba(229,57,53,0.25)', borderRadius: 12, padding: '8px 12px' } : { alignSelf: 'flex-start', maxWidth: '90%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px' }}>
            <div className="tiny muted" style={{ marginBottom: 3 }}>{m.role === 'user' ? 'Вы' : 'ИИ'}</div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="muted small">Формирую ответ…</div>}
        {error && <p style={{ color: 'var(--accent)', fontSize: 12 }}>{error}</p>}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 8, alignItems: 'stretch' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Вопрос или описание..." rows={2} disabled={busy} style={{ flex: 1, resize: 'none', minWidth: 0, fontSize: 13 }} />
        <button type="submit" className="primary" disabled={busy || !input.trim()} style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={18} /></button>
      </form>
    </div>
  )
}
