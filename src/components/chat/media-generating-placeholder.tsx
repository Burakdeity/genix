"use client";

import { cn } from "@/lib/utils";

interface MediaGeneratingPlaceholderProps {
  kind: "image" | "video";
  className?: string;
}

export function MediaGeneratingPlaceholder({
  kind,
  className,
}: MediaGeneratingPlaceholderProps) {
  const label =
    kind === "video" ? "Video oluşturuluyor" : "Görsel oluşturuluyor";

  return (
    <div
      className={cn("orwix-media-gen mt-1 w-full", className)}
      aria-live="polite"
      aria-label={label}
      role="status"
    >
      <div
        className={cn(
          "orwix-media-gen-frame relative overflow-hidden rounded-2xl border border-border/50",
          kind === "video" ? "aspect-video" : "aspect-[4/3] max-h-[22rem]",
        )}
      >
        <div className="orwix-media-gen-shimmer absolute inset-0" aria-hidden />
        <div className="orwix-media-gen-glow absolute inset-0" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="orwix-media-gen-orb" aria-hidden />
          <p className="text-[15px] font-medium tracking-[-0.015em] text-foreground/85">
            {label}
            <span className="orwix-thinking-dots" aria-hidden>
              …
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {kind === "video"
              ? "Bu 1–2 dakika sürebilir"
              : "Birkaç saniye sürebilir"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function detectMediaGeneratingKind(
  content: string,
): "image" | "video" | null {
  const text = content.trim().toLowerCase();
  if (!text) return null;
  if (/video\s+üretiliyor|video\s+oluşturuluyor/.test(text)) return "video";
  if (/görsel\s+üretiliyor|görsel\s+oluşturuluyor/.test(text)) return "image";
  return null;
}
