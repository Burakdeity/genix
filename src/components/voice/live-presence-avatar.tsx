"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { VoiceProfileId } from "@/types/voice.types";

export type LivePresenceState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

interface LivePresenceAvatarProps {
  state: LivePresenceState;
  muted?: boolean;
  profileId?: VoiceProfileId;
  /** 0–1 lip-sync amplitude from live audio playback */
  outputLevel?: number;
  className?: string;
}

const PORTRAITS: Record<VoiceProfileId, { src: string; alt: string }> = {
  juniper: { src: "/voice/ada-v2.png", alt: "Ada" },
  ember: { src: "/voice/kaan-v2.png", alt: "Kaan" },
  breeze: { src: "/voice/ela-v2.png", alt: "Ela" },
};

/**
 * Photoreal presence for live voice with jaw / mouth motion driven by audio.
 */
export function LivePresenceAvatar({
  state,
  muted = false,
  profileId = "juniper",
  outputLevel = 0,
  className,
}: LivePresenceAvatarProps) {
  const [t, setT] = useState(0);
  const [amp, setAmp] = useState(0);
  const startRef = useRef(performance.now());
  const smoothRef = useRef(0);
  const portrait = PORTRAITS[profileId] ?? PORTRAITS.juniper;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setT(0);
      setAmp(0);
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      const seconds = (now - startRef.current) / 1000;
      setT(seconds);

      const speakingNow = state === "speaking";
      // Mix real audio level with soft syllable chatter so lips feel alive.
      const chatter = speakingNow
        ? Math.pow(Math.abs(Math.sin(seconds * 13.2)), 1.6) * 0.55 +
          Math.pow(Math.abs(Math.sin(seconds * 21.7)), 2.2) * 0.28
        : 0;
      const target = muted
        ? 0
        : speakingNow
          ? Math.min(1, Math.max(outputLevel * 1.35, chatter, 0.12))
          : 0;
      smoothRef.current += (target - smoothRef.current) * 0.34;
      setAmp(smoothRef.current);

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [muted, outputLevel, state]);

  const speaking = state === "speaking";
  const listening = state === "listening";
  const connecting = state === "connecting";
  const errored = state === "error";

  const breath = 1 + Math.sin(t * (speaking ? 2.8 : 1.2)) * (speaking ? 0.01 : 0.006);
  const leanX =
    (muted ? -2.5 : 0) +
    Math.sin(t * 0.4) * (listening ? 1.2 : 0.55) +
    (speaking ? Math.sin(t * 0.85) * 0.7 : 0);
  const leanY =
    (listening ? -1.4 : 0) +
    Math.sin(t * 0.5) * 0.6 +
    (connecting ? Math.sin(t * 1.6) * 1 : 0);

  // Blink
  const blinkCycle = t % 4.4;
  const blink =
    blinkCycle > 4.15
      ? Math.sin(((blinkCycle - 4.15) / 0.25) * Math.PI)
      : 0;

  // Jaw drop + mouth cavity from amplitude
  const jawY = amp * 14;
  const mouthOpen = 3 + amp * 26;
  const mouthWidth = 22 + amp * 16;
  const mouthRound = 40 + amp * 35;

  return (
    <div
      className={cn(
        "orwix-live-presence orwix-live-presence-real",
        speaking && "orwix-live-presence-speaking",
        listening && "orwix-live-presence-listening",
        connecting && "orwix-live-presence-connecting",
        muted && "orwix-live-presence-muted",
        errored && "orwix-live-presence-error",
        className,
      )}
      aria-hidden
    >
      <div
        className="orwix-live-face"
        style={{
          transform: `translate(${leanX}px, ${leanY}px) scale(${breath})`,
        }}
      >
        {/* Base portrait */}
        <Image
          src={portrait.src}
          alt={portrait.alt}
          fill
          priority
          sizes="168px"
          className="orwix-live-face-img"
        />

        {/* Lower-face jaw plate — same photo, clipped, drops when speaking */}
        <div
          className="orwix-live-jaw"
          style={{
            transform: `translate3d(0, ${jawY}px, 0) scaleY(${1 + amp * 0.07})`,
          }}
        >
          <div
            className="orwix-live-jaw-inner"
            style={{ transform: `translate3d(0, ${-jawY}px, 0)` }}
          >
            <Image
              src={portrait.src}
              alt=""
              fill
              sizes="168px"
              className="orwix-live-face-img"
            />
          </div>
        </div>

        {/* Mouth cavity / lip opening */}
        <div
          className="orwix-live-mouth"
          style={{
            width: `${mouthWidth}%`,
            height: `${mouthOpen}px`,
            borderRadius: `${mouthRound}%`,
            opacity: amp > 0.05 ? 0.72 + amp * 0.28 : 0,
            transform: `translate(-50%, -50%) scaleX(${0.92 + amp * 0.18})`,
          }}
        />
        {/* Upper lip shadow for depth */}
        <div
          className="orwix-live-lip-top"
          style={{
            opacity: amp > 0.08 ? 0.35 + amp * 0.25 : 0,
            width: `${mouthWidth * 0.95}%`,
            transform: `translate(-50%, calc(-50% - ${mouthOpen * 0.42}px))`,
          }}
        />

        {/* Soft eyelid blink */}
        <div
          className="orwix-live-blink"
          style={{ opacity: blink * 0.92, transform: `scaleY(${0.2 + blink * 0.8})` }}
        />

        {/* Listening / speaking rim light */}
        <div className="orwix-live-face-rim" />

        {muted ? <div className="orwix-live-mute-badge" /> : null}
      </div>
    </div>
  );
}
