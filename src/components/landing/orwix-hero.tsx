"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowUp,
  Calendar,
  Clapperboard,
  Globe,
  ImageIcon,
  Loader2,
  Mic,
  MonitorSmartphone,
  Plus,
  Presentation,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { OrwixLogo } from "@/components/brand/orwix-logo";
import { QualityModeToggle } from "@/components/chat/quality-mode-toggle";
import { OrwixAppStudio } from "@/components/landing/orwix-app-studio";
import {
  ORWIX_HERO,
  ORWIX_IMAGE_TEMPLATES,
  ORWIX_MORE_SUGGESTIONS,
  ORWIX_SUGGESTIONS,
  ORWIX_TEMPLATES,
  ORWIX_VIDEO_TEMPLATES,
  type OrwixMode,
} from "@/content/orwix-content";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useVoiceStore } from "@/stores/voice.store";
import type {
  ChatAttachment,
  ChatSettings,
  SendMessageOptions,
} from "@/types/chat.types";

const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function readFileAsAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const match = /^data:([^;]+);base64,(.+)$/.exec(result);
      if (!match) {
        reject(new Error("Görsel okunamadı."));
        return;
      }
      resolve({
        mimeType: match[1],
        data: match[2],
        dataUrl: result,
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });
}

function AttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-5 pb-2">
      {attachments.map((attachment, index) => (
        <div
          key={`${attachment.name ?? "img"}-${index}`}
          className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.dataUrl}
            alt={attachment.name ?? "Ek görsel"}
            className="h-16 w-16 object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
            aria-label="Görseli kaldır"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface OrwixHeroProps {
  onSend: (
    message: string,
    attachments?: ChatAttachment[],
    options?: SendMessageOptions,
  ) => Promise<void>;
  isLoading: boolean;
  hasMessages: boolean;
  promptRequest?: { id: number; text: string } | null;
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
}

function SuggestionIcon({
  icon,
}: {
  icon: (typeof ORWIX_SUGGESTIONS)[number]["icon"];
}) {
  const className = "size-3.5";
  if (icon === "image") return <ImageIcon className={className} />;
  if (icon === "video") return <Clapperboard className={className} />;
  if (icon === "research") return <Search className={className} />;
  if (icon === "slides") return <Presentation className={className} />;
  if (icon === "website") return <Calendar className={className} />;
  if (icon === "design") return <Sparkles className={className} />;
  return <MonitorSmartphone className={className} />;
}

function ModeBadgeIcon({ mode }: { mode: OrwixMode }) {
  const className = "size-3.5";
  if (mode === "image") return <ImageIcon className={className} />;
  if (mode === "video") return <Clapperboard className={className} />;
  if (mode === "research") return <Search className={className} />;
  if (mode === "website") return <Globe className={className} />;
  if (mode === "apps") return <MonitorSmartphone className={className} />;
  if (mode === "slides") return <Presentation className={className} />;
  if (mode === "design") return <Sparkles className={className} />;
  return null;
}

function ComposerBlock({
  value,
  setValue,
  isLoading,
  placeholder,
  modeLabel,
  mode,
  setMode,
  canSend,
  handleSubmit,
  fileInputRef,
  textareaRef,
  model,
  onModelChange,
  attachments,
  onRemoveAttachment,
}: {
  value: string;
  setValue: (value: string) => void;
  isLoading: boolean;
  placeholder: string;
  modeLabel: string | null;
  mode: OrwixMode;
  setMode: (mode: OrwixMode) => void;
  canSend: boolean;
  handleSubmit: () => Promise<void>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
  attachments: ChatAttachment[];
  onRemoveAttachment: (index: number) => void;
}) {
  const openVoiceMode = useVoiceStore((state) => state.open);

  return (
    <div className="orwix-composer-wrap w-full">
      <div className="orwix-composer w-full overflow-hidden">
        <div className="flex min-h-[148px] flex-col px-5 py-5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isLoading}
            rows={3}
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            className="min-h-[72px] w-full flex-1 resize-none bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none md:text-[17px]"
          />
          <AttachmentPreview
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                aria-label="Görsel ekle"
              >
                <Plus className="size-4" />
              </button>
              {modeLabel ? (
                <button
                  type="button"
                  onClick={() => setMode("general")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/25"
                >
                  <ModeBadgeIcon mode={mode} />
                  {modeLabel}
                  <X className="size-3 opacity-60" />
                </button>
              ) : null}
              <QualityModeToggle
                model={model}
                onChange={onModelChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openVoiceMode}
                disabled={isLoading}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                aria-label="Canlı ses"
              >
                <Mic className="size-4" />
              </button>
              <SendButton
                canSend={canSend}
                isLoading={isLoading}
                onClick={() => void handleSubmit()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrwixHero({
  onSend,
  isLoading,
  hasMessages,
  promptRequest = null,
  model,
  onModelChange,
}: OrwixHeroProps) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<OrwixMode>("general");
  const [moreOpen, setMoreOpen] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!promptRequest) return;
    setValue(promptRequest.text);
    setMoreOpen(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [promptRequest]);

  const hydrated = useStoresHydrated();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const accounts = useAuthStore((state) => state.accounts);
  const activeAccount =
    hydrated && activeAccountId
      ? accounts.find((account) => account.id === activeAccountId) ?? null
      : null;
  const firstName = activeAccount?.name.trim().split(/\s+/)[0] ?? null;
  const heroTitle = firstName
    ? `Merhaba, ${firstName}`
    : ORWIX_HERO.title;

  const placeholder = ORWIX_HERO.placeholders[mode];
  const modeLabel = ORWIX_HERO.modeLabels[mode];
  const isWebsiteMode = mode === "website";
  const isAppsMode = mode === "apps";
  const isImageMode = mode === "image";
  const isVideoMode = mode === "video";
  const canSend =
    (value.trim().length > 0 || attachments.length > 0) && !isLoading;

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || isLoading) return;
    const pending = attachments;
    setValue("");
    setAttachments([]);
    setAttachError(null);
    await onSend(trimmed, pending, { mode });
  };

  const selectMode = (nextMode: OrwixMode) => {
    setMode(nextMode);
    setMoreOpen(false);
  };

  const applyPrompt = (prompt: string) => {
    setValue(prompt);
    setMoreOpen(false);
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setAttachError(null);

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      setAttachError(`En fazla ${MAX_ATTACHMENTS} görsel ekleyebilirsiniz.`);
      return;
    }

    const selected = Array.from(fileList).slice(0, remaining);
    const next: ChatAttachment[] = [];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setAttachError("Sadece görsel dosyaları yüklenebilir (JPG, PNG, WEBP).");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setAttachError("Her görsel en fazla 4 MB olabilir.");
        continue;
      }
      try {
        next.push(await readFileAsAttachment(file));
      } catch {
        setAttachError("Görsel okunamadı. Başka bir dosya deneyin.");
      }
    }

    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
    }
  };

  const composerProps = {
    value,
    setValue,
    isLoading,
    placeholder,
    modeLabel,
    mode,
    setMode,
    canSend,
    handleSubmit,
    fileInputRef,
    textareaRef,
    model,
    onModelChange,
    attachments,
    onRemoveAttachment: (index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    },
  };

  return (
    <section
      className={cn(
        "relative mx-auto flex w-full flex-col px-4 md:px-6",
        isAppsMode ? "max-w-6xl" : "max-w-3xl",
        hasMessages
          ? "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
          : "flex-1 items-center justify-center pb-10 pt-8 md:pb-14 md:pt-12",
      )}
    >
      {!hasMessages ? (
        <div className="mb-10 w-full text-center md:mb-12">
          <div className="mb-6 flex justify-center md:mb-7">
            <OrwixLogo />
          </div>
          <h1 className="font-heading text-[2.75rem] leading-[1.05] tracking-tight md:text-6xl">
            <span className="orwix-hero-title">{heroTitle}</span>
          </h1>
          <p className="orwix-hero-subtitle mx-auto mt-4 max-w-md text-base md:text-lg">
            Fikirden ürüne —{" "}
            <span className="orwix-hero-subtitle-em">tek bir komutla</span>.
          </p>
        </div>
      ) : null}

      {isAppsMode ? (
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <ComposerBlock {...composerProps} />
          <OrwixAppStudio
            isLoading={isLoading}
            className="orwix-app-studio-panel mx-auto w-full max-w-[280px] lg:sticky lg:top-24"
          />
        </div>
      ) : (
        <ComposerBlock {...composerProps} />
      )}

      {isWebsiteMode && !hasMessages ? (
        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {ORWIX_TEMPLATES.slice(0, 6).map((item) => (
            <button
              key={item.primary}
              type="button"
              disabled={isLoading}
              onClick={() => applyPrompt(item.prompt)}
              className="orwix-chip relative rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <span className="relative z-[1]">
                {item.primary}
                {"secondary" in item && item.secondary
                  ? ` · ${item.secondary}`
                  : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {isImageMode && !hasMessages ? (
        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {ORWIX_IMAGE_TEMPLATES.map((item) => (
            <button
              key={item.primary}
              type="button"
              disabled={isLoading}
              onClick={() => applyPrompt(item.prompt)}
              className="orwix-chip relative rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <span className="relative z-[1]">{item.primary}</span>
            </button>
          ))}
        </div>
      ) : null}

      {isVideoMode && !hasMessages ? (
        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {ORWIX_VIDEO_TEMPLATES.map((item) => (
            <button
              key={item.primary}
              type="button"
              disabled={isLoading}
              onClick={() => applyPrompt(item.prompt)}
              className="orwix-chip relative rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <span className="relative z-[1]">{item.primary}</span>
            </button>
          ))}
        </div>
      ) : null}

      {attachError ? (
        <p className="mt-2 text-center text-sm text-destructive">{attachError}</p>
      ) : null}

      {mode === "general" && !hasMessages ? (
        <div className="relative mt-6 flex w-full flex-wrap justify-center gap-2.5 md:mt-7">
          {ORWIX_SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={isLoading}
              onClick={() => selectMode(item.mode)}
              className="orwix-chip relative flex h-11 items-center gap-2.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50"
            >
              <span className="orwix-chip-icon">
                <SuggestionIcon icon={item.icon} />
              </span>
              <span className="relative z-[1]">{item.label}</span>
            </button>
          ))}
          <div className="relative">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setMoreOpen((open) => !open)}
              className="orwix-chip relative flex h-11 items-center rounded-full px-5 text-sm font-semibold disabled:opacity-50"
            >
              <span className="relative z-[1]">Daha fazla</span>
            </button>
            {moreOpen ? (
              <div className="orwix-glass absolute left-0 top-full z-20 mt-2 min-w-[200px] rounded-xl p-2">
                {ORWIX_MORE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                    onClick={() => {
                      if (item.includes("Slayt")) selectMode("slides");
                      else if (item.includes("Tasarım")) selectMode("design");
                      else if (item.toLowerCase().includes("kod"))
                        selectMode("apps");
                      applyPrompt(
                        item.includes("Slayt")
                          ? "Yatırımcı sunumu için profesyonel slaytlar oluştur"
                          : item.includes("Tasarım")
                            ? "Modern bir startup için marka tasarım sistemi oluştur"
                            : item.toLowerCase().includes("kod")
                              ? "TypeScript ile temiz, production kalitesinde kod yaz"
                              : item,
                      );
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}

function SendButton({
  canSend,
  isLoading,
  onClick,
}: {
  canSend: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!canSend}
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-all",
        canSend ? "orwix-send-btn text-white" : "bg-muted text-muted-foreground",
      )}
      aria-label="Gönder"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ArrowUp className="size-4" />
      )}
    </button>
  );
}
