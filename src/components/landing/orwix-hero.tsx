"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowUp,
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
  Wand2,
  X,
} from "lucide-react";

import { OrwixLogo } from "@/components/brand/orwix-logo";
import { QualityModeToggle } from "@/components/chat/quality-mode-toggle";
import { HeroShimmerTitle } from "@/components/landing/hero-shimmer-title";
import {
  ORWIX_HERO,
  ORWIX_IMAGE_TEMPLATES,
  ORWIX_MORE_SUGGESTIONS,
  ORWIX_SUGGESTIONS,
  ORWIX_TEMPLATES,
  ORWIX_APP_TEMPLATES,
  ORWIX_VIDEO_TEMPLATES,
  type OrwixMode,
} from "@/content/orwix-content";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import {
  ORWIX_STUDIO_TOOLS,
  type StudioTool,
  type StudioToolId,
} from "@/lib/chat/studio-tools";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";
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

interface PromptRequest {
  id: number;
  text: string;
  mode?: OrwixMode;
  autoSend?: boolean;
  brandBirth?: boolean;
}

interface OrwixHeroProps {
  onSend: (
    message: string,
    attachments?: ChatAttachment[],
    options?: SendMessageOptions,
  ) => Promise<void>;
  isLoading: boolean;
  hasMessages: boolean;
  promptRequest?: PromptRequest | null;
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
  if (icon === "website") return <Globe className={className} />;
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
  breathe = false,
  compact = false,
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
  breathe?: boolean;
  compact?: boolean;
}) {
  const openVoiceMode = useVoiceStore((state) => state.openLive);

  return (
    <div
      className={cn(
        "orwix-composer-wrap w-full",
        breathe && "orwix-composer-breathe",
      )}
    >
      <div className="orwix-composer w-full overflow-hidden">
        <div
          className={cn(
            "flex flex-col",
            compact ? "min-h-0 px-3 py-2.5 sm:px-4" : "min-h-[148px] px-5 py-5",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isLoading}
            rows={compact ? 1 : 3}
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            className={cn(
              "w-full flex-1 resize-none bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none md:text-[17px]",
              compact
                ? "max-h-28 min-h-[28px] py-1"
                : "min-h-[72px]",
            )}
          />
          <AttachmentPreview
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2",
              compact ? "mt-1.5" : "mt-3",
            )}
          >
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
              <div className={cn(compact && "hidden sm:block")}>
                <QualityModeToggle
                  model={model}
                  onChange={onModelChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void openVoiceMode()}
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
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTool, setStudioTool] = useState<StudioToolId | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onSendRef = useRef(onSend);
  const handledPromptIdRef = useRef<number | null>(null);

  onSendRef.current = onSend;

  useEffect(() => {
    if (!promptRequest) return;
    if (handledPromptIdRef.current === promptRequest.id) return;
    handledPromptIdRef.current = promptRequest.id;

    const nextMode = promptRequest.mode ?? "general";
    setMode(nextMode);
    setMoreOpen(false);
    setStudioOpen(false);
    setStudioTool(null);

    if (promptRequest.autoSend) {
      setValue("");
      void onSendRef.current(promptRequest.text, [], {
        mode: nextMode,
        brandBirth: promptRequest.brandBirth,
      });
      return;
    }

    setValue(promptRequest.text);
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
  const isPro = useImageQuotaStore((state) =>
    hydrated ? state.isPro(activeAccountId) : false,
  );
  const openProModal = useImageQuotaStore((state) => state.openProModal);
  const openLoginModal = useImageQuotaStore((state) => state.openLoginModal);
  const openLive = useVoiceStore((state) => state.openLive);
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
    const activeTool = studioTool ?? undefined;
    setValue("");
    setAttachments([]);
    setAttachError(null);
    setStudioTool(null);
    await onSend(trimmed, pending, { mode, studioTool: activeTool });
  };

  const selectMode = (nextMode: OrwixMode) => {
    setMode(nextMode);
    setMoreOpen(false);
    setStudioOpen(false);
    setStudioTool(null);
  };

  const applyPrompt = (prompt: string) => {
    setValue(prompt);
    setMoreOpen(false);
    setStudioOpen(false);
  };

  const selectStudioTool = (tool: StudioTool) => {
    setStudioOpen(false);
    setMoreOpen(false);

    if (tool.proOnly) {
      if (!activeAccountId) {
        openLoginModal();
        return;
      }
      if (!isPro) {
        openProModal();
        return;
      }
    }

    if (tool.opensVoice) {
      void openLive({ brandBriefing: true });
      return;
    }

    setMode(tool.mode);
    setStudioTool(tool.id);
    setValue(tool.starter);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      if (
        tool.id === "image-to-prompt" ||
        tool.id === "ocr-rewrite"
      ) {
        fileInputRef.current?.click();
      }
    });
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
        "relative mx-auto flex w-full max-w-3xl flex-col px-4 md:px-6",
        hasMessages
          ? "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
          : "flex-1 items-center justify-center pb-10 pt-8 md:pb-14 md:pt-12",
      )}
    >
          {!hasMessages ? (
        <div className="orwix-hero-intro mb-8 w-full text-center md:mb-10">
          <div className="orwix-hero-rise orwix-hero-rise-1 mb-6 flex justify-center md:mb-7">
            <OrwixLogo />
          </div>
          <HeroShimmerTitle className="font-heading text-[clamp(1.55rem,7.2vw,2.75rem)] leading-[1.12] tracking-tight md:text-6xl">
            {heroTitle}
          </HeroShimmerTitle>
          <p className="orwix-hero-rise orwix-hero-rise-3 orwix-hero-subtitle mx-auto mt-4 max-w-md text-base md:text-lg">
            Fikirden ürüne —{" "}
            <span className="orwix-hero-subtitle-em">tek bir komutla</span>.
          </p>
        </div>
      ) : null}

      <div className="orwix-hero-rise orwix-hero-rise-4 w-full">
        <ComposerBlock
          {...composerProps}
          breathe={!hasMessages}
          compact={hasMessages}
        />
      </div>

      {isWebsiteMode && !hasMessages ? (
        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {ORWIX_TEMPLATES.map((item) => (
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

      {isAppsMode && !hasMessages ? (
        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {ORWIX_APP_TEMPLATES.map((item) => (
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
        <div className="orwix-hero-rise orwix-hero-rise-5 relative mt-6 flex w-full flex-wrap justify-center gap-2.5 md:mt-7">
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
              onClick={() => {
                setStudioOpen(false);
                setMoreOpen((open) => !open);
              }}
              className="orwix-chip relative flex h-11 items-center rounded-full px-5 text-sm font-semibold disabled:opacity-50"
            >
              <span className="relative z-[1]">Daha fazla</span>
            </button>
            {moreOpen ? (
              <div className="orwix-glass absolute left-1/2 top-full z-20 mt-2 min-w-[200px] -translate-x-1/2 rounded-xl p-2 sm:left-0 sm:translate-x-0">
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
          <StudioToolsMenu
            open={studioOpen}
            disabled={isLoading}
            onToggle={() => {
              setMoreOpen(false);
              setStudioOpen((open) => !open);
            }}
            onSelect={selectStudioTool}
          />
        </div>
      ) : null}

      {mode !== "general" && !hasMessages ? (
        <div className="relative mt-4 flex w-full justify-center">
          <StudioToolsMenu
            open={studioOpen}
            disabled={isLoading}
            onToggle={() => {
              setMoreOpen(false);
              setStudioOpen((open) => !open);
            }}
            onSelect={selectStudioTool}
          />
        </div>
      ) : null}

      {studioTool && !hasMessages ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setStudioTool(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            <Sparkles className="size-3" />
            {ORWIX_STUDIO_TOOLS.find((t) => t.id === studioTool)?.label ??
              "Stüdyo"}
            <X className="size-3 opacity-70" />
          </button>
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

function StudioToolsMenu({
  open,
  disabled,
  onToggle,
  onSelect,
}: {
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSelect: (tool: StudioTool) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="orwix-chip relative flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50"
      >
        <span className="orwix-chip-icon">
          <Wand2 className="size-4" />
        </span>
        <span className="relative z-[1]">Stüdyo</span>
      </button>
      {open ? (
        <div className="orwix-glass absolute left-1/2 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl p-2 sm:left-0 sm:translate-x-0">
          <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Stüdyo araçları
          </p>
          {ORWIX_STUDIO_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
              onClick={() => onSelect(tool)}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {tool.label}
                  {tool.proOnly ? (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Pro
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {tool.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
