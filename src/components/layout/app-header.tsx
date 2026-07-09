export function AppHeader() {
  return (
    <header className="border-b border-border bg-card/60 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight md:text-xl">
            <span className="orwix-gradient-text">ORWIX</span>
            <span className="ml-1.5 hidden text-sm font-normal text-muted-foreground sm:inline">
              | v2.1
            </span>
          </h1>
          <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block md:text-sm">
            API anahtarı sunucuda güvenli şekilde saklanır
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-400">Bağlı</span>
        </div>
      </div>
    </header>
  );
}
