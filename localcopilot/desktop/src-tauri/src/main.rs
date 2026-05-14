#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_always_on_top(true)?;

            // CSS backdrop-filter does not blur the desktop through a transparent
            // WKWebView; native vibrancy / blur makes real glassmorphism.
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                let _ = apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::Active),
                    Some(16.0),
                );
            }
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_blur;
                let _ = apply_blur(&window, Some((24, 24, 32, 160)));
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::capture_screenshot,
            commands::drag_window,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running LocalCopilot");
}
