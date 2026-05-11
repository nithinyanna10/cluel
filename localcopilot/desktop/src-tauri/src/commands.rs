use std::process::Command;
use tauri::command;

#[derive(serde::Serialize)]
pub struct ScreenshotResult {
    pub path: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Capture the full screen silently and return the temp-file path.
/// Uses macOS `screencapture`. On Windows/Linux a different tool would be needed.
#[command]
pub fn capture_screenshot() -> ScreenshotResult {
    let tmp = std::env::temp_dir().join(format!(
        "localcopilot_screenshot_{}.png",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    ));

    let out = Command::new("screencapture")
        .args(["-x", "-t", "png", tmp.to_str().unwrap_or("/tmp/lc.png")])
        .output();

    match out {
        Ok(o) if o.status.success() => ScreenshotResult {
            path: tmp.to_str().unwrap_or_default().to_string(),
            success: true,
            error: None,
        },
        Ok(o) => ScreenshotResult {
            path: String::new(),
            success: false,
            error: Some(String::from_utf8_lossy(&o.stderr).to_string()),
        },
        Err(e) => ScreenshotResult {
            path: String::new(),
            success: false,
            error: Some(e.to_string()),
        },
    }
}

/// Start window dragging (called from JS on mousedown over the drag region).
#[command]
pub fn drag_window(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}
