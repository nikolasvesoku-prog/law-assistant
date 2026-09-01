import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Отключаем контекстное меню (правая кнопка мыши) — нет «пропуска/обновления» браузера.
window.addEventListener('contextmenu', (e) => e.preventDefault())

// Глобальный перехват ошибок — пишем на экран, если React не смог загрузиться
window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="color:#e53935;padding:40px;font-family:sans-serif">
      <h2>Ошибка загрузки</h2>
      <pre style="white-space:pre-wrap;font-size:13px;color:#b8b8b8">${e.message}\n${e.error?.stack || ''}</pre>
      <p style="color:#7a7a7a;font-size:12px;margin-top:20px">Попробуйте переустановить приложение.</p>
    </div>`
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
