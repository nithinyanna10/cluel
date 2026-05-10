# LocalCopilot

**Ethical AI meeting productivity assistant — runs entirely on your machine.**

LocalCopilot is a transparent overlay app that listens to meeting audio (with your permission), captures screen context (with your approval), transcribes speech, extracts visible text from screenshots, and generates helpful real-time assistance via a configurable LLM.

> No stealth. No hidden recording. No interview-cheating features. The recording indicator is always visible.

---

## Architecture

```
┌─────────────────────────────────────┐
│  Tauri Desktop App (React + Rust)   │  ← always-on-top overlay
│  port: 1420 (dev)                   │
│                                     │
│  Components: Overlay, AssistantPanel│
│              TranscriptPanel        │
│              SettingsPanel          │
│              StatusBar              │
└──────────────┬──────────────────────┘
               │ HTTP (localhost only)
┌──────────────▼──────────────────────┐
│  FastAPI Backend (Python)           │  ← localhost:8787
│                                     │
│  Routes:  /health  /sessions        │
│           /assistant/respond        │
│           /transcription/audio      │
│           /ocr/image                │
│           /settings                 │
│                                     │
│  Services: LLM (Claude/OpenAI/      │
│            Ollama/Mock)             │
│            faster-whisper (STT)     │
│            EasyOCR                  │
│            Context packer           │
│            Privacy redactor         │
│                                     │
│  DB: SQLite (localcopilot.db)       │
└─────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| Python 3.11+ | https://python.org |
| Node.js 20+ | https://nodejs.org |
| Rust + Cargo | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Tauri CLI | `cargo install tauri-cli --version "^1.5"` |
| Xcode Command Line Tools (macOS) | `xcode-select --install` |

---

## Quick Start (macOS)

### 1 — Clone & configure

```bash
cd localcopilot
cp .env.example backend/.env
# Edit backend/.env — at minimum set LLM_PROVIDER=mock to run without any API key
```

### 2 — Start the backend

```bash
cd backend
chmod +x run.sh
./run.sh
# Opens http://127.0.0.1:8787 — visit /docs for Swagger UI
```

### 3 — Start the desktop app (new terminal)

```bash
cd desktop
npm install
npm run tauri dev
```

The overlay window appears in the top-left corner. Use `⌘⇧` to drag it anywhere.

---

## Hotkeys

| Hotkey | Action |
|--------|--------|
| `⌘↵` (Cmd+Enter) | Ask assistant |
| `⌘⇧R` | Toggle microphone recording |
| `⌘⇧S` | Capture screen + run OCR |

---

## LLM Provider Setup

Open the **Settings** tab in the overlay.

### Mock (default — no key needed)
Returns canned responses. Good for testing the UI without any API cost.

### Claude (Anthropic)
1. Get an API key at https://console.anthropic.com
2. Set `Provider → claude`, paste the key, choose model `claude-sonnet-4-6`

### OpenAI
1. Get a key at https://platform.openai.com
2. Set `Provider → openai`, paste the key, choose model `gpt-4o`

### Ollama (fully local)
1. Install: https://ollama.com
2. `ollama pull llama3`
3. Set `Provider → ollama`, Base URL `http://localhost:11434`, Model `llama3`
4. Enable **Local-only mode** for maximum privacy

---

## Enabling Transcription (optional)

```bash
cd backend
source .venv/bin/activate
pip install faster-whisper

# On Apple Silicon use:
# pip install faster-whisper --extra-index-url https://download.pytorch.org/whl/cpu
```

Restart the backend. The health endpoint will report `faster_whisper: available`.

---

## Enabling OCR (optional)

```bash
pip install easyocr Pillow
```

EasyOCR downloads ~200 MB of models on first use. Restart the backend after installing.

---

## Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## Privacy & Security

