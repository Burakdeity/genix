"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

interface OrwixIconProps {
  className?: string;
  size?: number;
  /** Kept for API compatibility; professional mark stays static by default */
  animated?: boolean;
}

/**
 * Orwix monogram: continuous O ring + precise X (O + X → Orwix).
 * Theme-aware via --orwix-icon-* CSS variables.
 */
export function OrwixIcon({
  className,
  size = 48,
}: OrwixIconProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("orwix-icon shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={`${uid}-brand`}
          x1="8"
          y1="6"
          x2="56"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--orwix-icon-from)" />
          <stop offset="0.5" stopColor="var(--orwix-icon-via)" />
          <stop offset="1" stopColor="var(--orwix-icon-to)" />
        </linearGradient>
      </defs>

      {/* Soft brand core */}
      <circle
        cx="32"
        cy="32"
        r="11"
        fill={`url(#${uid}-brand)`}
        opacity="0.12"
      />

      {/* Outer O — continuous premium ring */}
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke={`url(#${uid}-brand)`}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Inner track */}
      <circle
        cx="32"
        cy="32"
        r="15.5"
        stroke={`url(#${uid}-brand)`}
        strokeWidth="1.5"
        opacity="0.35"
      />

      {/* X monogram */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M23.5 23.5 L40.5 40.5"
          stroke={`url(#${uid}-brand)`}
          strokeWidth="5"
        />
        <path
          d="M40.5 23.5 L23.5 40.5"
          stroke={`url(#${uid}-brand)`}
          strokeWidth="5"
        />
      </g>
    </svg>
  );
}
