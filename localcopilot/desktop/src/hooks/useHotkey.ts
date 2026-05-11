import { useEffect } from "react";

type ModKey = "Meta" | "Control" | "Alt" | "Shift";

interface HotkeyOptions {
  key: string;
  mods?: ModKey[];
  onTrigger: () => void;
  enabled?: boolean;
}

export function useHotkey({ key, mods = [], onTrigger, enabled = true }: HotkeyOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const modMap: Record<ModKey, boolean> = {
        Meta: e.metaKey,
        Control: e.ctrlKey,
        Alt: e.altKey,
        Shift: e.shiftKey,
      };
      const modsOk = mods.every((m) => modMap[m]);
      const keyOk = e.key.toLowerCase() === key.toLowerCase();
      if (modsOk && keyOk) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, mods, onTrigger, enabled]);
}
