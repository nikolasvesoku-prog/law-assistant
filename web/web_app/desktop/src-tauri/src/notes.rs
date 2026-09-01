//! Нативные окна приложения: заметка (note.exe) и окно-помощник.

use tauri::{AppHandle, Manager};

const NOTE_EXE: &[u8] = include_bytes!("note.exe");

#[tauri::command]
pub fn open_note() -> Result<String, String> {
    let dir = std::env::temp_dir();
    let id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let exe = dir.join(format!("law_note_{}.exe", id));
    std::fs::write(&exe, NOTE_EXE).map_err(|e| format!("Не удалось распаковать заметку: {e}"))?;
    std::process::Command::new(&exe)
        .spawn()
        .map_err(|e| format!("Не удалось запустить заметку: {e}"))?;
    Ok("ok".to_string())
}

#[tauri::command]
pub fn open_helper(app: AppHandle) -> Result<String, String> {
    if let Some(win) = app.get_webview_window("helper") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        return Ok("helper".to_string());
    }
    Err("Окно помощника не найдено".to_string())
}

#[tauri::command]
pub fn helper_hide(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        win.hide().map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn helper_collapse(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        win.set_resizable(true).map_err(|e| e.to_string())?;
        win.set_size(tauri::LogicalSize::new(380.0, 50.0)).map_err(|e| e.to_string())?;
        win.set_resizable(false).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn helper_restore(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        win.set_resizable(true).map_err(|e| e.to_string())?;
        win.set_size(tauri::LogicalSize::new(380.0, 560.0)).map_err(|e| e.to_string())?;
        win.set_resizable(false).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Создаёт скрытое окно помощника при старте приложения.
pub fn create_helper(app: &AppHandle) {
    let win = tauri::WebviewWindowBuilder::new(
        app,
        "helper",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Помощник")
    .inner_size(380.0, 560.0)
    .resizable(false)
    .maximizable(false)
    .decorations(false)
    .visible(false)
    .always_on_top(false)
    .background_color(tauri::window::Color(18, 18, 18, 255))
    .build();
    match win {
        Ok(w) => {
            let w2 = w.clone();
            w.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = w2.hide();
                }
            });
        }
        Err(e) => eprintln!("Не удалось создать окно помощника: {e}"),
    }
}

#[tauri::command]
pub fn helper_start_drag(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        win.start_dragging().map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn helper_toggle_top(app: AppHandle, on_top: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        win.set_always_on_top(on_top).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn helper_toggle_pin(app: AppHandle, pinned: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("helper") {
        // если закреплено — блокируем перемещение; not pinned — разблокируем
        win.set_resizable(false).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}