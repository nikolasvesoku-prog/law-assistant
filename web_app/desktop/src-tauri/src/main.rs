// Не показывать консольное окно (приложение — GUI, а не консольная программа).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod logic;
mod notes;

use std::path::PathBuf;
use tauri::Manager;


fn app_data_dir() -> PathBuf {
    // Данные приложения (app.db) храним в папке пользователя %APPDATA%,
    // чтобы не мусорить рядом с exe (например, в папке с игрой).
    let dir = std::env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("Правовой помощник");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn main() {
    let data_dir = app_data_dir();
    let db_path = data_dir.join("app.db");
    let db = match logic::init_db(&db_path) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Не удалось открыть базу: {e}");
            std::process::exit(1);
        }
    };

    let state = logic::AppState {
        catalog: logic::load_catalog(),
        db: std::sync::Mutex::new(db),
        helper_label: std::sync::Mutex::new(None),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(state)
        .setup(|app| {
            notes::create_helper(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            logic::get_codecs,
            logic::get_articles,
            logic::toggle_favorite,
            logic::get_favorites_count,
            logic::gigachat_ask,
            logic::situation_check,
            logic::ai_get_history,
            logic::ai_new_dialog,
            logic::ai_list_dialogs,
            logic::ai_rename_dialog,
            logic::ai_delete_dialog,
            notes::open_note,
            notes::open_helper,
            notes::helper_hide,
            notes::helper_collapse,
            notes::helper_restore,
            notes::helper_start_drag,
            notes::helper_toggle_top,
            notes::helper_toggle_pin,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {});
}
