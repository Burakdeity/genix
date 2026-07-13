"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  X,
} from "lucide-react";

import { MessageMarkdown } from "@/components/chat/message-markdown";
import { Button } from "@/components/ui/button";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { FREE_VOICE_MINUTES, PRO_VOICE_MINUTES } from "@/lib/billing/plans";
import { primeVoiceAudio } from "@/lib/voice/audio-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";
import { useVoiceQuotaStore } from "@/stores/voice-quota.store";
import { useVoiceStore } from "@/stores/voice.store";
import {
  getVoiceProfile,
  VOICE_PROFILES,
} from "@/types/voice.types";

function statusLabel(
  status: ReturnType<typeof useGeminiLive>["status"],
  isMuted: boolean,
): string {
  if (isMuted) return "Mikrofon kapalı";
  switch (status) {
    case "connecting":
      return "Güvenli oturum açılıyor…";
    case "listening":
      return "Seni dinliyorum";
    case "speaking":
      return "Orwix konuşuyor";
    case "error":
      return "Bağlantı kesildi";
    default:
      return "Hazırlanıyor…";
  }
}

export function VoiceModePanel() {
  const isOpen = useVoiceStore((state) => state.isOpen);
  const close = useVoiceStore((state) => state.close);
  const profileId = useVoiceStore((state) => state.profileId);
  const setProfileId = useVoiceStore((state) => state.setProfileId);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const isPro = useImageQuotaStore((state) => state.isPro(activeAccountId));
  const remainingSeconds = useVoiceQuotaStore((state) =>
    state.getRemainingSeconds(activeAccountId),
  );

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

  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    if (!isOpen) {
      disconnectRef.current();
      return;
    }

    void connectRef.current();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (status !== "listening" && status !== "speaking") return;

    const tickMs = 5000;
    const id = window.setInterval(() => {
      const accountId = useAuthStore.getState().activeAccountId;
      useVoiceQuotaStore.getState().consumeSeconds(accountId, tickMs / 1000);
      const left = useVoiceQuotaStore.getState().getRemainingSeconds(accountId);
      if (left <= 0) {
        disconnectRef.current();
        useVoiceStore.getState().close();
        if (!accountId) {
          useImageQuotaStore.getState().openLoginModal();
        } else if (!useImageQuotaStore.getState().isPro(accountId)) {
          useImageQuotaStore.getState().openProModal();
        }
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [isOpen, status]);

  const previousProfileRef = useRef(profileId);

  useEffect(() => {
    if (!isOpen) {
      previousProfileRef.current = profileId;
      return;
    }

    if (previousProfileRef.current === profileId) return;
    previousProfileRef.current = profileId;

    disconnectRef.current();
    void connectRef.current();
  }, [profileId, isOpen]);

  if (!isOpen) return null;

  const profileIndex = VOICE_PROFILES.findIndex(
    (profile) => profile.id === profileId,
  );
  const activeProfile = getVoiceProfile(profileId);
  const remainingMinutes = Math.max(0, Math.ceil(remainingSeconds / 60));

  function selectProfile(offset: number) {
    const nextIndex =
      (profileIndex + offset + VOICE_PROFILES.length) % VOICE_PROFILES.length;
    setProfileId(VOICE_PROFILES[nextIndex].id);
  }

  function handleClose() {
    disconnect();
    close();
  }

  async function handleRetry() {
    try {
      await primeVoiceAudio();
    } catch {
      // connect() will surface mic errors
    }
    void connect();
  }

  const orbActive = status === "listening" || status === "connecting";
  const orbSpeaking = status === "speaking";

  return (
    <div className="orwix-voice-shell fixed inset-0 z-[400] flex flex-col">
      <div className="orwix-voice-backdrop" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Canlı ses
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground/80">
            Orwix Voice · {remainingMinutes} dk kaldı
            {isPro ? ` · Pro (${PRO_VOICE_MINUTES})` : ` · ücretsiz (${FREE_VOICE_MINUTES})`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex size-10 items-center justify-center rounded-full border border-border/50 bg-background/70 text-muted-foreground backdrop-blur hover:bg-muted hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-8">
        <div className="mb-8 max-w-md text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Orwix ile konuş
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Samimi, biraz cilveli — komik olunca güler, sohbeti hafif tutar.
          </p>
        </div>

        <div
          className={cn(
            "orwix-voice-stage mb-8",
            orbActive && "orwix-voice-stage-active",
            orbSpeaking && "orwix-voice-stage-speaking",
            isMuted && "opacity-70",
          )}
        >
          <div className="orwix-voice-ring" aria-hidden />
          <div
            className={cn(
              "orwix-voice-orb",
              orbActive && "orwix-voice-orb-active",
              orbSpeaking && "orwix-voice-orb-speaking",
            )}
            aria-hidden
          />
        </div>

        <div className="mb-7 flex flex-col items-center gap-2">
          <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
            {statusLabel(status, isMuted)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                status === "error"
                  ? "bg-destructive"
                  : status === "connecting"
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
            />
            {status === "connecting"
              ? "Bağlanıyor"
              : status === "error"
                ? "Yeniden dene"
                : "Canlı"}
          </div>
        </div>

        <div className="orwix-voice-transcript mb-8 w-full max-w-lg space-y-3">
          {inputTranscript ? (
            <div className="rounded-2xl border border-border/40 bg-background/55 px-4 py-3 text-left backdrop-blur">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Sen
              </p>
              <MessageMarkdown
                text={inputTranscript}
                className="text-sm leading-relaxed text-foreground/85"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/40 bg-background/35 px-4 py-3 text-center text-sm text-muted-foreground backdrop-blur">
              Konuşmaya başla — metin burada görünecek
            </div>
          )}
          {outputTranscript ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-left backdrop-blur">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                Orwix
              </p>
              <MessageMarkdown
                text={outputTranscript}
                className="text-sm leading-relaxed text-foreground"
              />
            </div>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mb-8 flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/60 px-3 py-3 backdrop-blur">
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
            <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              {activeProfile.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
            className="h-16 w-16 rounded-full p-0 shadow-lg"
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
              onClick={() => void handleRetry()}
              className="h-12 gap-2 rounded-full px-5"
            >
              <RefreshCw className="size-4" />
              Tekrar bağlan
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-12 gap-2 rounded-full px-5"
            >
              <PhoneOff className="size-4" />
              Bitir
            </Button>
          )}
        </div>

        <p className="mt-7 flex max-w-md items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Headphones className="size-3.5 shrink-0 opacity-70" />
          Kulaklık önerilir — yankı azalır, konuşman daha net kesilmez.
        </p>
      </div>
    </div>
  );
}
