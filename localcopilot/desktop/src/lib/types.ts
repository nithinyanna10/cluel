// ── Domain types shared across the frontend ───────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  services: Record<string, string>;
}

export interface Session {
  id: number;
  title: string;
  created_at: string;
  updated_at: string | null;
}

export interface TranscriptChunk {
  id: number;
  session_id: number;
  text: string;
  start_time: number | null;
  end_time: number | null;
  speaker: string | null;
  created_at: string;
}

export interface OcrSnapshot {
  id: number;
  session_id: number;
  extracted_text: string;
  captured_at: string;
}

export interface AssistantResponse {
  suggested_response: string;
  follow_up_question: string;
  meeting_recap: string;
  action_items: string[];
  confidence: number;
  safety_note: string;
}

export interface AssistantRequest {
  session_id: number;
  meeting_title?: string;
  user_notes?: string;
  user_query?: string;
}

export interface TranscriptionResponse {
  text: string;
  chunks: Array<{ text: string; start: number; end: number }>;
  language: string | null;
  session_id: number;
  chunk_id: number;
}

export interface OcrResponse {
  extracted_text: string;
  word_count: number;
  session_id: number;
  snapshot_id: number;
}

export interface Settings {
  llm_provider: "claude" | "openai" | "ollama" | "mock";
  api_key_set: boolean;
  model_name: string;
  llm_base_url: string;
  transcription_model_size: "tiny" | "base" | "small" | "medium" | "large-v2";
  hotkey: string;
  privacy_mode: boolean;
  local_only_mode: boolean;
}

export interface SettingsUpdate {
  llm_provider?: Settings["llm_provider"];
  api_key?: string;
  model_name?: string;
  llm_base_url?: string;
  transcription_model_size?: string;
  hotkey?: string;
  privacy_mode?: boolean;
  local_only_mode?: boolean;
}

export interface ExportResponse {
  session_id: number;
  title: string;
  markdown: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";
