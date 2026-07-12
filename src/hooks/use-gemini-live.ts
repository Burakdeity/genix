"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveSessionResponse } from "@/server/types/live.types";
import {
  downsampleTo16k,
  float32ToInt16,
  int16ToBase64,
  LIVE_INPUT_SAMPLE_RATE,
  PcmPlaybackQueue,
  primeVoiceAudio,
  releasePrimedVoiceAudio,
  takePrimedVoiceAudio,
} from "@/lib/voice/audio-utils";
import type { VoiceProfileId } from "@/types/voice.types";

export type GeminiLiveStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

interface ApiSessionResponse {
  success: boolean;
  data?: LiveSessionResponse;
  error?: { message: string; code: string; statusCode: number };
}

type LiveSession = {
  close: () => void;
  sendRealtimeInput: (params: {
    audio?: { data: string; mimeType: string };
    audioStreamEnd?: boolean;
    text?: string;
  }) => void;
};

function closeReasonMessage(event: { code?: number; reason?: string } | unknown): string {
  if (!event || typeof event !== "object") {
    return "Canlı ses bağlantısı kapandı.";
  }
  const record = event as { code?: number; reason?: string };
  const reason = record.reason?.trim();
  if (reason) return reason;
  if (record.code && record.code !== 1000) {
    return `Canlı ses bağlantısı kapandı (kod ${record.code}).`;
  }
  return "Canlı ses bağlantısı kapandı.";
}

