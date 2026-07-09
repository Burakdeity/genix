"use client";

import { useEffect, useRef } from "react";

export function OrwixBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 40;
      const y = (event.clientY / window.innerHeight - 0.5) * 40;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} className="orwix-bg" aria-hidden>
      <div className="orwix-bg-noise" />
      <div className="orwix-bg-grid" />
      <div className="orwix-bg-orb orwix-bg-orb-1" />
      <div className="orwix-bg-orb orwix-bg-orb-2" />
      <div className="orwix-bg-orb orwix-bg-orb-3" />
      <div className="orwix-bg-orb orwix-bg-orb-4" />
      <div className="orwix-bg-spotlight" />
      <div className="orwix-bg-beam" />
    </div>
  );
}
