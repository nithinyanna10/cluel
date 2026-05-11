import { useState } from "react";
import { motion } from "framer-motion";
import type { Settings, SettingsUpdate } from "../lib/types";

interface Props {
  settings: Settings;
  loading: boolean;
  onSave: (u: SettingsUpdate) => Promise<void>;
}

const PROVIDERS = [
  { value: "mock",   label: "Mock",    desc: "No key needed" },
  { value: "claude", label: "Claude",  desc: "Anthropic API" },
  { value: "openai", label: "OpenAI",  desc: "GPT-4o / compatible" },
  { value: "ollama", label: "Ollama",  desc: "Fully local" },
] as const;

const SIZES = ["tiny", "base", "small", "medium", "large-v2"] as const;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`toggle-track ${on ? "on" : "off"}`} onClick={() => onChange(!on)} data-no-drag>
      <motion.div
        className="absolute top-[2.5px] w-[14px] h-[14px] rounded-full"
        style={{ background: "#fff" }}
        animate={{ x: on ? 14 : 2 }}
        transition={{ type: "spring", damping: 22, stiffness: 380 }}
      />
    </div>
  );
}

export default function SettingsTab({ settings, loading, onSave }: Props) {
  const [form, setForm]   = useState<SettingsUpdate>({});
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  const cur = <K extends keyof Settings>(k: K): Settings[K] =>
    (k in form ? (form as Record<string,unknown>)[k] : settings[k]) as Settings[K];
  const set = (k: keyof SettingsUpdate, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      const payload = { ...form };
      if (apiKey) payload.api_key = apiKey;
      await onSave(payload);
      setForm({}); setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const provider = cur("llm_provider") as string;
  const needsKey = provider === "claude" || provider === "openai";

  if (loading) return (
    <div className="flex items-center justify-center flex-1">
      <p className="text-[12px]" style={{ color: "rgba(255,255,255,.3)" }}>Loading settings…</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5" data-no-drag>

        {/* Provider */}
        <section className="flex flex-col gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>LLM Provider</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  background: cur("llm_provider") === p.value ? "rgba(124,108,255,.2)" : "rgba(38,40,52,.6)",
                  border: `1px solid ${cur("llm_provider") === p.value ? "rgba(124,108,255,.4)" : "rgba(255,255,255,.07)"}`,
                }}
                onClick={() => set("llm_provider", p.value)}
                data-no-drag
              >
                <p className="text-[12.5px] font-semibold" style={{ color: "rgba(255,255,255,.82)" }}>{p.label}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: "rgba(255,255,255,.35)" }}>{p.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {needsKey && (
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>
              API Key {settings.api_key_set && <span style={{ color: "#4ade80", textTransform: "none", fontWeight: 400 }}>✓ set</span>}
            </p>
            <input
              className="glass-input"
              type="password"
              placeholder={settings.api_key_set ? "Paste to replace…" : "sk-…"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              data-no-drag
            />
            <p className="text-[10.5px]" style={{ color: "rgba(255,255,255,.22)" }}>Stored locally only — never leaves your machine.</p>
          </section>
        )}

        {provider === "ollama" && (
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>Ollama URL</p>
            <input className="glass-input" value={cur("llm_base_url") as string} onChange={(e) => set("llm_base_url", e.target.value)} data-no-drag />
          </section>
        )}

        <section className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>Model Name</p>
          <input className="glass-input" value={cur("model_name") as string} onChange={(e) => set("model_name", e.target.value)} data-no-drag />
        </section>

        {/* Transcription */}
        <section className="flex flex-col gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>Whisper Model Size</p>
          <div className="flex gap-1.5 flex-wrap">
            {SIZES.map((s) => (
              <button
                key={s}
                className="text-[11.5px] px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: cur("transcription_model_size") === s ? "rgba(124,108,255,.2)" : "rgba(38,40,52,.6)",
                  border: `1px solid ${cur("transcription_model_size") === s ? "rgba(124,108,255,.4)" : "rgba(255,255,255,.08)"}`,
                  color: cur("transcription_model_size") === s ? "#8B7CFF" : "rgba(255,255,255,.45)",
                }}
                onClick={() => set("transcription_model_size", s)}
                data-no-drag
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".8px" }}>Privacy</p>
          {([
            { key: "privacy_mode"    as const, label: "Redact secrets", desc: "Strip API keys, passwords, cards before sending to LLM" },
            { key: "local_only_mode" as const, label: "Local-only mode", desc: "Block cloud providers — enforces mock mode" },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-3">
              <Toggle on={cur(key) as boolean} onChange={(v) => set(key, v)} />
              <div>
                <p className="text-[12.5px]" style={{ color: "rgba(255,255,255,.75)" }}>{label}</p>
                <p className="text-[10.5px]" style={{ color: "rgba(255,255,255,.3)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {err && (
          <p className="text-[11px] rounded-lg px-3 py-2 selectable" style={{ color: "#f87171", background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)" }}>{err}</p>
        )}
      </div>

      {/* Save button */}
      <div className="p-4 pt-0 flex-shrink-0">
        <button className="glass-btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
