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
      return "Bağlanıyor…";
    case "listening":
      return "Seni dinliyorum";
    case "speaking":
      return "Konuşuyor";
    case "error":
      return "Bağlantı koptu";
    default:
      return "Hazırlanıyor…";
  }
}

export function VoiceModePanel() {
  const isOpen = useVoiceStore((state) => state.isOpen);
  const close = useVoiceStore((state) => state.close);
  const brandBriefingMode = useVoiceStore((state) => state.brandBriefingMode);
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

      <header className="relative z-20 flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {brandBriefingMode ? "Sesli marka brifingi" : "Canlı ses"}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground/80">
            {remainingMinutes} dk kaldı
            {isPro
              ? ` · Pro (${PRO_VOICE_MINUTES})`
              : ` · ücretsiz (${FREE_VOICE_MINUTES})`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground backdrop-blur hover:bg-muted hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Scrollable middle — avatar + status + transcript */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-3 pt-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center">
          <h2 className="mb-1 text-center text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
            {brandBriefingMode ? "Markanı birlikte doğuralım" : "Orwix ile konuş"}
          </h2>

          <div
            className={cn(
              "orwix-voice-stage my-3 shrink-0",
              orbActive && "orwix-voice-stage-active",
              orbSpeaking && "orwix-voice-stage-speaking",
              isMuted && "opacity-80",
            )}
          >
            <div className="orwix-voice-ring" aria-hidden />
            <div className="orwix-voice-ring orwix-voice-ring-delay" aria-hidden />
            <div
              className={cn(
                "orwix-voice-orb",
                orbActive && "orwix-voice-orb-active",
                orbSpeaking && "orwix-voice-orb-speaking",
              )}
              aria-hidden
            />
          </div>

          <div className="mb-3 flex flex-col items-center gap-1">
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

          <div className="orwix-voice-transcript mb-2 w-full space-y-2">
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {inputTranscript ? (
              <div className="rounded-2xl border border-border/40 bg-background/55 px-3 py-2.5 text-left backdrop-blur">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Sen
                </p>
                <MessageMarkdown
                  text={inputTranscript}
                  className="text-sm leading-relaxed text-foreground/85"
                />
              </div>
            ) : null}
            {outputTranscript ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-left backdrop-blur">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                  Orwix
                </p>
                <MessageMarkdown
                  text={outputTranscript}
                  className="text-sm leading-relaxed text-foreground"
                />
              </div>
            ) : null}
            {!inputTranscript && !outputTranscript && !error ? (
              <p className="text-center text-xs text-muted-foreground">
                Konuşmaya başla — metin burada görünür
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sticky controls — always visible */}
      <div className="relative z-20 shrink-0 border-t border-border/40 bg-background/85 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/50 bg-background/70 px-2 py-2">
            <button
              type="button"
              onClick={() => selectProfile(-1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-95"
              aria-label="Önceki ses"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-base font-semibold tracking-[-0.02em] text-foreground">
                {activeProfile.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeProfile.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => selectProfile(1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-95"
              aria-label="Sonraki ses"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              variant={isMuted ? "secondary" : "default"}
              onClick={toggleMute}
              disabled={status === "connecting" || status === "idle"}
              className="h-14 w-14 rounded-full p-0 shadow-lg"
              aria-label={isMuted ? "Mikrofonu aç" : "Mikrofonu kapat"}
            >
              {isMuted ? (
                <MicOff className="size-5" />
              ) : (
                <Mic className="size-5" />
              )}
            </Button>

            {status === "error" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRetry()}
                className="h-11 gap-2 rounded-full px-4"
              >
                <RefreshCw className="size-4" />
                Tekrar bağlan
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 gap-2 rounded-full px-4"
              >
                <PhoneOff className="size-4" />
                Bitir
              </Button>
            )}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Headphones className="size-3 shrink-0 opacity-70" />
            Kulaklık önerilir
          </p>
        </div>
      </div>
    </div>
  );
}
