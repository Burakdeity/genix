"use client";

import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

interface OrwixIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

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

  const outerRotate = (time / 16) * 360;
  const innerRotate = -(time / 11) * 360;
  const dotsRotate = (time / 20) * 360;
  const starRotate = Math.sin(time * 1.6) * 10;
  const coreRadius = 14 + Math.sin(time * 1.9) * 1.1;
  const dotRadii = [
    2.4 + Math.sin(time * 2.4) * 0.55,
    2 + Math.sin(time * 2.4 + 1.2) * 0.5,
    1.7 + Math.sin(time * 2.4 + 2.1) * 0.45,
  ];

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
          x1="12"
          y1="10"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a78bfa" />
          <stop offset="0.45" stopColor="#e879f9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient
          id={`${uid}-core`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(32 32) rotate(90) scale(14)"
        >
          <stop stopColor="#e9d5ff" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#a78bfa" stopOpacity="0.2" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter
          id={`${uid}-glow`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={animated ? `rotate(${outerRotate} 32 32)` : undefined}>
        <circle
          cx="32"
          cy="32"
          r="21"
          stroke={`url(#${uid}-brand)`}
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeDasharray="102 30"
          transform="rotate(-28 32 32)"
        />
      </g>

      <g transform={animated ? `rotate(${innerRotate} 32 32)` : undefined}>
        <circle
          cx="32"
          cy="32"
          r="15.5"
          stroke={`url(#${uid}-brand)`}
          strokeWidth="1.5"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeDasharray="62 36"
          transform="rotate(132 32 32)"
        />
      </g>

      <circle
        cx="32"
        cy="32"
        r={animated ? coreRadius : 14}
        fill={`url(#${uid}-core)`}
      />

      <g transform={animated ? `rotate(${starRotate} 32 32)` : undefined}>
        <path
          d="M32 24.5 34.1 30.2 40 31.6 34.9 35.6 36.2 41.5 32 38.2 27.8 41.5 29.1 35.6 24 31.6 29.9 30.2 32 24.5Z"
          fill={`url(#${uid}-brand)`}
          filter={`url(#${uid}-glow)`}
        />
      </g>

      <g transform={animated ? `rotate(${dotsRotate} 32 32)` : undefined}>
        <circle cx="50.5" cy="24" r={animated ? dotRadii[0] : 2.4} fill="#e879f9" />
        <circle cx="18" cy="36.5" r={animated ? dotRadii[1] : 2} fill="#22d3ee" />
        <circle cx="44.5" cy="48.5" r={animated ? dotRadii[2] : 1.7} fill="#c4b5fd" />
      </g>
    </svg>
  );
}
