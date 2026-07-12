"use client";

import { useId } from "react";

import { OrwixIcon } from "@/components/brand/orwix-icon";
import { cn } from "@/lib/utils";

interface OrwixWordmarkProps {
  className?: string;
  hero?: boolean;
}

/**
 * Orwix wordmark: branded O ring + clean "rwix" typography.
 */
export function OrwixWordmark({ className, hero = false }: OrwixWordmarkProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 126 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "orwix-wordmark-svg orwix-wordmark inline-block h-[1em] w-auto overflow-visible",
        hero && "orwix-wordmark-hero",
        className,
      )}
      role="img"
      aria-label="Orwix"
    >
      <defs>
        <linearGradient
          id={`${uid}-wm`}
          x1="0"
          y1="6"
          x2="126"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--orwix-icon-from)" />
          <stop offset="0.5" stopColor="var(--orwix-icon-via)" />
          <stop offset="1" stopColor="var(--orwix-icon-to)" />
        </linearGradient>
      </defs>

      {/* Branded O — soft double ring */}
      <circle
        cx="16.5"
        cy="18"
        r="12.25"
        stroke={`url(#${uid}-wm)`}
        strokeWidth="3.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle
        cx="16.5"
        cy="18"
        r="7.1"
        stroke={`url(#${uid}-wm)`}
        strokeWidth="1.35"
        fill="none"
        opacity="0.35"
      />

      {/* rwix — Space Grotesk */}
      <text
        x="30"
        y="25.5"
        fill={`url(#${uid}-wm)`}
        style={{
          fontFamily:
            "var(--font-space), var(--font-jakarta), system-ui, sans-serif",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        rwix
      </text>
    </svg>
  );
}

export function OrwixBrandHero({ className }: { className?: string }) {
  return (
    <OrwixWordmark
      hero
      className={cn("h-auto w-[min(100%,16rem)]", className)}
    />
  );
}

export function OrwixLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "orwix-hero-logo inline-flex items-center justify-center",
        className,
      )}
      aria-label="Orwix"
    >
      <OrwixIcon size={72} className="size-16 md:size-[4.5rem]" />
    </div>
  );
}
