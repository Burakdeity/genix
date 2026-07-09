import { cn } from "@/lib/utils";

interface AccountAvatarProps {
  name: string;
  color: string;
  picture?: string;
  className?: string;
}

export function AccountAvatar({
  name,
  color,
  picture,
  className,
}: AccountAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white",
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
