import { Sparkles } from "lucide-react";

import { ORWIX_BANNER } from "@/content/orwix-content";

export function OrwixMetaBanner() {
  return (
    <div className="relative z-10 flex justify-center px-3 pt-4 sm:px-4">
      <div className="orwix-badge inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-center text-[11px] font-medium leading-snug tracking-[-0.01em] sm:px-5 sm:text-xs">
        <Sparkles className="size-3.5 shrink-0 opacity-80" />
        <span className="min-w-0 text-balance">{ORWIX_BANNER}</span>
      </div>
    </div>
  );
}
