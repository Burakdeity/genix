import type { OrwixMode } from "@/content/orwix-content";

const MODE_OVERLAYS: Record<Exclude<OrwixMode, "general">, string> = {
  image: `Mod: Görsel stüdyosu.
- Kullanıcı görsel istiyor; promptu görsel üretimine uygun, net ve zengin tut.
- Kompozisyon, ışık, stil, oran ve atmosferi netleştir.`,
  video: `Mod: Video stüdyosu (Veo).
- Kısa, sinematik, net bir sahne tanımı üretmeye odaklan.
- Kamera hareketi, ışık, tempo ve ses/diyalog ipuçlarını belirt.`,
  website: `Mod: Web sitesi mimarı.
- Tek seferde kullanılabilir, modern, responsive TEK DOSYA HTML üret (CSS ve gerekirse JS aynı dosyada).
- Mutlaka \`\`\`html ... \`\`\` kod bloğu içinde tam bir HTML belgesi ver (<!DOCTYPE html> ile başlasın).
- Temiz tipografi, güçlü hero, net CTA, mobil uyum.
- Önce 1-2 cümle özet, sonra HTML bloğu. Uzun açıklama yazma; kod çalışır olsun.`,
  slides: `Mod: Sunum tasarımcısı.
- Slayt slayt yapı kur: başlık, madde, konuşmacı notu.
- Hikaye akışı: problem → çözüm → kanıt → çağrı.
- Markdown veya net numaralı slayt formatı kullan.`,
  design: `Mod: Ürün / marka tasarımcısı.
- Görsel dil, renk paleti, tipografi, boşluk ve UI bileşenleri öner.
- Uygulanabilir spesifikasyon ver (hex, font, spacing).
- İstenirse kısa CSS/token seti çıkar.`,
  apps: `Mod: Yazılım mühendisi.
- Çalışan, temiz, production-kalitesine yakın kod yaz.
- Mimariyi kısa açıkla; sonra tam dosya/kod blokları ver.
- Hata ayıkla, test et, alternatif yaklaşımları belirt.
- Gerekirse adım adım kurulum ve çalıştırma talimatı ekle.`,
  research: `Mod: Derin araştırma.
- Güncel bilgi için arama sonuçlarını kullan.
- Çelişen kaynakları karşılaştır; emin olmadığın yerleri belirt.
- Yapı: özet → bulgular → kanıt/kaynak → sonuç/öneri.
- Tarih, rakam ve iddiaları mümkün olduğunca doğrula.`,
};

export function buildSystemInstruction(
  base: string,
  mode: OrwixMode = "general",
): string {
  const overlay =
    mode !== "general" ? MODE_OVERLAYS[mode] : null;
  if (!overlay) return base;
  return `${base.trim()}

${overlay}`;
}

const RESEARCH_RE =
  /\b(araştır|araştırma|research|güncel|haber|kaynak|kanıt|karşılaştır|nedir|nasıl çalışır|istatistik|trend|piyasa|fiyat|bugün|202[4-9])\b/i;

const CODE_RE =
  /\b(kod|yazılım|program|debug|refactor|typescript|javascript|python|react|next\.?js|api|sql|algoritma|fonksiyon|class|bug|hata|test yaz|unit test)\b/i;

export function shouldEnableSearch(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  if (mode === "research") return true;
  if (mode === "image" || mode === "video") return false;
  return RESEARCH_RE.test(prompt) || mode === "general";
}

export function shouldEnableCodeExecution(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  if (mode === "apps") return true;
  return CODE_RE.test(prompt);
}
