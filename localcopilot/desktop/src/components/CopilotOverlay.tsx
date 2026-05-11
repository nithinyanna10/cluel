import { useCallback, useEffect, useRef, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";
import TitleBar from "./TitleBar";
import RecordingBar from "./RecordingBar";
import TabBar, { type Tab } from "./TabBar";
import AssistantTab from "./AssistantTab";
import TranscriptTab, { type TranscriptEntry } from "./TranscriptTab";
import NotesTab from "./NotesTab";
import SettingsTab from "./SettingsTab";
import FooterBar from "./FooterBar";
import { useAssistant } from "../hooks/useAssistant";
import { useRecorder } from "../hooks/useRecorder";
import { useHotkey } from "../hooks/useHotkey";
import { useSettings } from "../hooks/useSettings";
import { api } from "../lib/api";
import type { ConnectionStatus } from "../lib/types";

interface Props {
  sessionId: number | null;
  meetingTitle: string;
  connection: ConnectionStatus;
}

export default function CopilotOverlay({ sessionId, meetingTitle, connection }: Props) {
  const [activeTab,        setActiveTab]        = useState<Tab>("assistant");
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [ocrText,          setOcrText]          = useState<string | null>(null);
  const [lastCaptureTime,  setLastCaptureTime]  = useState<Date | null>(null);
  const [userNotes,        setUserNotes]        = useState("");

  const assistant = useAssistant();
  const recorder  = useRecorder(sessionId);
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings();

  // Alternate speakers as transcript arrives
  const speakerRef = useRef<"You" | "Alex">("You");
  useEffect(() => {
    if (!recorder.lastTranscript) return;
    const entry: TranscriptEntry = {
      text:    recorder.lastTranscript,
      speaker: speakerRef.current,
      time:    new Date(),
    };
    speakerRef.current = speakerRef.current === "You" ? "Alex" : "You";
    setTranscriptEntries((prev) => [...prev, entry]);
  }, [recorder.lastTranscript]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAsk = useCallback(
    async (q: string) => {
      if (!sessionId) return;
      await assistant.ask(sessionId, { title: meetingTitle, notes: userNotes, query: q });
    },
    [sessionId, meetingTitle, userNotes, assistant]
  );

  const triggerAssistant = useCallback(async () => {
    if (!sessionId) return;
    setActiveTab("assistant");
    await assistant.ask(sessionId, { title: meetingTitle, notes: userNotes, query: "" });
  }, [sessionId, meetingTitle, userNotes, assistant]);

  const captureScreen = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await invoke<{ path: string; success: boolean }>("capture_screenshot");
      if (!result.success) return;
      const blob = await fetch(`file://${result.path}`).then((r) => r.blob());
      const ocrResult = await api.processImage(blob, sessionId);
      setOcrText(ocrResult.extracted_text);
      setLastCaptureTime(new Date());
    } catch (e) {
      console.error("Screenshot/OCR failed:", e);
    }
  }, [sessionId]);

  const handleClose = useCallback(async () => {
    try { await appWindow.hide(); } catch { /* dev browser */ }
  }, []);

  // ── Hotkeys ──────────────────────────────────────────────────────────────
  useHotkey({ key: "Enter", mods: ["Meta"],          onTrigger: triggerAssistant });
  useHotkey({ key: "r",     mods: ["Meta", "Shift"], onTrigger: () => recorder.toggle() });
  useHotkey({ key: "s",     mods: ["Meta", "Shift"], onTrigger: captureScreen });

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handleDrag = useCallback(async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    try { await appWindow.startDragging(); } catch { /* dev browser */ }
  }, []);

  return (
    <div className="w-full h-full flex items-stretch justify-stretch" onMouseDown={handleDrag}>
      <div className="lc-window flex flex-col w-full h-full overflow-hidden">

        <TitleBar onClose={handleClose} />

        <RecordingBar
          isRecording={recorder.isRecording}
          ocrCaptureTime={lastCaptureTime}
          onToggleRecording={() => recorder.toggle()}
          onCapture={captureScreen}
        />

        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Tab content — fills remaining height */}
        <div className="flex flex-col flex-1 min-h-0">
          {activeTab === "assistant" && (
            <AssistantTab
              response={assistant.response}
              loading={assistant.loading}
              error={assistant.error}
              sessionId={sessionId}
              onAsk={handleAsk}
            />
          )}
          {activeTab === "transcript" && (
            <TranscriptTab
              entries={transcriptEntries}
              onClear={() => setTranscriptEntries([])}
            />
          )}
          {activeTab === "notes" && (
            <NotesTab
              notes={userNotes}
              onChange={setUserNotes}
              ocrText={ocrText}
              captureTime={lastCaptureTime}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              settings={settings}
              loading={settingsLoading}
              onSave={async (u) => { await updateSettings(u); }}
            />
          )}
        </div>

        <FooterBar
          connection={connection}
          sessionTitle={meetingTitle}
        />
      </div>
    </div>
  );
}
