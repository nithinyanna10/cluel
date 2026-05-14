import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AssistantResponse } from "../lib/types";

interface Props {
  response: AssistantResponse | null;
  loading: boolean;
  error: string | null;
  sessionId: number | null;
  onAsk: (q: string) => void;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const go = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button className={`copy-sm ${copied ? "copied" : ""}`} onClick={go} data-no-drag>
      ⎘ {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[85, 65, 55].map((w, i) => (
        <motion.div
          key={i}
          className="res-card"
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.18 }}
        >
          <div className="h-2.5 rounded-full mb-3" style={{ width: `${w * 0.5}%`, background: "rgba(255,255,255,.1)" }} />
          <div className="h-2 rounded-full mb-2" style={{ width: `${w}%`, background: "rgba(255,255,255,.07)" }} />
          <div className="h-2 rounded-full" style={{ width: `${w - 20}%`, background: "rgba(255,255,255,.05)" }} />
        </motion.div>
      ))}
    </div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", damping: 26, stiffness: 340 } },
};

export default function AssistantTab({ response, loading, error, sessionId, onAsk }: Props) {
  const [query, setQuery] = useState("");

  const submit = () => {
    if (!query.trim() || !sessionId) return;
    onAsk(query.trim());
    setQuery("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable cards */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" data-no-drag>
        <AnimatePresence mode="wait">
          {loading && <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Skeleton /></motion.div>}

          {error && !loading && (
            <motion.div key="err" className="res-card" style={{ borderColor: "rgba(248,113,113,.25)", background: "rgba(248,113,113,.06)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-[12px] selectable" style={{ color: "#fca5a5" }}>{error}</p>
            </motion.div>
          )}

          {response && !loading && (
            <motion.div key="resp" variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">

              {/* Suggested response — full width */}
              <motion.div variants={fadeUp} className="res-card">
                <div className="flex items-center gap-2">
                  <span className="icon-badge ib-accent">✦</span>
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                    Suggested response
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed selectable" style={{ color: "rgba(255,255,255,.78)" }}>
                  {response.suggested_response}
                </p>
                <div className="flex justify-end">
                  <CopyBtn text={response.suggested_response} />
                </div>
              </motion.div>

              {/* Follow-up — full width */}
              {response.follow_up_question && (
                <motion.div variants={fadeUp} className="res-card">
                  <div className="flex items-center gap-2">
                    <span className="icon-badge ib-purple">○</span>
                    <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                      Follow-up question
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed selectable" style={{ color: "rgba(255,255,255,.68)" }}>
                    {response.follow_up_question}
                  </p>
                  <div className="flex justify-end">
                    <CopyBtn text={response.follow_up_question} />
                  </div>
                </motion.div>
              )}

              {/* Recap + Action items — 2-column */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">

                {/* Meeting recap */}
                {response.meeting_recap && (
                  <div className="res-card justify-between">
                    <div className="flex items-center gap-2">
                      <span className="icon-badge ib-blue">≡</span>
                      <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                        Meeting recap
                      </span>
                    </div>
                    <p className="text-[12.5px] leading-relaxed selectable flex-1" style={{ color: "rgba(255,255,255,.65)" }}>
                      {response.meeting_recap}
                    </p>
                    <div>
                      <CopyBtn text={response.meeting_recap} />
                    </div>
                  </div>
                )}

                {/* Action items */}
                {response.action_items?.length > 0 && (
                  <div className="res-card justify-between">
                    <div className="flex items-center gap-2">
                      <span className="icon-badge ib-green">✓</span>
                      <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                        Action items
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1.5 flex-1">
                      {response.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12.5px] selectable" style={{ color: "rgba(255,255,255,.65)" }}>
                          <span style={{ color: "#4ade80", flexShrink: 0, marginTop: 1 }}>☑</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div>
                      <CopyBtn text={response.action_items.map((a) => `• ${a}`).join("\n")} />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Confidence */}
              <motion.div variants={fadeUp} className="flex items-center gap-2.5 px-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.22)", letterSpacing: ".8px" }}>Confidence</span>
                <div className="flex-1 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#7C7EFF" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(response.confidence * 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <span className="text-[10px] font-mono min-w-[28px] text-right" style={{ color: "rgba(255,255,255,.28)" }}>
                  {Math.round(response.confidence * 100)}%
                </span>
              </motion.div>
            </motion.div>
          )}

          {!response && !loading && !error && (
            <motion.div key="empty" className="flex flex-col items-center justify-center py-16 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,108,255,.15)" }}>
                <span style={{ fontSize: 22, color: "#8B7CFF" }}>✦</span>
              </div>
              <p className="text-[12.5px] text-center max-w-[220px] leading-relaxed" style={{ color: "rgba(255,255,255,.28)" }}>
                Press <span className="font-mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>⌘↵</span> or type below to get real-time assistance
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Query input — pinned at bottom of tab */}
      <div className="px-4 pb-3 flex-shrink-0" data-no-drag>
        <div className="flex gap-2 items-center rounded-xl px-3 py-2.5 lc-input-chrome">
          <input
            className="flex-1 bg-transparent text-[13px] outline-none selectable"
            style={{ color: "rgba(255,255,255,.82)" }}
            placeholder="Ask anything about this meeting…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={!sessionId}
          />
          <button
            onClick={submit}
            disabled={!sessionId || !query.trim()}
            className="text-[12px] font-semibold flex-shrink-0 transition-opacity"
            style={{ color: "#8B7CFF", opacity: !sessionId || !query.trim() ? 0.3 : 1 }}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
