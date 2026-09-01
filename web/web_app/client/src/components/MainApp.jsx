import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Search,
  Star,
  FileText,
  BookOpen,
  Landmark,
  Scale,
  Bookmark,
  Clipboard,
  ChevronRight,
  X,
  Sparkles,
  Send,
  Plus,
  History,
  Calculator,
  Trash2,
} from 'lucide-react'
import { api } from '../api'
import logo from '../assets/logo.png'
import { POPULAR_ARTICLES } from './popular_articles.js'
import { HANDBOOK_SECTIONS } from './handbook_sections.js'
import { UPDATES_HISTORY } from './updates_history.js'

function hl(text, q) {
  if (!q || !text) return text
  const qq = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp('(' + qq + ')', 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === qq.toLowerCase()
      ? '<mark style="background:#e53935;color:#fff;border-radius:2px;padding:0 2px">' + part + '</mark>'
      : part
  ).join('')
}

function Stars({ value }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          style={{
            color: i <= value ? 'var(--star)' : 'var(--star-empty)',
            fill: i <= value ? 'var(--star)' : 'transparent',
            marginRight: 1,
          }}
        />
      ))}
    </span>
  )
}

export function typeBadge(type) {
  const cls = type === 'административная' ? 'admin' : type === 'уголовная' ? 'crim' : 'other'
  const label =
    type === 'административная'
      ? 'Административная'
      : type === 'уголовная'
        ? 'Уголовная'
        : 'Прочее'
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function MainApp({ license, onLogout }) {
  const [codecs, setCodecs] = useState([])
  const [articles, setArticles] = useState([])
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [popType, setPopType] = useState('')
  const [view, setView] = useState('all') // 'all' | 'fav' | 'main' | 'calc' | 'codec:<id>'
  const [selected, setSelected] = useState(null)
  const [typeCounts, setTypeCounts] = useState({})
  const [mainCount, setMainCount] = useState(0)
  const [calcItems, setCalcItems] = useState([])
  const [calcQ, setCalcQ] = useState('')
  const reqIdRef = useRef(0)

  useEffect(() => {
    // количество «популярных» статей для счётчика в меню
    setMainCount(POPULAR_ARTICLES.length)
  }, [])

  const refresh = async () => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError('')
    if (view === 'main') {
      // Популярные статьи: статический список, фильтруем по поиску
      try {
        const bySearch = q
          ? POPULAR_ARTICLES.filter((a) => (a.number + ' ' + a.title + ' ' + a.text + ' ' + a.note).toLowerCase().includes(q.toLowerCase()))
          : POPULAR_ARTICLES
        if (reqId !== reqIdRef.current) return
        setArticles(bySearch)
        setFavoritesCount(0)
        setTypeCounts({})
      } catch (e) {
        setError(e.message)
      } finally {
        if (reqId === reqIdRef.current) setLoading(false)
      }
      return
    }
    const favOnly = view === 'fav'
    const codecId = view.startsWith('codec:') ? view.slice(6) : ''
    try {
const [cRes, aRes] = await Promise.all([
        api.getCodecs(),
        api.getArticles({ q, codec_id: codecId, article_type: typeFilter, favorites: favOnly }),
      ])
      if (reqId !== reqIdRef.current) return
      setCodecs(cRes?.codecs || [])
      setArticles(aRes?.articles || [])
      setFavoritesCount(aRes?.favorites_count || 0)
      setTypeCounts(aRes?.type_counts || {})
    } catch (e) {
      setError(e.message)
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(refresh, 250)
    return () => clearTimeout(t)
  }, [q, typeFilter, view])

  const currentCodec = view.startsWith('codec:') ? codecs.find((c) => c.id === view.slice(6)) : null
  const totalInCodecs = codecs.reduce((s, c) => s + (c.articles_count || 0), 0)
  const totalInDb = Math.max(totalInCodecs, articles.length)
  const displayArticles = (() => {
    let list = articles
    if (typeFilter) list = list.filter((a) => a.type === typeFilter)
    // Сортировка по номеру статьи (1.1, 1.10, 2.1, ...)
    list = [...list].sort((a, b) => {
      const na = parseFloat(a.number.replace(/[^0-9.]/g, ''))
      const nb = parseFloat(b.number.replace(/[^0-9.]/g, ''))
      if (na !== nb) return na - nb
      return a.number.localeCompare(b.number)
    })
    return list
  })()
  const displayTypeCounts = (() => {
    const counts = { административная: 0, уголовная: 0, прочее: 0 }
    articles.forEach((a) => { if (counts[a.type] != null) counts[a.type]++ })
    return counts
  })()
  const popularList = q
    ? POPULAR_ARTICLES.filter((a) =>
        `${a.number} ${a.title} ${a.text} ${a.note}`.toLowerCase().includes(q.toLowerCase())
      ).reverse()
    : [...POPULAR_ARTICLES].reverse()
    ;
  const popList = popType ? popularList.filter((a) => a.type === popType) : popularList
  const popTypes = {
    административная: POPULAR_ARTICLES.filter((a) => a.type === 'административная').length,
    уголовная: POPULAR_ARTICLES.filter((a) => a.type === 'уголовная').length,
    прочее: POPULAR_ARTICLES.filter((a) => a.type === 'прочее').length,
  }

  async function toggleFav(a) {
    const next = !a.is_fav
    const res = await api.toggleFavorite(a.key, next)
    setArticles((prev) => prev.map((x) => (x.key === a.key ? { ...x, is_fav: res.is_fav } : x)))
    setFavoritesCount((c) => c + (next ? 1 : -1))
    if (selected?.key === a.key) setSelected({ ...selected, is_fav: next })
  }

  async function createNote() {
    try {
      const label = await api.openHelper()
      return label
    } catch (e) {
      console.error(e)
      return null
    }
  }

  return (
    <div style={styles.app}>
      {/* Боковое меню */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <img src={logo} alt="Логотип" style={styles.logoImg} />
          <div>
            <div style={styles.logoTitle}>Правовой помощник</div>
            <div className="tiny muted">Справочник законов</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            style={{ paddingLeft: 36, paddingRight: 40 }}
            placeholder="Поиск по законам..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            title="Помощник (база, ИИ, заметки)"
            onClick={createNote}
            style={{ position: 'absolute', right: 6, top: 6, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent-text)', cursor: 'pointer' }}
          >
            <Plus size={16} style={{ width: 16, height: 16, flexShrink: 0, display: 'block' }} />
          </button>
        </div>

        <nav style={styles.nav}>
          <button
            className={view === 'all' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('all')}
          >
            <BookOpen size={17} /> Все статьи <span className="muted" style={{ marginLeft: 'auto' }}>{totalInDb}</span>
          </button>
          <button
            className={view === 'main' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('main')}
          >
            <Bookmark size={17} /> Популярные статьи <span className="muted" style={{ marginLeft: 'auto' }}>{mainCount}</span>
          </button>
          <button
            className={view === 'handbook' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('handbook')}
          >
            <Clipboard size={17} /> Памятка <span className="muted" style={{ marginLeft: 'auto' }}>{HANDBOOK_SECTIONS.length}</span>
          </button>
          <button
            className={view === 'calc' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('calc')}
          >
            <Calculator size={17} /> Калькулятор штрафов <span className="muted" style={{ marginLeft: 'auto' }}>{calcItems.length}</span>
          </button>
          <button
            className={view === 'fav' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('fav')}
          >
            <Star size={17} /> Избранное <span className="muted" style={{ marginLeft: 'auto' }}>{favoritesCount}</span>
          </button>
          <button
            className={view === 'ai' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('ai')}
          >
            <Sparkles size={17} /> ИИ-помощник
          </button>

          <div style={styles.navDivider}>КОДЕКСЫ</div>
          {codecs.map((c) => (
            <button
              key={c.id}
              className={view === `codec:${c.id}` ? 'active' : 'ghost'}
              style={styles.navBtn}
              onClick={() => setView(`codec:${c.id}`)}
            >
              <FileText size={17} style={{ color: 'var(--accent-text)', flexShrink: 0 }} /> <span style={styles.navLabel}>{c.short_name || c.name}</span>
                <span className="muted" style={{ marginLeft: 'auto', flexShrink: 0 }}>{c.articles_count}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <button
            className={view === 'updates' ? 'active' : 'ghost'}
            style={styles.navBtn}
            onClick={() => setView('updates')}
          >
            <History size={17} style={{ color: 'var(--accent-text)', flexShrink: 0 }} /> Обновления
          </button>
          <div className="tiny muted" style={{ padding: '10px 6px 2px' }}>
            Версия <AppVersion />
          </div>
        </div>
      </aside>

      {/* Контент */}
      <main style={styles.main}>
        <div style={styles.contentHeader}>
          <h1 style={styles.h1}>
            {view === 'all' && 'Все статьи'}
            {view === 'fav' && 'Избранное'}
            {view === 'main' && 'Популярные статьи'}
            {view === 'handbook' && 'Памятка'}
            {view === 'ai' && 'ИИ-помощник'}
            {view === 'calc' && 'Калькулятор штрафов'}
            {view === 'updates' && 'Обновления'}
            {currentCodec && currentCodec.name}
          </h1>
          <span className="tiny muted">
            {view === 'all' && `Найдено: ${articles.length}`}
            {view === 'fav' && `В избранном: ${favoritesCount}`}
            {view === 'main' && `Статей: ${articles.length}`}
            {view === 'handbook' && `Разделов: ${HANDBOOK_SECTIONS.length}`}
            {currentCodec && `Статей: ${currentCodec.articles_count}`}
          </span>
        </div>

        {view === 'all' && !loading && codecs.length === 0 && articles.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: 34, marginBottom: 10 }}><Scale size={34} color="var(--text-muted)" /></div>
            <p className="muted small">Кодексы пока не добавлены. Положите файлы в папку codecs.</p>
          </div>
        )}

        {view === 'all' && !loading && codecs.length > 0 && articles.length === 0 && !q && (
          <div style={styles.codecGrid}>
            {codecs.map((c) => (
              <div key={c.id} className="card clickable" style={styles.codecCard} onClick={() => setView(`codec:${c.id}`)}>
                <div style={styles.codecEmblem}>
                  <Landmark size={24} color="var(--accent-text)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.short_name || c.name}</div>
                <div className="tiny muted">{c.name}</div>
                <div className="tiny" style={{ color: 'var(--accent-text)', marginTop: 8 }}>
                  {c.articles_count} ст.
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'main' && (
          <>
            <div style={styles.filters}>
              <button className={popType === '' ? 'active' : 'ghost'} onClick={() => setPopType('')}>
                Все типы <span className="muted">{popularList.length}</span>
              </button>
              {[
                ['административная', 'Административные'],
                ['уголовная', 'Уголовные'],
                ['прочее', 'Прочее'],
              ].map(([t, label]) => (
                <button key={t} className={popType === t ? 'active' : 'ghost'} onClick={() => setPopType(popType === t ? '' : t)}>
                  {label} <span className="muted"> {popTypes[t] || 0}</span>
                </button>
              ))}
            </div>
            <div style={styles.articleList}>
              {popList.length === 0 ? (
                <div style={styles.empty}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}><Bookmark size={30} color="var(--text-muted)" /></div>
                  <p className="muted small">Ничего не найдено. Измените запрос.</p>
                </div>
              ) : (
                popList.map((a) => (
                  <ArticleBlock key={a.key} article={a} onSelect={() => setSelected(a)} onToggleFav={toggleFav} query={q} />
                ))
              )}
            </div>
          </>
        )}

        {view === 'handbook' && (
          <HandbookPanel />
        )}

        {view === 'ai' && (
          <AIChatPanel />
        )}

        {view === 'calc' && (
          <CalcPanel
            articles={articles}
            calcItems={calcItems}
            setCalcItems={setCalcItems}
            calcQ={calcQ}
            setCalcQ={setCalcQ}
          />
        )}

        {view === 'updates' && (
          <UpdatesPanel />
        )}

        {view !== 'main' && view !== 'handbook' && view !== 'ai' && view !== 'calc' && view !== 'updates' && ((view !== 'all' && view !== 'main') || q || (view === 'all' && articles.length > 0)) && (
          <>
            {!view.startsWith('codec:') && (
              <div style={styles.filters}>
                <button className={typeFilter === '' ? 'active' : 'ghost'} onClick={() => setTypeFilter('')}>
                  Все типы <span className="muted">{articles.length}</span>
                </button>
                {['административная', 'уголовная', 'прочее'].map((t) => (
                  <button
                    key={t}
                    className={typeFilter === t ? 'active' : 'ghost'}
                    onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                  >
                    {t === 'административная' ? 'Административные' : t === 'уголовная' ? 'Уголовные' : 'Прочее'}
                    <span className="muted"> {displayTypeCounts[t] || 0}</span>
                  </button>
                ))}
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}
            {loading && <p className="muted small" style={{ padding: 30, textAlign: 'center' }}>Загрузка...</p>}

            {!loading && !error && displayArticles.length === 0 && (
              <div style={styles.empty}>
                <div style={{ fontSize: 30, marginBottom: 8 }}><Search size={30} color="var(--text-muted)" /></div>
                <p className="muted small">Ничего не найдено. Измените запрос или фильтры.</p>
              </div>
            )}

            <div style={styles.articleGrid}>
              {displayArticles.map((a) => (
                <ArticleBlock key={a.key} article={a} onSelect={() => setSelected(a)} onToggleFav={toggleFav} query={q} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Детали статьи */}
      {selected && (
        <aside style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <span className="tiny muted">{selected.codec_name}</span>
            <button className="ghost" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
          </div>
          <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{selected.number}</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '6px 0 12px' }}>{selected.title || 'Без названия'}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
            {typeBadge(selected.type)}
            <span className="tiny muted">{selected.category || selected.codec_category}</span>
          </div>

          {(selected.type === 'административная' && selected.fine != null) && (
            <div className="card" style={styles.metric}>
              <span className="tiny muted">Штраф</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-text)' }}>
                {Number(selected.fine).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          )}
          {(() => {
            const s = effectiveStars(selected)
            const mins = inGameMinutes(selected.text)
            if (s != null) {
              return (
                <div className="card" style={styles.metric}>
                  <span className="tiny muted">Сложность</span>
                  <div style={{ marginTop: 4 }}><Stars value={Number(s)} /></div>
                  {mins != null && <div className="tiny muted">1 звезда = 10 месяцев</div>}
                </div>
              )
            }
            return null
          })()}
          {!selected.variable && inGameMinutes(selected.text) && (
            <div className="card" style={styles.metric}>
              <span className="tiny muted">⏱ Срок в игре</span>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--star)' }}>
                {inGameMinutes(selected.text)} мин
              </div>
              <div className="tiny muted">1 месяц = 1 минута</div>
            </div>
          )}

          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', marginTop: 16 }}>{selected.text || '—'}</p>

          {selected.note && (
            <>
              <div className="tiny muted" style={{ marginTop: 16, fontWeight: 600 }}>Примечание</div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-muted)', marginTop: 4 }}>{selected.note}</p>
            </>
          )}

          {selected.codec_id != null && (
            <button
              className={selected.is_fav ? 'primary' : 'outline'}
              style={{ width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => toggleFav(selected)}
            >
              <Star size={17} fill={selected.is_fav ? '#fff' : 'none'} />
              {selected.is_fav ? 'В избранном' : 'В избранное'}
            </button>
          )}
        </aside>
      )}
    </div>
  )
}

// Подсветка поиска
function highlightText(text, query) {
  if (!query || !text) return text
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${q})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? `<mark style="background:#e53935;color:#fff;border-radius:2px;padding:0 2px">${part}</mark>`
      : part
  ).join('')
}
// Извлекает максимальный срок в месяцах из текста санкции.
// Звёзды статьи: если заданы явно — используем их, иначе считаем из срока лишения свободы
// по правилу «1 звезда = 10 месяцев».
function effectiveStars(article) {
  if (article.variable) return null
  if (article.stars != null && article.stars > 0) return article.stars
  const mins = inGameMinutes(article.text)
  if (mins != null && mins > 0) {
    const s = Math.round(mins / 10)
    return Math.max(1, Math.min(5, s))
  }
  return null
}

function inGameMinutes(text) {
  if (!text) return null
  let best = null
  const re = /(?:до|от|на срок)\s+(\d+)\s*мес(?:\s*(?:до|по)\s*(\d+)\s*мес)?/gi
  let m
  while ((m = re.exec(text)) !== null) {
    const a = parseInt(m[1], 10)
    const b = m[2] ? parseInt(m[2], 10) : a
    const v = Math.max(a, b)
    if (best === null || v > best) best = v
  }
  return best
}

function HandbookPanel() {
  const [open, setOpen] = useState({})
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hb_checks') || '{}') } catch { return {} }
  })
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const saveChecks = (next) => {
    setChecks(next)
    localStorage.setItem('hb_checks', JSON.stringify(next))
  }
  const toggleCheck = (secId, idx) => {
    const key = secId + ':' + idx
    const next = { ...checks, [key]: !checks[key] }
    saveChecks(next)
  }
  const clearChecks = (secId) => {
    const next = { ...checks }
    Object.keys(next).forEach((k) => { if (k.startsWith(secId + ':')) delete next[k] })
    saveChecks(next)
  }
  const numberedIds = ['zaderzhanie-poryadok', 'arest-poryadok', 'stadii-sily']
  return (
    <div style={styles.handbook}>
      <p className="muted small" style={{ marginBottom: 14 }}>
        Справочные материалы для сотрудников правоохранительных органов.
      </p>
      {HANDBOOK_SECTIONS.map((sec) => {
        const total = sec.id === 'zaderzhanie-poryadok' ? sec.content.length : 0
        const done = sec.id === 'zaderzhanie-poryadok' ? sec.content.filter((_, i) => checks[sec.id + ':' + i]).length : 0
        return (
          <div key={sec.id} className="card" style={styles.handbookSection}>
            <button
              className="ghost"
              style={styles.handbookHead}
              onClick={() => toggle(sec.id)}
            >
              <span style={{ fontWeight: 600, color: 'var(--primary)', textAlign: 'left', flex: 1 }}>
                {sec.title}
              </span>
              {sec.id === 'zaderzhanie-poryadok' && done > 0 && (
                <span className="tiny muted" style={{ marginRight: 8 }}>{done}/{total}</span>
              )}
              <ChevronRight
                size={18}
                style={{ transform: open[sec.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
              />
            </button>
            {open[sec.id] && (
              <div style={styles.handbookBody}>
                {sec.id === 'zaderzhanie-poryadok' ? (
                  <>
                    <ol style={styles.handbookOl}>
                      {sec.content.map((line, i) => {
                        const checked = !!checks[sec.id + ':' + i]
                        return (
                          <li key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0, padding: '4px 0' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCheck(sec.id, i)}
                                style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                              />
                              <span style={{ textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.5 : 1 }}>
                                {line}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                    {done > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span className="tiny muted">Готово: {done}/{total}</span>
                        <button className="ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => clearChecks(sec.id)}>
                          Очистить
                        </button>
                      </div>
                    )}
                  </>
                ) : numberedIds.includes(sec.id) ? (
                  <ol style={styles.handbookOl}>
                    {sec.content.map((line, i) => {
                      const isNote = sec.id === 'stadii-sily' && i === sec.content.length - 1
                      if (isNote) {
                        return (
                          <p key={i} style={{ ...styles.handbookLine, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>
                            {line}
                          </p>
                        )
                      }
                      return (
                        <li key={i} style={styles.handbookLi}>
                          {line}
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  sec.content.map((line, i) => {
                    const isBullet = line.trim().startsWith('—')
                    return (
                      <p
                        key={i}
                        style={{
                          ...styles.handbookLine,
                          paddingLeft: isBullet ? 6 : 0,
                          color: isBullet ? 'var(--text-secondary)' : 'var(--primary)',
                          fontWeight: isBullet ? 400 : 500,
                        }}
                      >
                        {line}
                      </p>
                    )
                  })
                )}
                {sec.images && sec.images.length > 0 && (
                  <div style={styles.handbookImages}>
                    {sec.images.map((img) => (
                      <figure key={img.src} style={styles.handbookFigure}>
                        <img src={img.src} alt={img.alt} style={styles.handbookImg} />
                        {img.caption && <figcaption style={styles.handbookCaption}>{img.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ArticleBlock({ article, onSelect, onToggleFav, query = '' }) {
  const estars = effectiveStars(article)
  const showStars = article.type !== 'административная' && estars != null
  const showFine = article.type === 'административная' && article.fine != null
  const canFav = article.codec_id != null
  return (
    <div className="card clickable" style={styles.articleCard} onClick={onSelect}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', marginTop: 1 }}>{article.number}</span>
        <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{__html: hl(article.title || '—', query)}} />
        {canFav && (
          <button
            className="ghost"
            style={{ fontSize: 15, padding: '2px 2px', flexShrink: 0, color: 'var(--star)', display: 'flex' }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFav(article)
            }}
          >
            <Star size={17} fill={article.is_fav ? 'var(--star)' : 'none'} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        {typeBadge(article.type)}
        {showFine && <span style={{ color: 'var(--accent-text)', fontWeight: 600, fontSize: 13 }}>{Number(article.fine).toLocaleString('ru-RU')} ₽</span>}
        {showStars && <Stars value={Number(estars)} />}
        <span className="tiny muted" style={{ marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.codec_name || article.category}
        </span>
      </div>
    </div>
  )
}

function UpdatesPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      <p className="muted small" style={{ marginBottom: 2 }}>
        Что появилось в каждой версии приложения.
      </p>
      {UPDATES_HISTORY.map((v) => (
        <div key={v.version} className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-text)' }}>v{v.version}</span>
            <span className="tiny muted">{v.date}</span>
            {v.title && <span style={{ fontWeight: 600, fontSize: 15 }}>{v.title}</span>}
          </div>
          {v.highlights && v.highlights.length > 0 && (
            <ul style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {v.highlights.map((h, i) => (
                <li key={i} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function AppVersion() {
  const [version, setVersion] = useState('')
  useEffect(() => {
    const app = window.__TAURI__?.app
    if (app && app.getVersion) {
      app.getVersion().then((v) => setVersion(v)).catch(() => {})
    }
  }, [])
  return <span>{version || '…'}</span>
}

function AIChatPanel() {
  const [dialogs, setDialogs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chatRef = useRef(null)

  const loadDialogs = () => {
    return api.aiListDialogs().then((res) => {
      const list = (res && res.dialogs) || []
      setDialogs(list)
      return list
    }).catch(() => [])
  }

  // При входе во вкладку ИИ — сразу новый диалог.
  // Если последний диалог пустой (только что создан), переиспользуем его,
  // чтобы не плодить пустые диалоги при повторных заходах.
  useEffect(() => {
    let mounted = true
    loadDialogs().then(async (list) => {
      if (!mounted) return
      const last = list.length > 0 ? list[list.length - 1] : null
      if (last && last.messages === 0) {
        setActiveId(last.id)
        setMessages([])
      } else {
        try {
          const id = await api.aiNewDialog()
          if (!mounted) return
          setDialogs((prev) => [...prev, { id, title: 'Новый диалог', messages: 0 }])
          setActiveId(id)
          setMessages([])
        } catch (err) {
          setError(err.message || 'Не удалось создать диалог')
        }
      }
    })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ensureDialog() {
    if (activeId != null) return activeId
    const id = await api.aiNewDialog()
    setDialogs((prev) => [...prev, { id, title: 'Новый диалог', messages: 0 }])
    setActiveId(id)
    setMessages([])
    return id
  }

  async function newDialog() {
    try {
      const id = await api.aiNewDialog()
      setDialogs((prev) => [...prev, { id, title: 'Новый диалог', messages: 0 }])
      setActiveId(id)
      setMessages([])
      setError('')
    } catch (err) {
      setError(err.message || 'Не удалось создать диалог')
    }
  }

  // При выборе диалога из списка — загружаем его историю
  function selectDialog(id) {
    setActiveId(id)
    setMessages([])
    api.getAiHistory(200, id)
      .then((res) => setMessages((res && res.history) || []))
      .catch(() => {})
    setError('')
  }

  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, busy])

  async function deleteDialog(id) {
    try {
      await api.aiDeleteDialog(id)
      const next = dialogs.filter((d) => d.id !== id)
      setDialogs(next)
      if (activeId === id) {
        setActiveId(null)
        setMessages([])
      }
      setError('')
    } catch (err) {
      setError(err.message || 'Не удалось удалить диалог')
    }
  }

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    setError('')
    try {
      const convId = await ensureDialog()
      const isFirstMessage = messages.length === 0
      const nextMessages = [...messages, { role: 'user', content: text }]
      setMessages(nextMessages)
      const history = nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
      const reply = await api.askAi(text, history, convId, 'auto')
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      // Первый вопрос в диалоге — делаем из него название диалога
      if (isFirstMessage) {
        const title = text.replace(/\s+/g, ' ').trim()
        const shortTitle = title.length > 40 ? title.slice(0, 40).trimEnd() + '…' : title
        try {
          await api.aiRenameDialog(convId, shortTitle || 'Диалог')
        } catch (err) { /* не критично */ }
      }
      loadDialogs()
    } catch (err) {
      setError(err.message || 'Не удалось получить ответ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', alignItems: 'stretch' }}>
      {/* Список диалогов */}
      <div style={styles.aiDialogs}>
        <button className="primary" onClick={newDialog} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginBottom: 12 }}>
          <Plus size={16} /> Новый диалог
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {dialogs.length === 0 && (
            <p className="tiny muted" style={{ textAlign: 'center', marginTop: 20 }}>Диалогов пока нет</p>
          )}
          {dialogs.map((d) => (
            <div
              key={d.id}
              onClick={() => selectDialog(d.id)}
              style={{
                ...styles.aiDialogItem,
                ...(d.id === activeId ? styles.aiDialogItemActive : {}),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <History size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {d.title}
                </span>
              </div>
              <span className="tiny muted" style={{ marginTop: 3 }}>{d.messages} сообщ.</span>
              <button
                className="ghost"
                title="Удалить диалог"
                style={{ position: 'absolute', top: 8, right: 6, padding: 2, opacity: 0.5 }}
                onClick={(ev) => {
                  ev.stopPropagation()
                  deleteDialog(d.id)
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Чат */}
      <div style={styles.aiWrap} ref={chatRef}>
        <div style={styles.aiChat}>
          {messages.length === 0 && (
            <div style={styles.aiEmpty}>
              <Sparkles size={30} color="var(--accent-text)" style={{ marginBottom: 10 }} />
              <p className="muted small" style={{ maxWidth: 440, textAlign: 'center', margin: 0 }}>
                Задайте вопрос по базе игры или опишите ситуацию — помощник сам подберёт статьи, сроки, риски и шаги.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? styles.aiMsgUser : styles.aiMsgBot}>
              <div className="tiny muted" style={{ marginBottom: 4 }}>
                {m.role === 'user' ? 'Вы' : 'ИИ-помощник'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))}
          {busy && (
            <div style={styles.aiMsgBot}>
              <div className="tiny muted" style={{ marginBottom: 4 }}>ИИ-помощник</div>
              <div className="muted small">Формирую ответ…</div>
            </div>
          )}
          {error && <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        </div>

        <form onSubmit={send} style={{ ...styles.aiInputRow, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Вопрос или описание ситуации..."
              disabled={busy}
              rows={2}
              style={{ flex: 1, minWidth: 0, resize: 'none' }}
            />
          </div>
          <button type="submit" className="primary" disabled={busy || !input.trim()} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44 }}>
            <Send size={17} style={{ display: 'block' }} />
          </button>
        </form>
      </div>
    </div>
  )
}

function CalcPanel({ articles, calcItems, setCalcItems, calcQ, setCalcQ }) {
  const fineArticles = useMemo(() => {
    return articles.filter((a) => a.fine != null && Number(a.fine) > 0)
  }, [articles])

  const filtered = useMemo(() => {
    if (!calcQ) return fineArticles
    const q = calcQ.toLowerCase()
    return fineArticles.filter((a) =>
      (a.number + ' ' + a.title + ' ' + a.codec_name).toLowerCase().includes(q)
    )
  }, [fineArticles, calcQ])

  const calcTotal = useMemo(() => {
    return calcItems.reduce((s, k) => {
      const a = fineArticles.find((x) => x.key === k)
      return s + (a ? Number(a.fine) : 0)
    }, 0)
  }, [calcItems, fineArticles])

  function toggleCalc(key) {
    setCalcItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function clearCalc() {
    setCalcItems([])
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            style={{ paddingLeft: 36 }}
            placeholder="Поиск по статьям со штрафом..."
            value={calcQ}
            onChange={(e) => setCalcQ(e.target.value)}
          />
        </div>
        <div className="card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="tiny muted">Итого:</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-text)' }}>
            {calcTotal.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        {calcItems.length > 0 && (
          <button className="ghost" onClick={clearCalc} title="Очистить" style={{ flexShrink: 0 }}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p className="small">Статей со штрафами не найдено.</p>
          </div>
        )}
        {filtered.map((a) => {
          const inCalc = calcItems.includes(a.key)
          return (
            <div
              key={a.key}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                ...(inCalc ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : {}),
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>{a.number}</div>
                <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                <div className="tiny muted">{a.codec_name}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-text)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {Number(a.fine).toLocaleString('ru-RU')} ₽
              </div>
              <button
                className={inCalc ? 'primary' : 'outline'}
                style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                onClick={() => toggleCalc(a.key)}
              >
                {inCalc ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExamPanel({ articles }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [started, setStarted] = useState(false)
  const correctRef = useRef(0)

  const generate = useCallback(() => {
    const all = POPULAR_ARTICLES
    if (all.length < 5) return
    const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 10)
    const qs = shuffled.map((a) => {
      const type = Math.floor(Math.random() * 3)
      if (type === 0) {
        const wrong = all
          .filter((x) => x.stars != null && x.key !== a.key)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((x) => Number(x.stars))
        if (wrong.length < 3) return null
        const correct = a.stars != null ? Number(a.stars) : 3
        const answers = [...wrong, correct].sort(() => Math.random() - 0.5)
        return {
          text: `Сколько звёзд сложности у статьи ${a.number}?`,
          answers: answers.map((v) => String(v)),
          correct: answers.indexOf(correct),
        }
      }
      if (type === 1) {
        const types = ['административная', 'уголовная']
        if (!types.includes(a.type)) return null
        const correct = a.type
        const wrong = types.filter((t) => t !== correct)
        const answers = [correct, ...wrong].sort(() => Math.random() - 0.5)
        return {
          text: `Какой тип у статьи ${a.number}?`,
          answers: answers.map((t) => t === 'административная' ? 'Административная' : 'Уголовная'),
          correct: answers.indexOf(correct),
        }
      }
      {
        const wrong = all
          .filter((x) => x.key !== a.key)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((x) => x.number)
        const answers = [...wrong, a.number].sort(() => Math.random() - 0.5)
        return {
          text: `Какой номер статьи "${a.title}"?`,
          answers,
          correct: answers.indexOf(a.number),
        }
      }
    }).filter(Boolean)
    setQuestions(qs)
    setCurrent(0)
    setScore(0)
    setDone(false)
    setSelected(null)
    setFeedback(null)
    correctRef.current = 0
    setStarted(true)
  }, [])

  function answer(idx) {
    if (feedback) return
    setSelected(idx)
    const q = questions[current]
    const isCorrect = idx === q.correct
    if (isCorrect) correctRef.current++
    setFeedback(isCorrect)
  }

  function next() {
    if (current + 1 >= questions.length) {
      setScore(correctRef.current)
      setDone(true)
      return
    }
    setCurrent((c) => c + 1)
    setSelected(null)
    setFeedback(null)
  }

  if (!started) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <GraduationCap size={48} color="var(--accent-text)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Экзамен</h2>
        <p className="muted small" style={{ maxWidth: 400, margin: '0 auto 24px' }}>
          10 случайных вопросов по базе статей. На каждый вопрос — 4 варианта ответа.
        </p>
        <button className="primary" style={{ padding: '12px 32px', fontSize: 16 }} onClick={generate}>
          Начать экзамен
        </button>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    const passed = pct >= 70
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        {passed ? <CheckCircle2 size={48} color="var(--ok)" style={{ marginBottom: 16 }} /> : <XCircle size={48} color="var(--accent)" style={{ marginBottom: 16 }} />}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          {passed ? 'Экзамен сдан!' : 'Экзамен не сдан'}
        </h2>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 8 }}>
          {score} / {questions.length}
        </div>
        <div className="muted small" style={{ marginBottom: 24 }}>{pct}% правильных</div>
<button className="primary" style={{ padding: '12px 32px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={generate}>
            <RefreshCw size={17} /> Пройти заново
          </button>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span className="tiny muted">Вопрос {current + 1} из {questions.length}</span>
        <span className="tiny muted">Правильно: {correctRef.current}</span>
      </div>
      <div className="card" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>{q.text}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.answers.map((a, i) => {
            let bg = 'var(--bg-card)'
            let border = 'var(--border)'
            let color = 'var(--text)'
            if (feedback !== null) {
              if (i === q.correct) { bg = 'rgba(76,175,80,0.12)'; border = '#4caf50'; color = '#4caf50' }
              else if (i === selected) { bg = 'var(--accent-soft)'; border = 'var(--accent)'; color = 'var(--accent-text)' }
            } else if (i === selected) {
              bg = 'var(--accent-soft)'; border = 'var(--accent)'; color = 'var(--accent-text)'
            }
            return (
              <button
                key={i}
                style={{
                  padding: '12px 16px', borderRadius: 10, textAlign: 'left', fontSize: 15,
                  background: bg, border: `1px solid ${border}`, color, cursor: feedback ? 'default' : 'pointer',
                }}
                onClick={() => answer(i)}
                disabled={feedback !== null}
              >
                {a}
              </button>
            )
          })}
        </div>
      </div>
      {feedback !== null && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="primary" style={{ padding: '10px 28px' }} onClick={next}>
            {current + 1 >= questions.length ? 'Завершить' : 'Следующий вопрос'}
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  app: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 270,
    flexShrink: 0,
    background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border)',
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '2px 6px 16px' },
  logoImg: { width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  logoTitle: { fontWeight: 700, fontSize: 15 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-start',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 14,
    width: '100%',
  },
  navDivider: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    padding: '14px 12px 6px',
  },
  navLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sidebarBottom: { display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 12 },
  main: { flex: 1, padding: '28px 34px', minWidth: 0 },
  contentHeader: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 },
  h1: { fontSize: 24, fontWeight: 700 },
  filters: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  codecGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginTop: 8 },
  codecCard: { padding: 18 },
  codecEmblem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'var(--accent-soft)',
    border: '1px solid rgba(229,57,53,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    marginBottom: 12,
  },
  articleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 },
  articleCard: { padding: '14px 16px' },
  handbook: { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 },
  handbookSection: { overflow: 'hidden' },
  handbookHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 16px',
    borderRadius: 0,
  },
  handbookBody: {
    padding: '0 24px 18px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 14,
  },
  handbookLine: { fontSize: 14, lineHeight: 1.55, margin: 0 },
  handbookOl: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  handbookLi: {
    fontSize: 14,
    lineHeight: 1.55,
    color: 'var(--primary)',
    fontWeight: 400,
    paddingLeft: 4,
  },
  handbookImages: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    marginTop: 6,
    alignItems: 'center',
  },
  handbookFigure: { margin: 0, textAlign: 'center', width: '100%' },
  handbookImg: {
    maxWidth: '100%',
    width: '100%',
    borderRadius: 10,
    border: '1px solid var(--border)',
    objectFit: 'contain',
  },
  handbookCaption: {
    marginTop: 8,
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  empty: { textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' },
  error: {
    background: 'var(--accent-soft)',
    border: '1px solid rgba(229,57,53,0.4)',
    color: 'var(--accent-text)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 13,
  },
  detailPanel: {
    width: 400,
    flexShrink: 0,
    background: 'var(--bg-panel)',
    borderLeft: '1px solid var(--border)',
    padding: 24,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metric: { padding: '14px 18px', display: 'inline-block', marginRight: 8 },
  aiWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: 'calc(100vh - 140px)' },
  aiChat: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '4px 4px 16px',
  },
  aiEmpty: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'var(--text-muted)',
  },
  aiMsgUser: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    background: 'var(--accent-soft)',
    border: '1px solid rgba(229,57,53,0.25)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  aiMsgBot: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  aiInputRow: {
    display: 'flex',
    gap: 10,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  aiDialogs: {
    width: 240,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--border)',
    paddingRight: 14,
    maxHeight: 'calc(100vh - 140px)',
  },
  aiDialogItem: {
    position: 'relative',
    padding: '9px 28px 9px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid transparent',
    transition: 'background .15s',
  },
  aiDialogItemActive: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  },
}
