import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BrandMemory = {
  name: string;
  tagline: string;
  colors: string;
  typography: string;
  voice: string;
  avoid: string;
  notes: string;
  updatedAt: number;
};

interface BrandMemoryState {
  byAccountId: Record<string, BrandMemory>;
  getBrand: (accountId: string | null) => BrandMemory | null;
  saveBrand: (accountId: string, brand: Omit<BrandMemory, "updatedAt">) => void;
  clearBrand: (accountId: string) => void;
  toPromptBlock: (accountId: string | null) => string | null;
}

const EMPTY: BrandMemory = {
  name: "",
  tagline: "",
  colors: "",
  typography: "",
  voice: "",
  avoid: "",
  notes: "",
  updatedAt: 0,
};

export const useBrandMemoryStore = create<BrandMemoryState>()(
  persist(
    (set, get) => ({
      byAccountId: {},

      getBrand: (accountId) => {
        if (!accountId) return null;
        return get().byAccountId[accountId] ?? null;
      },

      saveBrand: (accountId, brand) => {
        set((state) => ({
          byAccountId: {
            ...state.byAccountId,
            [accountId]: { ...brand, updatedAt: Date.now() },
          },
        }));
      },

      clearBrand: (accountId) => {
        set((state) => {
          const next = { ...state.byAccountId };
          delete next[accountId];
          return { byAccountId: next };
        });
      },

      toPromptBlock: (accountId) => {
        if (!accountId) return null;
        const brand = get().byAccountId[accountId];
        if (!brand?.name.trim()) return null;
        return [
          "Kayıtlı marka hafızası (zorunlu uy):",
          `- İsim: ${brand.name}`,
          brand.tagline ? `- Slogan: ${brand.tagline}` : null,
          brand.colors ? `- Renkler: ${brand.colors}` : null,
          brand.typography ? `- Tipografi: ${brand.typography}` : null,
          brand.voice ? `- Ses/ton: ${brand.voice}` : null,
          brand.avoid ? `- Kaçın: ${brand.avoid}` : null,
          brand.notes ? `- Notlar: ${brand.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      },
    }),
    {
      name: "orwix-brand-memory",
      skipHydration: true,
      partialize: (state) => ({ byAccountId: state.byAccountId }),
    },
  ),
);

export function parseBrandCardFromText(text: string): Omit<BrandMemory, "updatedAt"> {
  const pick = (label: string) => {
    const re = new RegExp(`${label}\\s*[:：]\\s*(.+)`, "i");
    const match = re.exec(text);
    return match?.[1]?.trim() ?? "";
  };

  return {
    name: pick("İsim|Name|Marka") || EMPTY.name,
    tagline: pick("Slogan|Tagline"),
    colors: pick("Renk(?:ler)?|Colors?|Hex"),
    typography: pick("Tipografi|Typography|Font"),
    voice: pick("Ses\\/ton|Ton|Voice"),
    avoid: pick("Kaçın|Yasak|Avoid"),
    notes: pick("Notlar|Notes"),
  };
}
