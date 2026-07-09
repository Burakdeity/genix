import { cn } from "@/lib/utils";

export function GenixWordmark({
  className,
  hero = false,
}: {
  className?: string;
  hero?: boolean;
}) {
  return (
    <span
      className={cn(
        hero ? "genix-wordmark-hero" : "genix-wordmark",
        "font-bold tracking-tight",
        className,
      )}
      aria-label="Genix"
    >
      Genix
    </span>
  );
}

export function GenixBrandHero({ className }: { className?: string }) {
  return (
    <GenixWordmark
      hero
      className={cn(
        "text-5xl font-extrabold tracking-tight md:text-7xl",
        className,
      )}
    />
  );
}
