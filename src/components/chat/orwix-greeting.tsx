import { OrwixBrandHero } from "@/components/brand/orwix-logo";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useAuthStore } from "@/stores/auth.store";

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function OrwixGreeting() {
  const hydrated = useStoresHydrated();
  const activeAccount = useAuthStore((state) =>
    hydrated ? state.getActiveAccount() : null,
  );
  const firstName = activeAccount
    ? getFirstName(activeAccount.name)
    : "Burak";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-40 pt-6 md:pb-36">
      <OrwixBrandHero className="mb-5" />
      <h1 className="orwix-greeting mb-2 text-center text-2xl font-medium tracking-tight md:text-3xl">
        Merhaba, {firstName}
      </h1>
      <p className="max-w-md text-center text-sm text-muted-foreground md:text-base">
        Size nasıl yardımcı olabilirim? Kendi sorunuzu yazın.
      </p>
    </div>
  );
}
