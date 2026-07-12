"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  RefreshCw,
  X,
} from "lucide-react";

import { useGeminiLive } from "@/hooks/use-gemini-live";
import { useVoiceStore } from "@/stores/voice.store";
import {
  getVoiceProfile,
  VOICE_PROFILES,
} from "@/types/voice.types";
import { Button } from "@/components/ui/button";
import { MessageMarkdown } from "@/components/chat/message-markdown";
import { cn } from "@/lib/utils";

function statusLabel(
  status: ReturnType<typeof useGeminiLive>["status"],
  isMuted: boolean,
): string {
  if (isMuted) return "Mikrofon kapalı";
  switch (status) {
    case "connecting":
      return "Bağlanıyor…";
    case "listening":
      return "Dinliyorum — konuşabilirsin";
    case "speaking":
      return "Konuşuyorum…";
    case "error":
      return "Bağlantı hatası";
    default:
      return "Canlı ses hazırlanıyor…";
  }
}

export function VoiceModePanel() {
  const isOpen = useVoiceStore((state) => state.isOpen);
  const close = useVoiceStore((state) => state.close);
  const profileId = useVoiceStore((state) => state.profileId);
  const setProfileId = useVoiceStore((state) => state.setProfileId);

  const {
    status,
    error,
    inputTranscript,
    outputTranscript,
    isMuted,
    connect,
    disconnect,
    toggleMute,
  } = useGeminiLive(profileId);

  useEffect(() => {
    if (!isOpen) {
      disconnect();
      return;
    }

    void connect();
  }, [isOpen, connect, disconnect]);

  const previousProfileRef = useRef(profileId);

  useEffect(() => {
    if (!isOpen) {
      previousProfileRef.current = profileId;
      return;
    }

    if (previousProfileRef.current === profileId) return;

    previousProfileRef.current = profileId;
    disconnect();
    void connect();
  }, [profileId, isOpen, connect, disconnect]);

  if (!isOpen) return null;

  const profileIndex = VOICE_PROFILES.findIndex(
    (profile) => profile.id === profileId,
  );
  const activeProfile = getVoiceProfile(profileId);

  function selectProfile(offset: number) {
    const nextIndex =
      (profileIndex + offset + VOICE_PROFILES.length) % VOICE_PROFILES.length;
    setProfileId(VOICE_PROFILES[nextIndex].id);
  }

  function handleClose() {
    disconnect();
    close();
  }

  const orbActive = status === "listening" || status === "connecting";
  const orbSpeaking = status === "speaking";

  return (
    <div className="fixed inset-0 z-[400] flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-foreground">Canlı ses</p>
        <button
          type="button"
          onClick={handleClose}
          className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-2 text-center text-lg font-semibold text-foreground">
          Orwix ile konuş
        </p>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Doğal, kesintisiz sesli sohbet
        </p>

        <div
          className={cn(
            "orwix-voice-orb mb-8",
            orbActive && "orwix-voice-orb-active",
            orbSpeaking && "orwix-voice-orb-speaking",
          )}
          aria-hidden
        />

        <p className="mb-6 text-center text-sm font-medium text-foreground">
          {statusLabel(status, isMuted)}
        </p>

        <div className="mb-8 w-full max-w-md space-y-3 text-center">
          {inputTranscript ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">Sen: </span>
              <MessageMarkdown
                text={inputTranscript}
                className="inline whitespace-pre-wrap"
              />
            </div>
          ) : null}
          {outputTranscript ? (
            <div className="text-sm text-foreground">
              <span className="font-medium text-muted-foreground">Orwix: </span>
              <MessageMarkdown
                text={outputTranscript}
                className="inline whitespace-pre-wrap"
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="mb-10 flex w-full max-w-sm items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => selectProfile(-1)}
            disabled={status === "connecting"}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50"
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
            disabled={status === "connecting"}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Sonraki ses"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            size="lg"
            variant={isMuted ? "secondary" : "default"}
            onClick={toggleMute}
            disabled={status === "connecting" || status === "idle"}
            className="h-14 w-14 rounded-full p-0"
            aria-label={isMuted ? "Mikrofonu aç" : "Mikrofonu kapat"}
          >
            {isMuted ? (
              <MicOff className="size-6" />
            ) : (
              <Mic className="size-6" />
            )}
          </Button>

          {status === "error" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void connect()}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Tekrar bağlan
            </Button>
          ) : null}
        </div>

        <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
          Chrome veya Edge önerilir. Konuşmayı bitirmek için duraklayın; Orwix
          otomatik cevaplar.
        </p>
      </div>
    </div>
  );
}
