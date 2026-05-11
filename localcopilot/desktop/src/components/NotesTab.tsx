interface Props {
  notes: string;
  onChange: (v: string) => void;
  ocrText: string | null;
  captureTime: Date | null;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function NotesTab({ notes, onChange, ocrText, captureTime }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-4 gap-4 overflow-y-auto" data-no-drag>
      {/* User notes */}
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>
          My Notes
        </p>
        <textarea
          className="flex-1 rounded-xl p-3 text-[13px] resize-none outline-none selectable leading-relaxed min-h-[180px]"
          style={{
            background: "rgba(38,40,52,.6)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "rgba(255,255,255,.78)",
          }}
          placeholder="Add your own notes here — they'll be included as context when you ask the assistant…"
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(124,108,255,.4)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,.08)";
          }}
        />
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,.2)" }}>
          {notes.length} characters · included in AI context
        </p>
      </div>

      {/* OCR text */}
      {ocrText && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>
            Screen OCR
            {captureTime && (
              <span className="normal-case font-normal ml-2" style={{ color: "rgba(255,255,255,.2)" }}>
                captured {fmtTime(captureTime)}
              </span>
            )}
          </p>
          <div
            className="rounded-xl p-3 max-h-[160px] overflow-y-auto"
            style={{ background: "rgba(38,40,52,.6)", border: "1px solid rgba(255,255,255,.07)" }}
          >
            <pre className="text-[11.5px] font-mono whitespace-pre-wrap selectable leading-relaxed" style={{ color: "rgba(255,255,255,.52)" }}>
              {ocrText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
