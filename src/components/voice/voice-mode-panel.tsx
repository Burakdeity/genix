"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, MicOff, X } from "lucide-react";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { useVoiceStore } from "@/stores/voice.store";
import {
  VOICE_PROFILES,
} from "@/types/voice.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceModePanelProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
  lastAssistantText?: string;
}

export function VoiceModePanel({
  onSend,
  isLoading,
  lastAssistantText,
}: VoiceModePanelProps) {
  const isOpen = useVoiceStore((state) => state.isOpen);
  const close = useVoiceStore((state) => state.close);
  const profileId = useVoiceStore((state) => state.profileId);
  const setProfileId = useVoiceStore((state) => state.setProfileId);
  const autoSpeak = useVoiceStore((state) => state.autoSpeak);

  const [status, setStatus] = useState("Dinlemek için mikrofona dokunun");
  const pendingRef = useRef("");
  const spokeForRef = useRef<string | null>(null);

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis(profileId);

  const {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
    resetTranscript,
  } = useSpeechRecognition({
    onInterimTranscript: (text) => {
      setStatus(text);
    },
    onFinalTranscript: (text) => {
      pendingRef.current = `${pendingRef.current} ${text}`.trim();
      setStatus(pendingRef.current || "Dinliyorum...");
    },
  });

  useEffect(() => {
    if (!isOpen) {
      stop();
      stopSpeaking();
      pendingRef.current = "";
      resetTranscript();
      setStatus("Dinlemek için mikrofona dokunun");
    }
  }, [isOpen, resetTranscript, stop, stopSpeaking]);

  useEffect(() => {
    if (
      !autoSpeak ||
      !lastAssistantText?.trim() ||
      isLoading ||
      isListening ||
      spokeForRef.current === lastAssistantText
    ) {
      return;
    }

    spokeForRef.current = lastAssistantText;
    speak(lastAssistantText);
    setStatus("Yanıt okunuyor...");
  }, [autoSpeak, isLoading, isListening, lastAssistantText, speak]);

  if (!isOpen) return null;

  const profileIndex = VOICE_PROFILES.findIndex(
    (profile) => profile.id === profileId,
  );
  const activeProfile = VOICE_PROFILES[profileIndex] ?? VOICE_PROFILES[0];

  function selectProfile(offset: number) {
    const nextIndex =
      (profileIndex + offset + VOICE_PROFILES.length) % VOICE_PROFILES.length;
    setProfileId(VOICE_PROFILES[nextIndex].id);
  }

  async function handleMicToggle() {
    if (isListening) {
      stop();
      const message = pendingRef.current.trim();
      pendingRef.current = "";
      resetTranscript();

      if (!message) {
        setStatus("Mesaj algılanmadı. Tekrar deneyin.");
        return;
      }

      setStatus("Gönderiliyor...");
      await onSend(message);
      setStatus("Yanıt bekleniyor...");
      return;
    }

    pendingRef.current = "";
    resetTranscript();
    setStatus("Dinliyorum...");
    start();
  }

  return (
    <div className="fixed inset-0 z-[400] flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-foreground">Ses modu</p>
        <button
          type="button"
          onClick={close}
          className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-8 text-center text-lg font-semibold text-foreground">
          Ses modunu dene
        </p>

        <div
          className={cn(
            "genix-voice-orb mb-10",
            isListening && "genix-voice-orb-active",
            (isLoading || isSpeaking) && "genix-voice-orb-speaking",
          )}
          aria-hidden
        />

        <p className="mb-10 max-w-md text-center text-sm text-muted-foreground">
          {error ?? status ?? transcript}
        </p>

        <div className="mb-10 flex w-full max-w-sm items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => selectProfile(-1)}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Önceki ses"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-2xl font-semibold text-foreground">
              {activeProfile.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeProfile.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => selectProfile(1)}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Sonraki ses"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={() => void handleMicToggle()}
          disabled={!isSupported || isLoading}
          className="h-14 w-14 rounded-full p-0"
        >
          {isListening ? (
            <MicOff className="size-6" />
          ) : (
            <Mic className="size-6" />
          )}
        </Button>

        {!isSupported ? (
          <p className="mt-4 text-center text-xs text-destructive">
            Canlı ses için Chrome veya Edge kullanın.
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Konuşmayı bitirince mikrofona tekrar dokunun
          </p>
        )}
      </div>
    </div>
  );
}
