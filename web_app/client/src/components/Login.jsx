import React, { useState, useEffect } from 'react'
import { Lock, Server } from 'lucide-react'
import logo from '../assets/logo.png'
import { api, getServerUrl, setServerUrl } from '../api'

export default function Login({ onLogin, checking }) {
  const [key, setKey] = useState('')
  const [machineId, setMachineId] = useState('')
  const [serverUrl, setServerUrlState] = useState(getServerUrl())
  const [showServer, setShowServer] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMachineId().then(setMachineId).catch(() => {})
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const k = key.trim()
    if (!k) {
      setError('Введите ключ доступа')
      return
    }
    const url = serverUrl.trim() || getServerUrl()
    setServerUrl(url)
    try {
      await onLogin(k, machineId, url)
    } catch (err) {
      setError(err.message || 'Не удалось проверить ключ')
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src={logo} alt="Логотип" style={styles.logoImg} />
        </div>
        <h1 style={styles.title}>Правовой помощник</h1>
        <p className="muted small" style={{ marginTop: 4, marginBottom: 26 }}>
          Справочник законов для государственных структур
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
            <input
              autoFocus
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Введите ключ доступа"
              style={{ textAlign: 'center', letterSpacing: 1.5, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 14, paddingLeft: 40 }}
            />
          </div>

          <button
            type="button"
            className="ghost"
            onClick={() => setShowServer((s) => !s)}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)' }}
          >
            <Server size={13} /> {showServer ? 'Скрыть адрес сервера' : 'Адрес сервера (для администратора)'}
          </button>
          {showServer && (
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrlState(e.target.value)}
              placeholder="https://ваш-сервер"
              style={{ fontSize: 13, textAlign: 'center', fontFamily: 'ui-monospace, Consolas, monospace' }}
            />
          )}

          {error && <p style={{ color: 'var(--accent)', fontSize: 13, textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="primary" style={{ padding: '12px' }} disabled={checking}>
            {checking ? 'Проверка...' : 'Войти'}
          </button>
        </form>

        <p className="tiny muted" style={{ textAlign: 'center', marginTop: 22, textWrap: 'balance' }}>
          Доступ предоставляется по ключу. Обратитесь к администратору.
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(900px 400px at 50% -10%, #2a1212 0%, #121212 60%)',
    padding: 20,
  },
  card: {
    width: 420,
    maxWidth: '100%',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '44px 38px',
    textAlign: 'center',
  },
  logo: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  logoImg: {
    width: 72,
    height: 72,
    borderRadius: 16,
    objectFit: 'cover',
  },
  title: { fontSize: 24, fontWeight: 700 },
}

