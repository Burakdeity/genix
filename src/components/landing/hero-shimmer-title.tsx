"use client";

import { useEffect, useRef, useState } from "react";

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
 * Hero title with a sliding color wash.
 * CSS background-clip + rAF so text can wrap on narrow screens.
 */
export function HeroShimmerTitle({ children, className }: HeroShimmerTitleProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const [colors, setColors] = useState<ShimmerColors>({
    from: "#0d9488",
    via: "#14b8a6",
    to: "#0e7490",
    shine: "#0a1211",
  });
  const [offset, setOffset] = useState(0);

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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setOffset(40);
      return;
    }

    const durationMs = 3200;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = ((now - start) % durationMs) / durationMs;
      setOffset(t * 100);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <h1
      ref={rootRef}
      className={cn(
        "orwix-hero-title mx-auto max-w-full text-balance",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.from} 0%, ${colors.via} 28%, ${colors.shine} 45%, ${colors.shine} 55%, ${colors.to} 72%, ${colors.from} 100%)`,
        backgroundSize: "220% 100%",
        backgroundPosition: `${offset}% 50%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </h1>
  );
}
