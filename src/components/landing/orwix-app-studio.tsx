"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Signal, Wifi } from "lucide-react";

import {
  ORWIX_APP_DEFAULT_SCREENS,
  ORWIX_APP_STUDIO,
  type OrwixAppScreen,
} from "@/content/orwix-app-screens";
import { cn } from "@/lib/utils";

interface OrwixAppStudioProps {
  isLoading?: boolean;
  className?: string;
}

function StatusBar() {
  return (
    <div className="orwix-phone-status flex items-center justify-between px-4 pt-2.5 text-[9px] font-medium text-foreground/70">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="size-2.5" />
        <Wifi className="size-2.5" />
        <span className="ml-0.5 h-2 w-3.5 rounded-[2px] border border-current opacity-70" />
      </div>
    </div>
  );
}

function BottomNav({ active = "home" }: { active?: string }) {
  const items = ["home", "search", "add", "chat", "profile"] as const;

  return (
    <div className="orwix-phone-nav flex items-center justify-around border-t border-white/10 px-2 py-2">
      {items.map((item) => (
        <div
          key={item}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all",
            item === active
              ? "scale-125 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              : "bg-white/25",
          )}
        />
      ))}
    </div>
  );
}

function ScreenWireframe({ screen }: { screen: OrwixAppScreen }) {
  if (screen.layout === "splash") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <div className="orwix-app-logo-pulse size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/30" />
        <div className="h-2 w-20 rounded-full bg-white/30" />
        <div className="h-1.5 w-12 rounded-full bg-white/15" />
      </div>
    );
  }

  if (screen.layout === "onboarding") {
    return (
      <div className="flex h-full flex-col px-4 pt-4">
        <div className="mb-4 h-28 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20" />
        <div className="mb-2 h-2.5 w-3/4 rounded-full bg-white/35" />
        <div className="mb-4 h-2 w-full rounded-full bg-white/15" />
        <div className="mb-1 h-2 w-full rounded-full bg-white/10" />
        <div className="h-2 w-5/6 rounded-full bg-white/10" />
        <div className="mt-auto mb-3 h-8 rounded-xl bg-emerald-500/40" />
      </div>
    );
  }

  if (screen.layout === "home") {
    return (
      <div className="flex h-full flex-col px-3 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-2 w-16 rounded-full bg-white/30" />
          <div className="size-5 rounded-full bg-white/20" />
        </div>
        <div className="mb-3 h-16 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/15" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded-full bg-white/12" />
          <div className="h-2 w-4/5 rounded-full bg-white/10" />
        </div>
        <div className="mt-auto">
          <BottomNav active="home" />
        </div>
      </div>
    );
  }

  if (screen.layout === "detail") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="size-4 rounded-md bg-white/15" />
          <div className="h-2 w-14 rounded-full bg-white/25" />
        </div>
        <div className="mx-3 mt-3 h-24 rounded-xl bg-gradient-to-br from-violet-500/25 to-emerald-500/20" />
        <div className="space-y-2 px-3 pt-3">
          <div className="h-2.5 w-2/3 rounded-full bg-white/30" />
          <div className="h-2 w-full rounded-full bg-white/12" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-5/6 rounded-full bg-white/10" />
        </div>
        <div className="mx-3 mt-4 h-8 rounded-xl bg-emerald-500/35" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-3 pt-4">
      <div className="mb-4 flex flex-col items-center">
        <div className="mb-2 size-12 rounded-full bg-gradient-to-br from-emerald-400/40 to-cyan-400/30 ring-2 ring-white/10" />
        <div className="h-2 w-16 rounded-full bg-white/30" />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-white/8 text-center" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-2 py-2"
          >
            <div className="size-4 rounded-md bg-white/15" />
            <div className="h-2 flex-1 rounded-full bg-white/12" />
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <BottomNav active="profile" />
      </div>
    </div>
  );
}

export function OrwixAppStudio({ isLoading = false, className }: OrwixAppStudioProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screens = ORWIX_APP_DEFAULT_SCREENS;
  const activeScreen = screens[activeIndex];

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % screens.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isLoading, screens.length]);

  return (
    <div className={cn("orwix-app-studio", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/90">
          {ORWIX_APP_STUDIO.label}
        </p>
        {isLoading ? (
          <span className="orwix-app-studio-live text-[11px] font-medium text-muted-foreground">
            Akış oluşturuluyor…
          </span>
        ) : null}
      </div>

      <div className="orwix-phone-mockup mx-auto">
        <div className="orwix-phone-frame">
          <div className="orwix-phone-notch" />
          <div className="orwix-phone-screen">
            <StatusBar />
            <div
              key={activeScreen.id}
              className="orwix-phone-screen-content flex-1"
            >
              <ScreenWireframe screen={activeScreen} />
            </div>
          </div>
        </div>
      </div>

      <div className="orwix-app-flow mt-5 overflow-x-auto">
        {screens.map((screen, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <div key={screen.id} className="orwix-app-flow-item flex items-center">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "orwix-app-flow-step shrink-0 transition-all",
                  isActive && "orwix-app-flow-step-active",
                  isDone && "orwix-app-flow-step-done",
                )}
              >
                <span className="text-[11px] font-semibold">{screen.title}</span>
              </button>
              {index < screens.length - 1 ? (
                <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-white/20" />
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        {ORWIX_APP_STUDIO.hint}
      </p>
    </div>
  );
}
