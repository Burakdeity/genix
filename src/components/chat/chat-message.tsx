"use client";

import { ExternalLink } from "lucide-react";

import { OrwixIcon } from "@/components/brand/orwix-icon";
import {
  detectMediaGeneratingKind,
  MediaGeneratingPlaceholder,
} from "@/components/chat/media-generating-placeholder";
import { MessageMarkdown } from "@/components/chat/message-markdown";
import { WebsitePreview } from "@/components/chat/website-preview";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import {
  extractHtmlFromContent,
  getDisplayTextWithoutHtml,
} from "@/lib/chat/extract-html";
import { resolveMessageImageDataUrl } from "@/lib/chat/session-image-cache";
import type { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatMessageItemProps {
  message: ChatMessage;
  isTyping?: boolean;
}

function sourceLabel(title: string, uri: string): string {
  const cleaned = title
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .trim();
  if (cleaned && cleaned.length < 48 && !cleaned.includes("vertexaisearch")) {
    return cleaned;
  }
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return cleaned.slice(0, 40) || "Kaynak";
  }
}

function stripLegacySources(content: string): string {
  return content
    .replace(/\n*\s*Kaynaklar:\s*(?:\n-\s*.+)*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseLegacySources(
  content: string,
): Array<{ title: string; uri: string }> {
  const match = content.match(/Kaynaklar:\s*([\s\S]*)$/i);
  if (!match) return [];

  const lines = match[1].split("\n");
  const sources: Array<{ title: string; uri: string }> = [];

  for (const line of lines) {
    const item = line.match(/^-\s*(.+?):\s*(https?:\/\/\S+)/i);
    if (!item) continue;
    sources.push({ title: item[1].trim(), uri: item[2].trim() });
  }

  return sources;
}

export function ChatMessageItem({
  message,
  isTyping = false,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const mediaGeneratingKind =
    !isUser && isTyping
      ? detectMediaGeneratingKind(message.content)
      : null;
  const isThinking =
    !isUser &&
    isTyping &&
    message.content.trim().length === 0 &&
    !mediaGeneratingKind;
  const previewHtml =
    !isUser && !isTyping ? extractHtmlFromContent(message.content) : null;

  const legacySources =
    !isUser && !message.sources?.length
      ? parseLegacySources(message.content)
      : [];
  const sources = message.sources?.length ? message.sources : legacySources;

  let displayText = message.content;
  if (!isUser) {
    displayText = stripLegacySources(displayText);
    if (previewHtml && !isTyping) {
      displayText = getDisplayTextWithoutHtml(displayText);
    }
  }

  return (
    <article
      className={cn(
        "orwix-message-enter mx-auto w-full max-w-3xl",
        isUser ? "flex justify-end" : "flex justify-start",
      )}
    >
      <div
        className={cn(
          "min-w-0",
          isUser ? "max-w-[88%] md:max-w-[80%]" : "w-full",
          isUser ? "" : "flex items-start gap-3.5 sm:gap-4",
        )}
      >
        {!isUser ? (
          <div className="mt-1.5 hidden size-9 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-white/90 shadow-sm sm:flex">
            <OrwixIcon
              size={22}
              animated={isThinking || Boolean(mediaGeneratingKind)}
              className="size-5"
            />
          </div>
        ) : null}

        <div
          className={cn(
            "min-w-0 rounded-2xl px-5 py-4 text-sm leading-relaxed md:text-[15px]",
            isUser
              ? "orwix-user-bubble text-foreground"
              : "w-full border border-border/50 bg-card/95 text-foreground shadow-[0_12px_32px_rgba(12,25,24,0.05)]",
          )}
        >
          {!isUser ? (
            <div className="mb-3 flex items-center gap-2.5 sm:hidden">
              <div className="flex size-8 items-center justify-center rounded-xl border border-border/50 bg-white/90">
                <OrwixIcon
                  size={18}
                  animated={isThinking || Boolean(mediaGeneratingKind)}
                  className="size-4"
                />
              </div>
              <span className="text-xs font-semibold tracking-[-0.01em] text-foreground/70">
                Orwix
              </span>
            </div>
          ) : null}

          {mediaGeneratingKind ? (
            <MediaGeneratingPlaceholder kind={mediaGeneratingKind} />
          ) : isThinking ? (
            <div
              className="orwix-thinking flex items-center gap-3"
              aria-live="polite"
              aria-label="Düşünüyor"
            >
              <TypingIndicator />
              <span className="orwix-thinking-label text-[15px] font-medium tracking-[-0.01em] text-muted-foreground">
                Düşünüyor
                <span className="orwix-thinking-dots" aria-hidden>
                  …
                </span>
              </span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-[15px] leading-7 tracking-[-0.015em] text-foreground/90">
              {isUser ? (
                displayText
              ) : (
                <MessageMarkdown text={displayText} />
              )}
              {isTyping ? (
                <span
                  className="orwix-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.12em] rounded-full bg-primary/80 align-baseline"
                  aria-hidden
                />
              ) : null}
            </div>
          )}

          {message.images && message.images.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {message.images.map((image, index) => {
                const dataUrl = resolveMessageImageDataUrl(
                  message.id,
                  image.dataUrl,
                );

                return dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${message.id}-image-${index}`}
                    src={dataUrl}
                    alt={isUser ? "Yüklenen görsel" : "Üretilen görsel"}
                    className={cn(
                      "rounded-xl border border-border/60 object-contain bg-muted/30",
                      isUser ? "max-h-40" : "max-h-[28rem] w-full",
                    )}
                  />
                ) : (
                  <p
                    key={`${message.id}-image-${index}`}
                    className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                  >
                    Görsel geçmişte kaydedildi (önizleme bu cihazda tutulmadı).
                  </p>
                );
              })}
            </div>
          ) : null}

          {message.videos && message.videos.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {message.videos.map((video, index) =>
                video.dataUrl ? (
                  <video
                    key={`${message.id}-video-${index}`}
                    src={video.dataUrl}
                    controls
                    playsInline
                    className="max-h-[28rem] w-full rounded-xl border border-border/60 bg-black object-contain"
                  />
                ) : (
                  <p
                    key={`${message.id}-video-${index}`}
                    className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                  >
                    Video üretildi (dosya boyutu nedeniyle geçmişte yalnızca metin
                    tutulur).
                  </p>
                ),
              )}
            </div>
          ) : null}

          {previewHtml ? (
            <>
              <WebsitePreview html={previewHtml} className="mt-4" />
              <details className="mt-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
                <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
                  HTML kodunu göster
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-muted-foreground">
                  {previewHtml}
                </pre>
              </details>
            </>
          ) : null}

          {sources.length > 0 && !isTyping ? (
            <div className="mt-4 border-t border-border/40 pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Kaynaklar
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <a
                    key={`${source.uri}-${source.title}`}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <ExternalLink className="size-3 shrink-0 opacity-60" />
                    <span className="truncate">
                      {sourceLabel(source.title, source.uri)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
