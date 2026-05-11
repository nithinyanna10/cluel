#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_always_on_top(true)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::capture_screenshot,
            commands::drag_window,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running LocalCopilot");
}
