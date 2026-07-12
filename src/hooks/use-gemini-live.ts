"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveSessionResponse } from "@/server/types/live.types";
import {
  downsampleTo16k,
  float32ToInt16,
  int16ToBase64,
  LIVE_INPUT_SAMPLE_RATE,
  PcmPlaybackQueue,
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
  }) => void;
};

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
  const connectingRef = useRef(false);

  const cleanupMedia = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    void captureContextRef.current?.close();
    captureContextRef.current = null;

    playbackQueueRef.current?.flush();
    void playbackContextRef.current?.close();
    playbackContextRef.current = null;
    playbackQueueRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    sessionRef.current?.close();
    sessionRef.current = null;
    cleanupMedia();
    setStatus("idle");
  }, [cleanupMedia]);

  const handleServerMessage = useCallback((message: {
    serverContent?: {
      interrupted?: boolean;
      turnComplete?: boolean;
      inputTranscription?: { text?: string };
      outputTranscription?: { text?: string };
      interimInputTranscription?: { text?: string };
      modelTurn?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
        }>;
      };
    };
    data?: string;
  }) => {
    if (message.data) {
      playbackQueueRef.current?.enqueuePcm16(message.data);
      setStatus("speaking");
    }

    const content = message.serverContent;
    if (!content) {
      return;
    }

    if (content.interrupted) {
      playbackQueueRef.current?.flush();
      setStatus(mutedRef.current ? "listening" : "listening");
    }

    if (content.interimInputTranscription?.text) {
      setInputTranscript(content.interimInputTranscription.text);
    } else if (content.inputTranscription?.text) {
      setInputTranscript(content.inputTranscription.text);
    }

    if (content.outputTranscription?.text) {
      setOutputTranscript((prev) => {
        const chunk = content.outputTranscription!.text!;
        if (!chunk) return prev;
        if (content.turnComplete) return chunk;
        return prev.includes(chunk) ? prev : prev + chunk;
      });
    }

    const parts = content.modelTurn?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data && inline.mimeType?.includes("audio")) {
        playbackQueueRef.current?.enqueuePcm16(inline.data);
        setStatus("speaking");
      }
    }

    if (content.turnComplete) {
      setStatus(mutedRef.current ? "listening" : "listening");
    }
  }, []);

  const startMicrophone = useCallback(async (session: LiveSession) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    mediaStreamRef.current = stream;

    const captureContext = new AudioContext();
    captureContextRef.current = captureContext;
    await captureContext.resume();

    const playbackContext = new AudioContext();
    playbackContextRef.current = playbackContext;
    await playbackContext.resume();
    playbackQueueRef.current = new PcmPlaybackQueue(playbackContext);

    const source = captureContext.createMediaStreamSource(stream);
    const processor = captureContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (event) => {
      if (mutedRef.current || !sessionRef.current) return;

      const channel = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleTo16k(channel, captureContext.sampleRate);
      const pcm = float32ToInt16(downsampled);

      session.sendRealtimeInput({
        audio: {
          data: int16ToBase64(pcm),
          mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
        },
      });
    };

    const gain = captureContext.createGain();
    gain.gain.value = 0;
    source.connect(processor);
    processor.connect(gain);
    gain.connect(captureContext.destination);
  }, []);

  const connect = useCallback(async () => {
    if (connectingRef.current || sessionRef.current) return;

    connectingRef.current = true;
    setError(null);
    setInputTranscript("");
    setOutputTranscript("");
    setStatus("connecting");

    try {
      const response = await fetch("/api/gemini/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceProfile }),
      });

      const payload = (await response.json()) as ApiSessionResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error?.message ??
            "Ses oturumu başlatılamadı. Lütfen tekrar deneyin.",
        );
      }

      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: payload.data.token,
        httpOptions: { apiVersion: payload.data.apiVersion },
      });

      const session = await ai.live.connect({
        model: payload.data.model,
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            setStatus("listening");
          },
          onmessage: (message) => {
            handleServerMessage(message);
          },
          onerror: () => {
            setError("Canlı ses bağlantısında hata oluştu.");
            setStatus("error");
          },
          onclose: () => {
            sessionRef.current = null;
            cleanupMedia();
            setStatus("idle");
          },
        },
      });

      sessionRef.current = session as LiveSession;
      await startMicrophone(session as LiveSession);
      connectingRef.current = false;
    } catch (err) {
      connectingRef.current = false;
      cleanupMedia();
      sessionRef.current = null;
      const message =
        err instanceof Error
          ? err.message
          : "Ses modu başlatılamadı. Mikrofon iznini kontrol edin.";
      setError(message);
      setStatus("error");
    }
  }, [cleanupMedia, handleServerMessage, startMicrophone, voiceProfile]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      if (next) {
        sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
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
