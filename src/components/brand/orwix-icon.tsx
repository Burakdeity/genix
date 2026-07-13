"use client";

import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

interface OrwixIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

/**
 * Orwix monogram: O ring with an X inside (O + X → Orwix).
 * Colors follow theme CSS variables (--orwix-icon-*).
 */
export function OrwixIcon({
  className,
  size = 48,
  animated = true,
}: OrwixIconProps) {
  const uid = useId().replace(/:/g, "");
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!animated) {
      setTime(0);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      setTime((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated]);

  const ringRotate = animated ? (time / 14) * 360 : 0;
  const trackRotate = animated ? -(time / 10) * 360 : 0;
  const xRotate = animated ? -(time / 18) * 360 : 0;
  const xPulse = animated ? 1 + Math.sin(time * 2.2) * 0.04 : 1;
  const ringPulse = animated ? 1 + Math.sin(time * 1.6) * 0.015 : 1;

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
          x1="10"
          y1="8"
          x2="54"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--orwix-icon-from)" />
          <stop offset="0.5" stopColor="var(--orwix-icon-via)" />
          <stop offset="1" stopColor="var(--orwix-icon-to)" />
        </linearGradient>
      </defs>

      {/* Soft core */}
      <circle
        cx="32"
        cy="32"
        r={12 * ringPulse}
        fill="var(--orwix-icon-via)"
        style={{ opacity: "var(--orwix-icon-core-opacity)" }}
      />

      {/* O — dashed ring, slow spin */}
      <g transform={`rotate(${ringRotate} 32 32)`}>
        <circle
          cx="32"
          cy="32"
          r={22 * ringPulse}
          stroke="var(--orwix-icon-ink)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="108 18"
        />
        <circle
          cx="32"
          cy="32"
          r={22 * ringPulse}
          stroke={`url(#${uid}-brand)`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="108 18"
        />
      </g>

      {/* Inner track — opposite spin */}
      <g transform={`rotate(${trackRotate} 32 32)`}>
        <circle
          cx="32"
          cy="32"
          r="16.5"
          stroke={`url(#${uid}-brand)`}
          strokeWidth="1.6"
          style={{ opacity: "var(--orwix-icon-track-opacity)" }}
          strokeLinecap="round"
          strokeDasharray="36 40"
        />
      </g>

      {/* X monogram — slightly smaller, gentle rotate + pulse */}
      <g
        transform={`translate(32 32) rotate(${xRotate}) scale(${xPulse * 0.78}) translate(-32 -32)`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 24 L40 40" stroke="var(--orwix-icon-ink)" strokeWidth="6" />
        <path d="M40 24 L24 40" stroke="var(--orwix-icon-ink)" strokeWidth="6" />
        <path d="M24 24 L40 40" stroke={`url(#${uid}-brand)`} strokeWidth="5" />
        <path d="M40 24 L24 40" stroke={`url(#${uid}-brand)`} strokeWidth="5" />
      </g>
    </svg>
  );
}
