interface Props {
  onClose: () => void;
}

export default function TitleBar({ onClose }: Props) {
  return (
    <div
      className="lc-glass-strip flex items-center gap-2 px-4"
      style={{ height: 46, flexShrink: 0, cursor: "grab" }}
    >
      {/* App icon */}
      <div
        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(124,108,255,0.25)" }}
      >
        <span style={{ color: "#8B7CFF", fontSize: 11, lineHeight: 1 }}>✦</span>
      </div>

      <span
        className="text-[14px] font-semibold"
        style={{ color: "rgba(255,255,255,.82)" }}
      >
        LocalCopilot
      </span>

      <div className="flex-1" />

      {/* Close */}
      <button
        className="icon-act text-[16px]"
        style={{ color: "rgba(255,255,255,.35)" }}
        onClick={onClose}
        title="Hide"
        data-no-drag
      >
        ×
      </button>
    </div>
  );
}
