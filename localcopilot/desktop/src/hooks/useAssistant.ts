import { useCallback, useState } from "react";
import { api } from "../lib/api";
import type { AssistantResponse } from "../lib/types";

export function useAssistant() {
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (
      sessionId: number,
      opts: { title?: string; notes?: string; query?: string } = {}
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.assist({
          session_id: sessionId,
          meeting_title: opts.title,
          user_notes: opts.notes,
          user_query: opts.query,
        });
        setResponse(res);
        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Assistant request failed";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { response, loading, error, ask, clear };
}
