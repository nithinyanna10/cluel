import { useEffect, useState } from "react";

interface Props {
  isRecording: boolean;
  ocrCaptureTime: Date | null;
  onToggleRecording: () => void;
  onCapture: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function RecordingBar({
  isRecording,
  ocrCaptureTime,
  onToggleRecording,
  onCapture,
}: Props) {
  const timer = useTimer(isRecording);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="flex items-center gap-3 px-5"
      style={{
        height: 40,
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      data-no-drag
    >
      {/* Recording status — left side */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isRecording ? (
          <>
            <div className="waveform">
              {[...Array(5)].map((_, i) => <div key={i} className="wbar" />)}
            </div>
            <span className="text-[11.5px] font-semibold" style={{ color: "#4ade80" }}>
              Recording
            </span>
            <span className="text-[11.5px] font-mono" style={{ color: "rgba(255,255,255,.38)" }}>
              {timer}
            </span>
          </>
        ) : ocrCaptureTime ? (
          <>
            <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: "#60a5fa" }} />
            <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,.38)" }}>
              Screen captured {fmtTime(ocrCaptureTime)}
            </span>
          </>
        ) : (
          <>
            <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,.18)" }} />
            <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,.28)" }}>
              Not recording
            </span>
          </>
        )}
      </div>

      {/* Control buttons — compact, right-aligned */}
      <button
        onClick={onToggleRecording}
        title={isRecording ? "Stop recording (⌘⇧R)" : "Start recording (⌘⇧R)"}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium flex-shrink-0"
        style={{
          background: isRecording ? "rgba(220,50,50,0.18)" : "rgba(255,255,255,0.07)",
          border: `1px solid ${isRecording ? "rgba(220,50,50,0.35)" : "rgba(255,255,255,0.09)"}`,
          color: isRecording ? "#f87171" : "rgba(255,255,255,0.45)",
        }}
        data-no-drag
      >
        <span style={{ fontSize: 12 }}>{isRecording ? "⏹" : "🎙"}</span>
        <span>{isRecording ? "Stop" : "Record"}</span>
      </button>

      <button
        className="icon-act text-[14px]"
        onClick={onCapture}
        title="Capture screen (⌘⇧S)"
        data-no-drag
      >
        ⎙
      </button>
    </div>
  );
}
