import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Settings, SettingsUpdate } from "../lib/types";

const DEFAULTS: Settings = {
  llm_provider: "mock",
  api_key_set: false,
  model_name: "claude-sonnet-4-6",
  llm_base_url: "http://localhost:11434",
  transcription_model_size: "base",
  hotkey: "CmdOrCtrl+Enter",
  privacy_mode: false,
  local_only_mode: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (updates: SettingsUpdate): Promise<Settings> => {
      const updated = await api.updateSettings(updates);
      setSettings(updated);
      return updated;
    },
    []
  );

  return { settings, loading, error, update, reload: load };
}
