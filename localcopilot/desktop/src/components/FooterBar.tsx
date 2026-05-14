import type { ConnectionStatus } from "../lib/types";

interface Props {
  connection: ConnectionStatus;
  sessionTitle: string;
  onNewSession?: () => void;
}

export default function FooterBar({ connection, sessionTitle }: Props) {
  const connLabel =
    connection === "connected"    ? "Backend connected"  :
    connection === "connecting"   ? "Connecting…"        :
                                    "Backend offline";

  const connColor =
    connection === "connected"    ? "#4ade80" :
    connection === "connecting"   ? "#fbbf24" :
                                    "#f87171";

  return (
    <div
      className="lc-glass-strip flex items-center px-4 flex-shrink-0"
      style={{
        height: 36,
        borderTop: "1px solid rgba(255,255,255,0.1)",
        flexShrink: 0,
      }}
      data-no-drag
    >
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <div className="w-[7px] h-[7px] rounded-full" style={{ background: connColor }} />
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,.38)" }}>
          {connLabel}
        </span>
      </div>

      <div className="flex-1" />

      {/* Session name */}
      <div className="flex items-center gap-1 cursor-default">
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,.38)" }}>
          Session:
        </span>
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,.58)" }}>
          {sessionTitle}
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,.3)" }}>
          ▾
        </span>
      </div>
    </div>
  );
}