export function useGeminiLive(voiceProfile: VoiceProfileId) {
  const [status, setStatus] = useState<GeminiLiveStatus>("idle");
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<PcmPlaybackQueue | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mutedRef = useRef(false);
  const connectIdRef = useRef(0);
  const voiceProfileRef = useRef(voiceProfile);

  voiceProfileRef.current = voiceProfile;

  const cleanupMedia = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
    }
    mediaStreamRef.current = null;

    void captureContextRef.current?.close();
    captureContextRef.current = null;

    playbackQueueRef.current?.flush();
    void playbackContextRef.current?.close();
    playbackContextRef.current = null;
    playbackQueueRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    connectIdRef.current += 1;
    sessionRef.current?.close();
    sessionRef.current = null;
    cleanupMedia();
    releasePrimedVoiceAudio();
    setStatus("idle");
  }, [cleanupMedia]);

  const handleServerMessage = useCallback(
    (message: {
      serverContent?: {
        interrupted?: boolean;
        turnComplete?: boolean;
        inputTranscription?: { text?: string };
        outputTranscription?: { text?: string };
        modelTurn?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string };
            text?: string;
          }>;
        };
      };
    }) => {
      const content = message.serverContent;
      if (!content) return;

      if (content.interrupted) {
        playbackQueueRef.current?.flush();
        setStatus("listening");
      }

      if (content.inputTranscription?.text) {
        setInputTranscript(content.inputTranscription.text);
      }

      if (content.outputTranscription?.text) {
        const chunk = content.outputTranscription.text;
        setOutputTranscript((prev) => {
          if (!chunk) return prev;
          if (content.turnComplete) return chunk;
          if (!prev) return chunk;
          if (chunk.startsWith(prev)) return chunk;
          if (prev.endsWith(chunk)) return prev;
          return prev + chunk;
        });
      }

      const parts = content.modelTurn?.parts ?? [];
      for (const part of parts) {
        const inline = part.inlineData;
        if (inline?.data && (!inline.mimeType || inline.mimeType.includes("audio"))) {
          playbackQueueRef.current?.enqueuePcm16(inline.data);
          setStatus("speaking");
        }
      }

      if (content.turnComplete) {
        setStatus("listening");
      }
    },
    [],
  );

  const startMicrophone = useCallback(
    async (session: LiveSession, connectId: number) => {
      const primed = takePrimedVoiceAudio();
      const audio =
        primed ??
        (await primeVoiceAudio().then((bundle) => {
          // take ownership from prime helpers
          return takePrimedVoiceAudio() ?? bundle;
        }));

      if (connectId !== connectIdRef.current) {
        audio.stream.getTracks().forEach((track) => track.stop());
        void audio.capture.close();
        void audio.playback.close();
        return;
      }

      mediaStreamRef.current = audio.stream;
      captureContextRef.current = audio.capture;
      playbackContextRef.current = audio.playback;

      if (audio.capture.state === "suspended") {
        await audio.capture.resume();
      }
      if (audio.playback.state === "suspended") {
        await audio.playback.resume();
      }

      playbackQueueRef.current = new PcmPlaybackQueue(audio.playback);
      await playbackQueueRef.current.ensureRunning();

      const source = audio.capture.createMediaStreamSource(audio.stream);
      const processor = audio.capture.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (mutedRef.current || !sessionRef.current) return;
        if (connectId !== connectIdRef.current) return;

        const channel = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleTo16k(channel, audio.capture.sampleRate);
        if (downsampled.length === 0) return;

        const pcm = float32ToInt16(downsampled);
        try {
          session.sendRealtimeInput({
            audio: {
              data: int16ToBase64(pcm),
              mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
            },
          });
        } catch {
          // session may already be closed
        }
      };

      const gain = audio.capture.createGain();
      gain.gain.value = 0;
      source.connect(processor);
      processor.connect(gain);
      gain.connect(audio.capture.destination);
    },
    [],
  );

  const connect = useCallback(async () => {
    const connectId = ++connectIdRef.current;
    setError(null);
    setInputTranscript("");
    setOutputTranscript("");
    setStatus("connecting");

    try {
      // Prime mic/AudioContext as early as possible (ideally already primed on click).
      await primeVoiceAudio();
      if (connectId !== connectIdRef.current) return;

      const response = await fetch("/api/gemini/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceProfile: voiceProfileRef.current }),
      });

      if (connectId !== connectIdRef.current) return;

      const payload = (await response.json()) as ApiSessionResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error?.message ??
            "Ses oturumu başlatılamadı. Lütfen tekrar deneyin.",
        );
      }

      const { GoogleGenAI, Modality } = await import("@google/genai");
      if (connectId !== connectIdRef.current) return;

      const ai = new GoogleGenAI({
        apiKey: payload.data.token,
        httpOptions: { apiVersion: payload.data.apiVersion },
      });

      const session = await ai.live.connect({
        model: payload.data.model,
        // Config is locked by ephemeral token constraints — keep client setup minimal.
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            if (connectId !== connectIdRef.current) return;
            setStatus("listening");
          },
          onmessage: (message) => {
            if (connectId !== connectIdRef.current) return;
            handleServerMessage(message);
          },
          onerror: (event) => {
            if (connectId !== connectIdRef.current) return;
            const detail =
              event && typeof event === "object" && "message" in event
                ? String((event as { message?: string }).message ?? "")
                : "";
            setError(
              detail ||
                "Canlı ses bağlantısında hata oluştu. Tekrar deneyin.",
            );
            setStatus("error");
          },
          onclose: (event) => {
            if (connectId !== connectIdRef.current) return;
            sessionRef.current = null;
            cleanupMedia();
            const code =
              event && typeof event === "object" && "code" in event
                ? Number((event as { code?: number }).code)
                : 1000;
            if (code && code !== 1000) {
              setError(closeReasonMessage(event));
              setStatus("error");
              return;
            }
            setStatus("idle");
          },
        },
      });

      if (connectId !== connectIdRef.current) {
        session.close();
        return;
      }

      sessionRef.current = session as LiveSession;
      await startMicrophone(session as LiveSession, connectId);

      if (connectId !== connectIdRef.current) {
        session.close();
        cleanupMedia();
        return;
      }

      setStatus("listening");
    } catch (err) {
      if (connectId !== connectIdRef.current) return;
      cleanupMedia();
      releasePrimedVoiceAudio();
      sessionRef.current = null;
      const message =
        err instanceof Error
          ? err.message
          : "Ses modu başlatılamadı. Mikrofon iznini kontrol edin.";
      setError(message);
      setStatus("error");
    }
  }, [cleanupMedia, handleServerMessage, startMicrophone]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      if (next) {
        try {
          sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    inputTranscript,
    outputTranscript,
    isMuted,
    connect,
    disconnect,
    toggleMute,
    isActive: status !== "idle" && status !== "error",
  };
}

export { primeVoiceAudio };
