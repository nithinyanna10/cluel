import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { appWindow } from "@tauri-apps/api/window";
import CopilotOverlay from "./components/CopilotOverlay";
import { api } from "./lib/api";
import type { ConnectionStatus, Session } from "./lib/types";

export default function App() {
  const [session, setSession]       = useState<Session | null>(null);
  const [title, setTitle]           = useState("Q2 Planning");
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [error, setError]           = useState<string | null>(null);
  const [starting, setStarting]     = useState(false);

  // Resize window to full panel size on mount
  useEffect(() => {
    (async () => {
      const { LogicalSize } = await import("@tauri-apps/api/window");
      await appWindow.setSize(new LogicalSize(580, 650)).catch(() => {});
    })();
  }, []);

  // Backend health poll
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try   { await api.health(); if (alive) setConnection("connected"); }
      catch { if (alive) setConnection("disconnected"); }
    };
    check();
    const id = setInterval(check, 15_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const start = useCallback(async () => {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const s = await api.createSession(title.trim() || "My Meeting");
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend not reachable — run ./run.sh first");
    } finally {
      setStarting(false);
    }
  }, [title, starting]);

  if (session) {
    return <CopilotOverlay sessionId={session.id} meetingTitle={session.title} connection={connection} />;
  }

  return (
    <div className="flex items-center justify-center w-full h-full" style={{ background: "transparent" }}>
      <motion.div
        className="setup-card flex flex-col gap-4"
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 380 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "rgba(124,108,255,0.2)" }}>
            <span style={{ color: "#8B7CFF", fontSize: 16 }}>✦</span>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold" style={{ color: "rgba(255,255,255,.9)" }}>
              LocalCopilot
            </h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,.3)" }}>
              Ethical AI Meeting Assistant
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`conn-dot conn-${connection}`} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,.25)" }}>
              {connection === "connected" ? "Backend OK" : connection === "connecting" ? "Connecting…" : "Offline"}
            </span>
          </div>
        </div>

        <div className="lc-divider" />

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,.4)" }}>
            Meeting title
          </label>
          <input
            className="glass-input"
            placeholder="e.g. Q2 Planning"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            autoFocus
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-[11px] rounded-lg px-3 py-2 selectable"
              style={{ color: "#f87171", background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)" }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button className="glass-btn-primary" onClick={start} disabled={connection === "disconnected" || starting}>
          {starting ? "Starting…" : "Start Session"}
        </button>

        <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,.18)" }}>
          All processing stays on your machine
        </p>
      </motion.div>
    </div>
  );
}
