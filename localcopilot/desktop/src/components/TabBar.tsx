export type Tab = "assistant" | "transcript" | "notes" | "settings";

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "assistant",  label: "Assistant"  },
  { id: "transcript", label: "Transcript" },
  { id: "notes",      label: "Notes"      },
  { id: "settings",   label: "Settings"   },
];

export default function TabBar({ active, onChange }: Props) {
  return (
    <div
      className="flex items-end gap-5 px-5 flex-shrink-0"
      style={{ height: 44, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      data-no-drag
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
