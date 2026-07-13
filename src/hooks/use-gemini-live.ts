"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

import type { LiveSessionResponse } from "@/server/types/live.types";
import {
  BARGE_IN_GUARD_MS,
  BARGE_IN_RMS,
  downsampleTo16k,
  float32ToInt16,
  int16ToBase64,
  LIVE_INPUT_SAMPLE_RATE,
  PcmPlaybackQueue,
  primeVoiceAudio,
  releasePrimedVoiceAudio,
  rmsLevel,
  takePrimedVoiceAudio,
} from "@/lib/voice/audio-utils";
import type { VoiceProfileId } from "@/types/voice.types";
import { useVoiceStore } from "@/stores/voice.store";

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

function microphoneErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Mikrofon başlatılamadı. Tarayıcı izinlerini kontrol edin.";
  }

  const name = error.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Mikrofon izni reddedildi. Tarayıcı ayarlarından mikrofona izin verin.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Mikrofon bulunamadı. Bağlı bir mikrofon olduğundan emin olun.";
  }
  if (name === "NotReadableError") {
    return "Mikrofon kullanılamıyor. Başka bir uygulama kullanıyor olabilir.";
  }

  return error.message || "Mikrofon başlatılamadı.";
}

function releaseAudioBundle(bundle: {
  capture: AudioContext;
  playback: AudioContext;
  stream: MediaStream;
}): void {
  bundle.stream.getTracks().forEach((track) => track.stop());
  void bundle.capture.close();
  void bundle.playback.close();
}

async function acquireVoiceAudio(): Promise<{
  capture: AudioContext;
  playback: AudioContext;
  stream: MediaStream;
}> {
  const primed = takePrimedVoiceAudio();
  if (primed) return primed;

  await primeVoiceAudio();
  return takePrimedVoiceAudio() ?? (await primeVoiceAudio());
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
  const speakingRef = useRef(false);
  const speakStartedAtRef = useRef(0);
  const turnCompletePendingRef = useRef(false);
  const inputTranscriptRef = useRef("");
  const bargeInHitsRef = useRef(0);

  voiceProfileRef.current = voiceProfile;

  const markListening = useCallback(() => {
    speakingRef.current = false;
    turnCompletePendingRef.current = false;
    bargeInHitsRef.current = 0;
    setStatus("listening");
  }, []);

  const markSpeaking = useCallback(() => {
    if (!speakingRef.current) {
      speakStartedAtRef.current = Date.now();
      bargeInHitsRef.current = 0;
    }
    speakingRef.current = true;
    setStatus("speaking");
  }, []);

  const cleanupMedia = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
    }
    mediaStreamRef.current = null;

    playbackQueueRef.current?.setOnDrain(null);
    playbackQueueRef.current?.flush();
    void captureContextRef.current?.close();
    captureContextRef.current = null;

    void playbackContextRef.current?.close();
    playbackContextRef.current = null;
    playbackQueueRef.current = null;
    speakingRef.current = false;
    turnCompletePendingRef.current = false;
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
        // Only honor interruption if user is clearly speaking (not speaker echo).
        const recentBarge =
          Date.now() - speakStartedAtRef.current > BARGE_IN_GUARD_MS;
        if (recentBarge || !speakingRef.current) {
          playbackQueueRef.current?.flush();
          markListening();
        }
      }

      if (content.inputTranscription?.text) {
        const next = content.inputTranscription.text;
        // New user turn after assistant spoke → clear old Orwix caption.
        if (
          next &&
          next !== inputTranscriptRef.current &&
          next.length < inputTranscriptRef.current.length
        ) {
          setOutputTranscript("");
        }
        inputTranscriptRef.current = next;
        setInputTranscript(next);
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
          markSpeaking();
        }
      }

      if (content.turnComplete) {
        // Keep "speaking" until the playback queue actually drains.
        if (playbackQueueRef.current?.isPlaying) {
          turnCompletePendingRef.current = true;
        } else {
          markListening();
        }
      }
    },
    [markListening, markSpeaking],
  );

  const startMicrophone = useCallback(
    async (session: LiveSession, connectId: number) => {
      const audio = await acquireVoiceAudio();

      if (connectId !== connectIdRef.current) {
        releaseAudioBundle(audio);
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

      const queue = new PcmPlaybackQueue(audio.playback);
      queue.setOnDrain(() => {
        if (connectId !== connectIdRef.current) return;
        if (turnCompletePendingRef.current || speakingRef.current) {
          markListening();
        }
      });
      playbackQueueRef.current = queue;
      await queue.ensureRunning();

      const source = audio.capture.createMediaStreamSource(audio.stream);
      // Larger buffer = fewer glitches / more stable streaming under load.
      const processor = audio.capture.createScriptProcessor(8192, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (mutedRef.current || !sessionRef.current) return;
        if (connectId !== connectIdRef.current) return;

        const channel = event.inputBuffer.getChannelData(0);
        const level = rmsLevel(channel);

        // While Orwix is talking, don't stream mic (prevents echo cutoffs)
        // unless the user clearly barges in with sustained loud speech.
        if (speakingRef.current || playbackQueueRef.current?.isPlaying) {
          const guarded =
            Date.now() - speakStartedAtRef.current < BARGE_IN_GUARD_MS;
          if (guarded || level < BARGE_IN_RMS) {
            bargeInHitsRef.current = 0;
            return;
          }

          bargeInHitsRef.current += 1;
          // Need 3 hot frames so a cough/echo doesn't cut speech mid-word.
          if (bargeInHitsRef.current < 3) return;

          playbackQueueRef.current?.flush();
          markListening();
        } else {
          bargeInHitsRef.current = 0;
        }

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
    [markListening],
  );

  const connect = useCallback(async () => {
    const connectId = ++connectIdRef.current;
    setError(null);
    setInputTranscript("");
    setOutputTranscript("");
    inputTranscriptRef.current = "";
    setStatus("connecting");

    try {
      await primeVoiceAudio();
      if (connectId !== connectIdRef.current) return;

      const response = await fetch("/api/gemini/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceProfile: voiceProfileRef.current,
          brandBriefing: useVoiceStore.getState().brandBriefingMode,
        }),
      });

      if (connectId !== connectIdRef.current) return;

      const payload = (await response.json()) as ApiSessionResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error?.message ??
            "Ses oturumu başlatılamadı. Lütfen tekrar deneyin.",
        );
      }

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

      // Soft opener — lock Turkish + native accent from the first utterance.
      try {
        session.sendRealtimeInput({
          text: "RESPOND IN TURKISH. YOU MUST RESPOND UNMISTAKABLY IN TURKISH. Native Istanbul Turkish only. Kullanıcı yeni bağlandı. Çok kısa ve samimi selamla; kendini Orwix olarak tanıt. Tek İngilizce kelime yok. İngilizce aksan yok. Kelimeleri yutma; harfleri net bitir.",
        });
      } catch {
        // optional greeting
      }

      setStatus("listening");
    } catch (err) {
      if (connectId !== connectIdRef.current) return;
      cleanupMedia();
      releasePrimedVoiceAudio();
      sessionRef.current = null;
      const message =
        err instanceof DOMException ||
        (err instanceof Error && err.name.includes("Error"))
          ? microphoneErrorMessage(err)
          : err instanceof Error
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
