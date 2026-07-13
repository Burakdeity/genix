"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface HeroShimmerTitleProps {
  children: string;
  className?: string;
}

type ShimmerColors = {
  from: string;
  via: string;
  to: string;
  shine: string;
};

function resolveCssVar(el: Element, varName: string, fallback: string) {
  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
  probe.style.color = `var(${varName})`;
  el.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  if (!color || color === "rgba(0, 0, 0, 0)" || color === "transparent") {
    return fallback;
  }
  return color;
}

function readShimmerColors(el: Element): ShimmerColors {
  return {
    from: resolveCssVar(el, "--orwix-shimmer-from", "#0d9488"),
    via: resolveCssVar(el, "--orwix-shimmer-via", "#14b8a6"),
    to: resolveCssVar(el, "--orwix-shimmer-to", "#0e7490"),
    shine: resolveCssVar(el, "--orwix-shimmer-shine", "#0a1211"),
  };
}

/**
 * Hero title with a sliding color wash via SVG + rAF.
 * Colors follow the active theme / palette tokens.
 */
export function HeroShimmerTitle({ children, className }: HeroShimmerTitleProps) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `orwix-hero-shim-${rawId}`;
  const rootRef = useRef<HTMLHeadingElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);
  const [size, setSize] = useState({ width: 320, height: 64 });
  const [colors, setColors] = useState<ShimmerColors>({
    from: "var(--orwix-shimmer-from)",
    via: "var(--orwix-shimmer-via)",
    to: "var(--orwix-shimmer-to)",
    shine: "var(--orwix-shimmer-shine)",
  });

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const sync = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
        });
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  useEffect(() => {
    const root = rootRef.current ?? document.documentElement;

    const syncColors = () => {
      setColors(readShimmerColors(root));
    };

    syncColors();

    const mo = new MutationObserver(syncColors);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-orwix-bg", "style"],
    });

    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const grad = gradientRef.current;
    if (!grad || size.width <= 0) return;

    const durationMs = 3200;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = ((now - start) % durationMs) / durationMs;
      const x = -size.width * 0.85 + t * size.width * 1.7;
      grad.setAttribute("gradientTransform", `translate(${x} 0)`);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [size.width]);

  return (
    <h1
      ref={rootRef}
      className={cn("orwix-hero-title relative inline-block", className)}
      aria-label={children}
    >
      <span
        ref={measureRef}
        className="invisible block whitespace-nowrap"
        aria-hidden
      >
        {children}
      </span>

      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-hidden
      >
        <defs>
          <linearGradient
            ref={gradientRef}
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={size.width}
            y2={0}
          >
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="28%" stopColor={colors.via} />
            <stop offset="45%" stopColor={colors.shine} />
            <stop offset="50%" stopColor={colors.shine} />
            <stop offset="55%" stopColor={colors.shine} />
            <stop offset="72%" stopColor={colors.to} />
            <stop offset="100%" stopColor={colors.from} />
          </linearGradient>
        </defs>
        <text
          x={size.width / 2}
          y={size.height / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fill={`url(#${gradientId})`}
          style={{
            fontFamily:
              "var(--font-space), var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1em",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {children}
        </text>
      </svg>
    </h1>
  );
}
