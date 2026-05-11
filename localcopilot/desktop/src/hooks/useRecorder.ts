import { useCallback, useRef, useState } from "react";
import { api } from "../lib/api";

interface RecorderState {
  isRecording: boolean;
  lastTranscript: string | null;
  error: string | null;
}

export function useRecorder(sessionId: number | null) {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    lastTranscript: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (state.isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(5000); // collect 5-second slices for rolling transcription
      setState((s) => ({ ...s, isRecording: true, error: null }));
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : "Microphone access denied",
      }));
    }
  }, [state.isRecording]);

  const stop = useCallback(async () => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve();
      mediaRecorderRef.current!.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    setState((s) => ({ ...s, isRecording: false }));

    if (sessionId && blob.size > 0) {
      try {
        const result = await api.transcribeAudio(blob, sessionId);
        setState((s) => ({ ...s, lastTranscript: result.text }));
      } catch (e) {
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : "Transcription failed",
        }));
      }
    }
  }, [sessionId, state.isRecording]);

  const toggle = useCallback(async () => {
    if (state.isRecording) {
      await stop();
    } else {
      await start();
    }
  }, [state.isRecording, start, stop]);

  return { ...state, start, stop, toggle };
}