| Feature | Detail |
|---------|--------|
| Local by default | All processing happens on your machine |
| Privacy mode | Redacts API keys, passwords, credit cards, SSNs, tokens before LLM prompt |
| Local-only mode | Blocks cloud providers (Claude/OpenAI) even if configured |
| No silent capture | Mic and screen require explicit user action with visible status |
| API key storage | Stored only in SQLite on disk, never logged or committed |
| CSP | Tauri content security policy restricts connections to `127.0.0.1:8787` |

---

## Folder Structure

```
localcopilot/
├── .env.example
├── docker-compose.yml
├── README.md
├── backend/
│   ├── app/
│   │   ├── main.py          FastAPI app, CORS, lifespan
│   │   ├── config.py        pydantic-settings from .env
│   │   ├── database.py      SQLAlchemy engine + session
│   │   ├── models.py        ORM: Session, TranscriptChunk, OcrSnapshot,
│   │   │                         AssistantOutput, AppSettings
│   │   ├── schemas.py       Pydantic request/response models
│   │   ├── routes/          FastAPI routers
│   │   │   ├── health.py
│   │   │   ├── sessions.py
│   │   │   ├── assistant.py
│   │   │   ├── transcription.py
│   │   │   ├── ocr.py
│   │   │   └── settings.py
│   │   ├── services/
│   │   │   ├── llm_service.py          Claude / OpenAI / Ollama / Mock
│   │   │   ├── transcription_service.py faster-whisper + mock
│   │   │   ├── ocr_service.py          EasyOCR + mock
│   │   │   ├── context_service.py      rolling context builder
│   │   │   ├── summary_service.py      Markdown exporter
│   │   │   ├── screenshot_service.py   macOS screencapture wrapper
│   │   │   └── settings_loader.py      DB + env fallback
│   │   └── utils/
│   │       ├── logging.py
│   │       └── privacy.py   secret redaction regexes
│   ├── tests/
│   │   ├── test_health.py
│   │   ├── test_assistant.py
│   │   └── test_privacy.py
│   ├── requirements.txt
│   ├── run.sh
│   └── Dockerfile
└── desktop/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── src/
    │   ├── App.tsx           session setup screen + backend health poll
    │   ├── main.tsx
    │   ├── styles.css        dark-mode design tokens + all component styles
    │   ├── components/
    │   │   ├── Overlay.tsx        main shell, drag, hotkey wiring
    │   │   ├── AssistantPanel.tsx AI response display + query bar
    │   │   ├── TranscriptPanel.tsx rolling transcript + OCR + notes
    │   │   ├── SettingsPanel.tsx  provider / key / privacy settings
    │   │   └── StatusBar.tsx      recording / OCR / connection badges
    │   ├── hooks/
    │   │   ├── useAssistant.ts  /assistant/respond wrapper
    │   │   ├── useRecorder.ts   MediaRecorder + auto-transcribe
    │   │   ├── useSettings.ts   load/save settings
    │   │   └── useHotkey.ts     keyboard shortcut registration
    │   └── lib/
    │       ├── api.ts    typed fetch client for all backend endpoints
    │       └── types.ts  shared TypeScript interfaces
    └── src-tauri/
        ├── tauri.conf.json  window: transparent, decorations:false, alwaysOnTop
        ├── Cargo.toml
        ├── build.rs
        └── src/
            ├── main.rs      system tray, always-on-top, invoke handler
            └── commands.rs  capture_screenshot (screencapture), drag_window
```

---

## Docker (backend only)

```bash
cp .env.example backend/.env   # edit as needed
docker-compose up backend
```

The desktop app connects to the same `http://127.0.0.1:8787` endpoint.

---

## Roadmap

- [ ] Windows / Linux support (`PrintScreen` / `scrot` for screenshots)
- [ ] Speaker diarisation in transcript
- [ ] Streaming LLM responses
- [ ] Calendar integration for auto meeting title
- [ ] Whisper real-time streaming (WebSocket)
- [ ] PaddleOCR support for non-Latin scripts

---

## License

MIT. Built for ethical productivity — not deception.
