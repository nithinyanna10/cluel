import type {
  AssistantRequest,
  AssistantResponse,
  ExportResponse,
  HealthResponse,
  OcrResponse,
  Session,
  Settings,
  SettingsUpdate,
  TranscriptionResponse,
} from "./types";

const BASE = "http://127.0.0.1:8787";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => req<HealthResponse>("/health"),

  // Sessions
  createSession: (title: string) =>
    req<Session>("/sessions", { method: "POST", body: JSON.stringify({ title }) }),
  listSessions: () => req<Session[]>("/sessions"),
  getSession: (id: number) => req<Session>(`/sessions/${id}`),
  deleteSession: (id: number) =>
    req<void>(`/sessions/${id}`, { method: "DELETE" }),
  exportSession: (id: number) =>
    req<ExportResponse>(`/sessions/${id}/export`, { method: "POST" }),

  // Assistant
  assist: (body: AssistantRequest) =>
    req<AssistantResponse>("/assistant/respond", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Transcription — multipart, no JSON content-type
  transcribeAudio: async (
    audioBlob: Blob,
    sessionId: number
  ): Promise<TranscriptionResponse> => {
    const form = new FormData();
    form.append("session_id", String(sessionId));
    form.append("audio", audioBlob, "recording.webm");
    const res = await fetch(`${BASE}/transcription/audio`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Transcription HTTP ${res.status}`);
    return res.json();
  },

  // OCR — multipart
  processImage: async (file: File | Blob, sessionId: number): Promise<OcrResponse> => {
    const form = new FormData();
    form.append("session_id", String(sessionId));
    form.append("image", file, "screenshot.png");
    const res = await fetch(`${BASE}/ocr/image`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
    return res.json();
  },

  // Settings
  getSettings: () => req<Settings>("/settings"),
  updateSettings: (updates: SettingsUpdate) =>
    req<Settings>("/settings", {
      method: "POST",
      body: JSON.stringify(updates),
    }),
};
