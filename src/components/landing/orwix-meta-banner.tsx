import { Sparkles } from "lucide-react";

import { ORWIX_BANNER } from "@/content/orwix-content";

export function OrwixMetaBanner() {
  return (
    <div className="relative z-10 flex justify-center px-3 pt-3 sm:px-4">
      <div className="orwix-badge inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-center text-[11px] font-semibold leading-snug sm:px-5 sm:text-xs md:text-sm">
        <Sparkles className="size-3.5 shrink-0 animate-pulse" />
        <span className="min-w-0 text-balance">{ORWIX_BANNER}</span>
      </div>
    </div>
  );
}
