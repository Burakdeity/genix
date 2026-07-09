import { OrwixIcon } from "@/components/brand/orwix-icon";
import { cn } from "@/lib/utils";

export function OrwixWordmark({
  className,
  hero = false,
}: {
  className?: string;
  hero?: boolean;
}) {
  return (
    <span
      className={cn(
        hero ? "orwix-wordmark-hero" : "orwix-wordmark",
        "font-bold tracking-tight",
        className,
      )}
      aria-label="Orwix"
    >
      Orwix
    </span>
  );
}

export function OrwixBrandHero({ className }: { className?: string }) {
  return (
    <OrwixWordmark
      hero
      className={cn(
        "text-5xl font-extrabold tracking-tight md:text-7xl",
        className,
      )}
    />
  );
}

export function OrwixLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("orwix-hero-logo inline-flex items-center justify-center", className)}
      aria-label="Orwix"
    >
      <OrwixIcon size={72} className="size-16 md:size-[4.5rem]" />
    </div>
  );
}
