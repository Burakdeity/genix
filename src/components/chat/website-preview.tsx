"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

interface WebsitePreviewProps {
  html: string;
  className?: string;
}

type PreviewWidth = "desktop" | "mobile";

export function WebsitePreview({ html, className }: WebsitePreviewProps) {
  const [width, setWidth] = useState<PreviewWidth>("desktop");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!html.trim()) {
      setPreviewUrl(null);
      return;
    }

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html]);

  const openInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-[#f8faf9] shadow-[0_12px_40px_rgba(12,25,24,0.06)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-white/80 px-3.5 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#ff5f57]" />
            <span className="size-2 rounded-full bg-[#febc2e]" />
            <span className="size-2 rounded-full bg-[#28c840]" />
          </div>
          <p className="truncate text-xs font-medium tracking-[-0.01em] text-foreground/80">
            Canlı önizleme
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={width === "desktop"}
            onClick={() => setWidth("desktop")}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg transition-colors",
              width === "desktop"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Masaüstü önizleme"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            aria-pressed={width === "mobile"}
            onClick={() => setWidth("mobile")}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg transition-colors",
              width === "mobile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Mobil önizleme"
          >
            <Smartphone className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={openInNewTab}
            disabled={!previewUrl}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ExternalLink className="size-3.5" />
            Aç
          </button>
        </div>
      </div>

      <div className="flex justify-center p-3 md:p-4">
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm transition-all",
            width === "mobile" ? "w-[320px] max-w-full" : "w-full",
          )}
        >
          {previewUrl ? (
            <iframe
              key={previewUrl}
              title="Web sitesi canlı önizleme"
              src={previewUrl}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              referrerPolicy="no-referrer"
              className={cn(
                "block w-full border-0 bg-white",
                width === "mobile" ? "h-[560px]" : "h-[460px] md:h-[580px]",
              )}
            />
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              Önizleme hazırlanıyor…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
