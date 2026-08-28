import React from 'react'
import { typeBadge } from './MainApp.jsx'

export default function ArticleCard({ article, onSelect, onToggleFav }) {
  const showStars = article.type !== 'административная' && article.stars != null
  const showFine = article.type === 'административная' && article.fine != null

  return (
    <div style={styles.card} onClick={onSelect}>
      <div style={styles.top}>
        <span style={styles.num}>{article.number}</span>
        <span style={styles.title}>{article.title || '—'}</span>
        <button
          className="ghost"
          style={styles.fav}
          title={article.is_fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFav(article)
          }}
        >
          {article.is_fav ? '★' : '☆'}
        </button>
      </div>
      <div style={styles.bottom}>
        {typeBadge(article.type)}
        {showFine && (
          <span style={{ color: 'var(--admin)', fontWeight: 600 }}>
            {Number(article.fine).toLocaleString('ru-RU')} ₽
          </span>
        )}
        {showStars && (
          <span className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= Number(article.stars) ? 'on' : 'off'}>
                {i <= Number(article.stars) ? '★' : '☆'}
              </span>
            ))}
          </span>
        )}
        {(article.category || article.codec_name) && (
          <span className="small muted" style={{ marginLeft: 'auto' }}>
            {article.category || article.codec_name}
          </span>
        )}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.1s',
  },
  cardHover: { borderColor: 'var(--primary)' },
  top: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 },
  num: { color: 'var(--star)', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 14 },
  title: { fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fav: { fontSize: 18, padding: '0 4px', color: 'var(--star)', flexShrink: 0, border: 'none', background: 'transparent' },
  bottom: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
}
