import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface TranscriptEntry {
  text: string;
  speaker: string;
  time: Date;
}

interface Props {
  entries: TranscriptEntry[];
  onClear: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtTs(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`toggle-track ${on ? "on" : "off"}`}
      onClick={() => onChange(!on)}
      data-no-drag
    >
      <motion.div
        className="absolute top-[2.5px] w-[14px] h-[14px] rounded-full shadow-sm"
        style={{ background: "#fff" }}
        animate={{ x: on ? 14 : 2 }}
        transition={{ type: "spring", damping: 22, stiffness: 380 }}
      />
    </div>
  );
}

export default function TranscriptTab({ entries, onClear }: Props) {
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, autoScroll]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 44, borderBottom: "1px solid rgba(255,255,255,.07)" }}
        data-no-drag
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.88)" }}>
            Transcript
          </span>
          {entries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: "#4ade80" }} />
              <span className="text-[10.5px]" style={{ color: "rgba(255,255,255,.38)" }}>Live</span>
            </div>
          )}
        </div>
        <button className="icon-act text-[13px]" title="Search" data-no-drag>🔍</button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-3" data-no-drag>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-[28px]">🎙</span>
            <p className="text-[12.5px] text-center max-w-[200px] leading-relaxed" style={{ color: "rgba(255,255,255,.3)" }}>
              Start recording to see a live transcript here
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,.2)" }}>
              Press <span className="font-mono px-1 py-0.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>⌘⇧R</span> to begin
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {entries.map((e, i) => (
              <motion.div
                key={i}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Timestamp */}
                <span
                  className="text-[11px] font-mono flex-shrink-0 pt-0.5 w-[56px]"
                  style={{ color: "rgba(255,255,255,.28)" }}
                >
                  {fmtTs(e.time)}
                </span>

                {/* Speaker */}
                <span
                  className={`text-[12.5px] flex-shrink-0 w-[42px] pt-0.5 ${
                    e.speaker === "You" ? "sp-you" : "sp-other"
                  }`}
                >
                  {e.speaker}
                </span>

                {/* Text */}
                <p
                  className="text-[13px] leading-snug flex-1 selectable"
                  style={{ color: "rgba(255,255,255,.75)" }}
                >
                  {e.text}
                </p>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 42, borderTop: "1px solid rgba(255,255,255,.07)" }}
        data-no-drag
      >
        <div className="flex items-center gap-2">
          <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,.38)" }}>Auto-scroll</span>
          <ToggleSwitch on={autoScroll} onChange={setAutoScroll} />
        </div>
        <button
          className="text-[11.5px] font-medium transition-colors"
          style={{ color: "rgba(124,126,255,.8)" }}
          onClick={onClear}
          disabled={entries.length === 0}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
