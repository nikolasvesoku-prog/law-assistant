import React, { useEffect, useState } from 'react'
import MainApp from './components/MainApp.jsx'
import NoteWindow from './components/NoteWindow.jsx'
import HelperWindow from './components/HelperWindow.jsx'
import logo from './assets/logo.png'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export default function App() {
  const [isNote, setIsNote] = useState(false)
  const [isHelper, setIsHelper] = useState(false)
  const [ui, setUi] = useState({ state: 'none', version: '', progress: 0, total: 0, error: '' })

  useEffect(() => {
    try {
      const label = window.__TAURI__?.window?.getCurrentWindow?.()?.label || ''
      if (label === 'helper' || label.startsWith('helper_')) { setIsHelper(true); return }
      if (label.startsWith('note_')) { setIsNote(true); return }
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    function run() {
      check()
        .then(async (update) => {
          if (!update || cancelled) return
          setUi({ state: 'available', version: update.version, progress: 0, total: 0, error: '' })
        })
        .catch((e) => {
          setUi({ state: 'error', version: '', progress: 0, total: 0, error: 'updater: ' + (e?.message || String(e)) })
        })
    }
    const t = setTimeout(run, 1500)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  async function startInstall() {
    setUi((s) => ({ ...s, state: 'downloading', progress: 0 }))
    try {
      const update = await check()
      if (!update) return
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          setUi((s) => ({ ...s, total: event.data.contentLength || 0 }))
        } else if (event.event === 'Progress') {
          setUi((s) => {
            const done = s.progress + event.data.chunkLength
            return { ...s, progress: done }
          })
        } else if (event.event === 'Finished') {
          setUi((s) => ({ ...s, state: 'installing' }))
        }
      })
      await relaunch()
    } catch (e) {
      setUi({ state: 'error', version: '', progress: 0, total: 0, error: e && e.message ? e.message : String(e) })
    }
  }

  const pct = ui.total > 0 ? Math.min(100, Math.round((ui.progress / ui.total) * 100)) : 0
  const mb = (n) => (n / 1024 / 1024).toFixed(1)

  if (isNote) {
    return <NoteWindow />
  }

  if (isHelper) {
    return <HelperWindow />
  }

  return (
    <>
      <MainApp license={null} onLogout={() => {}} />
      {(ui.state === 'available' || ui.state === 'downloading' || ui.state === 'installing' || ui.state === 'error') && (
        <div style={overlay}>
          <div style={card}>
            <img src={logo} alt="Логотип" style={logoStyle} />
            {ui.state === 'available' && (
              <>
                <div style={title}>Доступно обновление</div>
                <div style={desc}>Новая версия <b>{ui.version}</b> готова к установке.</div>
                <button style={btn} onClick={startInstall}>Обновить</button>
              </>
            )}
            {(ui.state === 'downloading' || ui.state === 'installing') && (
              <>
                <div style={title}>{ui.state === 'installing' ? 'Установка обновления' : `Загрузка ${pct}%`}</div>
                <div style={barWrap}>
                  <div style={{ ...bar, width: `${pct}%` }} />
                </div>
                <div style={desc}>
                  {ui.state === 'downloading' && ui.total > 0
                    ? `${mb(ui.progress)} / ${mb(ui.total)} МБ`
                    : 'Подождите, идёт установка. Приложение перезапустится автоматически.'}
                </div>
              </>
            )}
            {ui.state === 'error' && (
              <>
                <div style={title}>Ошибка обновления</div>
                <div style={desc}>{ui.error}</div>
                <button style={btnGhost} onClick={() => setUi({ state: 'none' })}>Закрыть</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const card = {
  background: '#1c1c1e', border: '1px solid #3a3a3f', borderRadius: 16,
  padding: '34px 34px 30px', width: 380, textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: '#fff',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}
const logoStyle = { width: 92, height: 92, borderRadius: 22, objectFit: 'cover', marginBottom: 18 }
const title = { fontSize: 18, fontWeight: 700, marginBottom: 10 }
const desc = { fontSize: 14, color: '#b8b8bd', marginBottom: 18, lineHeight: 1.4 }
const barWrap = {
  width: '100%', height: 8, background: '#2c2c30', borderRadius: 6, overflow: 'hidden', marginBottom: 14,
}
const bar = { height: '100%', background: '#e53935', transition: 'width 0.2s ease' }
const btn = {
  background: '#e53935', color: '#fff', border: 'none', padding: '11px 24px',
  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'center',
}
const btnGhost = {
  background: 'transparent', color: '#b8b8bd', border: '1px solid #3a3a3f',
  padding: '11px 22px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
}