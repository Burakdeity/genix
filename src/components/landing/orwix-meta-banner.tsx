import { Sparkles } from "lucide-react";



import { ORWIX_BANNER } from "@/content/orwix-content";



export function OrwixMetaBanner() {

  return (

    <div className="relative z-10 flex justify-center px-4 pt-3">

      <div className="orwix-badge inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold md:text-sm">

        <Sparkles className="size-3.5 animate-pulse text-primary" />

        <span>{ORWIX_BANNER}</span>

      </div>

    </div>

  );

}

