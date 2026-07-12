"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface ChatScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function ChatScrollArea({ children, className }: ChatScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startTop: number } | null>(null);

  const [thumb, setThumb] = useState({
    top: 0,
    height: 64,
    visible: false,
  });
  const [active, setActive] = useState(false);

  const syncThumb = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const overflow = scrollHeight - clientHeight > 4;

    if (!overflow || clientHeight < 40) {
      setThumb((prev) =>
        prev.visible ? { ...prev, visible: false } : prev,
      );
      return;
    }

    const trackHeight = track.clientHeight || clientHeight;
    const ratio = clientHeight / scrollHeight;
    const height = Math.max(56, Math.min(trackHeight * 0.7, Math.round(trackHeight * ratio)));
    const maxTop = Math.max(0, trackHeight - height);
    const progress =
      scrollHeight === clientHeight
        ? 0
        : scrollTop / (scrollHeight - clientHeight);
    const top = Math.round(progress * maxTop);

    setThumb({ top, height, visible: true });
  }, []);

  useLayoutEffect(() => {
    syncThumb();
    const id = window.requestAnimationFrame(syncThumb);
    return () => window.cancelAnimationFrame(id);
  }, [children, syncThumb]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let idleTimer: number | undefined;

    const onScroll = () => {
      syncThumb();
      setActive(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setActive(false), 1200);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncThumb);

    const resizeObserver = new ResizeObserver(() => {
      syncThumb();
    });
    resizeObserver.observe(viewport);
    Array.from(viewport.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncThumb);
      resizeObserver.disconnect();
      window.clearTimeout(idleTimer);
    };
  }, [syncThumb]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!drag || !viewport || !track) return;

      const trackHeight = track.clientHeight;
      const maxTop = Math.max(0, trackHeight - thumb.height);
      const nextTop = Math.min(
        maxTop,
        Math.max(0, drag.startTop + (event.clientY - drag.startY)),
      );
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTop = maxTop === 0 ? 0 : (nextTop / maxTop) * maxScroll;
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [thumb.height]);

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      startY: event.clientY,
      startTop: thumb.top,
    };
    setActive(true);
  };

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    if (
      event.target !== track &&
      !(event.target as HTMLElement).classList.contains("orwix-chat-scroll-track")
    ) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const maxTop = Math.max(0, track.clientHeight - thumb.height);
    const nextTop = Math.min(maxTop, Math.max(0, clickY - thumb.height / 2));
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTop = maxTop === 0 ? 0 : (nextTop / maxTop) * maxScroll;
    setActive(true);
  };

  return (
    <div
      className={cn(
        "relative min-h-0 flex-1 overflow-hidden",
        className,
      )}
    >
      {/* Absolute viewport forces a real height so overflow (and thumb) can exist */}
      <div
        ref={viewportRef}
        className="orwix-scroll-hide absolute inset-0 overflow-y-auto overscroll-contain pr-4"
      >
        {children}
      </div>

      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        className={cn(
          "orwix-chat-scroll-track absolute inset-y-4 right-1.5 z-30 w-3 rounded-full",
          thumb.visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!thumb.visible}
      >
        {thumb.visible ? (
          <div
            role="scrollbar"
            aria-orientation="vertical"
            aria-valuenow={Math.round(
              (thumb.top /
                Math.max(1, (trackRef.current?.clientHeight ?? 1) - thumb.height)) *
                100,
            )}
            tabIndex={0}
            onPointerDown={onThumbPointerDown}
            className={cn(
              "orwix-chat-scroll-thumb absolute left-0.5 right-0.5 cursor-grab active:cursor-grabbing",
              active && "orwix-chat-scroll-thumb-active",
            )}
            style={{
              top: thumb.top,
              height: thumb.height,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
