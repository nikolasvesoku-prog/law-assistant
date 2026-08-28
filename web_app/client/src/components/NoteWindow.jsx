import React, { useState, useEffect } from 'react'
import { Pin, Layers, Minus, X } from 'lucide-react'
import logo from '../assets/logo.png'

const tw = window.__TAURI__?.window
const getWin = () => (tw && tw.getCurrentWindow ? tw.getCurrentWindow() : null)

const BarBtn = ({ title, onClick, danger }) => (
  <button
    title={title}
    onClick={onClick}
    className="note-btn"
    style={danger ? { color: '#eb5050' } : undefined}
  >
    {title === 'Свернуть' && <Minus size={15} />}
    {title === 'Закрыть' && <X size={15} />}
    {title === 'Поверх всех окон' && <Layers size={15} />}
    {title === 'Закрепить на месте' && <Pin size={15} />}
  </button>
)

export default function NoteWindow() {
  const [text, setText] = useState('')
  const [onTop, setOnTop] = useState(true)
  const [pinned, setPinned] = useState(false)
  const [opacity, setOpacity] = useState(0.92)

  useEffect(() => {
    const key = getWin()?.label || 'note'
    const saved = localStorage.getItem('note_' + key)
    if (saved) setText(saved)
    const savedOp = parseFloat(localStorage.getItem('note_op_' + key))
    if (!isNaN(savedOp)) setOpacity(savedOp)
    document.body.style.background = 'transparent'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function save(v) {
    setText(v)
    localStorage.setItem('note_' + (getWin()?.label || 'note'), v)
  }
  function changeOpacity(v) {
    setOpacity(v)
    localStorage.setItem('note_op_' + (getWin()?.label || 'note'), String(v))
  }
  function drag(e) {
    if (e.target.closest('button') || e.target.closest('.note-bar-btns')) return
    if (getWin()?.startDragging) getWin().startDragging()
  }
  async function close() {
    const w = getWin(); if (w && w.close) await w.close()
  }
  async function toggleMinimize() {
    const w = getWin(); if (w && w.minimize) await w.minimize()
  }
  async function toggleOnTop() {
    const w = getWin(); if (w && w.setAlwaysOnTop) { const n = !onTop; await w.setAlwaysOnTop(n); setOnTop(n) }
  }
  async function togglePin() {
    const w = getWin(); const n = !pinned; if (w && w.setResizable) await w.setResizable(!n); setPinned(n)
  }

  return (
    <div className="note-drag-overlay" style={{ background: `rgba(28,28,30,${opacity})` }}>
      <div className="note-bar" onMouseDown={drag}>
        <div className="note-bar-left">
          <img src={logo} alt="" className="note-logo" />
          <span className="note-title">Заметка</span>
        </div>
        <div className="note-bar-btns" onMouseDown={(e) => e.stopPropagation()}>
          <BarBtn title="Закрепить на месте" onClick={togglePin} />
          <BarBtn title="Поверх всех окон" onClick={toggleOnTop} />
          <BarBtn title="Свернуть" onClick={toggleMinimize} />
          <BarBtn title="Закрыть" onClick={close} danger />
        </div>
      </div>
      <textarea
        className="note-textarea"
        value={text}
        onChange={(e) => save(e.target.value)}
        placeholder="Текст заметки..."
        autoFocus
      />
      <div className="note-transparency" onMouseDown={(e) => e.stopPropagation()}>
        <span className="note-trans-label">Прозрачность</span>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.02"
          value={opacity}
          onChange={(e) => changeOpacity(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
