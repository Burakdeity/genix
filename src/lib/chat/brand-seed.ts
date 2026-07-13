import type { OrwixMode } from "@/content/orwix-content";

const PREFIXES = [
  "Nova",
  "Luma",
  "Vire",
  "Aether",
  "Kora",
  "Sable",
  "Nex",
  "Ora",
  "Vela",
  "Flux",
  "Iris",
  "Solum",
  "Arko",
  "Mira",
  "Zent",
  "Halo",
  "Quanta",
  "Echo",
  "Prism",
  "Rune",
] as const;

const SUFFIXES = [
  "ly",
  "ix",
  "a",
  "on",
  "is",
  "um",
  "ra",
  "lab",
  "studio",
  "works",
  "forge",
  "craft",
  "nest",
  "field",
  "wave",
] as const;

const INDUSTRIES = [
  "premium kahve kavurma",
  "gece odaklı şehir navigasyonu",
  "sessiz lüks kulaklık",
  "bitki bazlı cilt bakımı",
  "bağımsız film arşivi",
  "modüler ev ofisi mobilyası",
  "sürdürülebilir seyahat",
  "kişisel finans koçluğu",
  "analog fotoğraf laboratuvarı",
  "akıllı ev aromaterapisi",
  "niche spor ayakkabı",
  "yerel sanatçı vitrini",
  "yavaş moda atölyesi",
  "uçuş korkusu terapisi",
  "underground caz kulübü",
] as const;

const AESTHETICS = [
  "yağmurlu neon + cam yansımalar",
  "krem kağıt, mürekkep ve tipografi",
  "brutalist beton + tek renk aksan",
  "yumuşak gradient ve cam morphism",
  "editorial dergi dili, geniş boşluk",
  "retro-futurist 70'ler uzay istasyonu",
  "Japon sade minimalizm",
  "koyu lüks, altın ince çizgi",
  "organik doku, toprak tonları",
  "monospace terminal + pastel glitch",
] as const;

const AUDIENCES = [
  "gece çalışan yaratıcılar",
  "tasarım odaklı kurucular",
  "sessiz lüks arayanlar",
  "şehirli gezginler",
  "bağımsız sanatçılar",
  "erken benimseyen teknoloji severler",
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function inventBrandName(): string {
  const raw = `${pick(PREFIXES)}${pick(SUFFIXES)}`;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export type BrandBirthPlan = {
  brandName: string;
  mode: OrwixMode;
  prompt: string;
  tease: string;
};

/**
 * Builds a one-of-a-kind invented brand brief so every click feels unique.
 */
export function createBrandBirth(): BrandBirthPlan {
  const brandName = inventBrandName();
  const industry = pick(INDUSTRIES);
  const aesthetic = pick(AESTHETICS);
  const audience = pick(AUDIENCES);
  const daySeed = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });

  const variants: Array<() => BrandBirthPlan> = [
    () => ({
      brandName,
      mode: "website",
      tease: `${brandName} doğuyor…`,
      prompt: `Sıfırdan uydurma bir marka icat et. Marka adı: ${brandName}. Sektör: ${industry}. Hedef kitle: ${audience}. Görsel dil: ${aesthetic}. Bugünün tarihi: ${daySeed}.

Görev:
1) En fazla 5 cümlelik marka brifi (slogan, kişilik, 3–4 hex renk, tipografi hissi).
2) Tek dosya, eksiksiz, prodüksiyon kalitesinde açılış sayfası HTML (\`\`\`html):
   sticky nav, full-bleed hero (marka baskın), özellikler, sosyal kanıt veya nasıl çalışır, CTA, footer.
   Inline SVG logo; Google Fonts; atmosferik zemin; 2–3 incelikli CSS motion.
3) Gerçekçi Türkçe kopya; lorem/AI-purple klişe yok. Bu marka gerçek değil — tamamen uydur ama inandırıcı olsun.`,
    }),
    () => ({
      brandName,
      mode: "image",
      tease: `${brandName} logosu çiziliyor…`,
      prompt: `Tamamen uydurma marka: ${brandName}. Sektör: ${industry}. Estetik: ${aesthetic}.

Bu marka için stüdyo kalitesinde bir logo + marka kiti görseli oluştur:
- Ortada net logo (kelime markası veya monogram)
- Yanında renk paleti swatch'ları ve kısa slogan
- Temiz, premium, poster gibi kompozisyon
- Gerçekçi olmayan / klişe tech logolardan uzak dur; ${daySeed} ruhuna uygun özgün bir kimlik uydur.`,
    }),
    () => ({
      brandName,
      mode: "video",
      tease: `${brandName} filmi başlıyor…`,
      prompt: `Uydurma marka ${brandName} için 8-12 saniyelik kısa marka tanıtım videosu oluştur. Sektör: ${industry}. Atmosfer: ${aesthetic}. Hedef: ${audience}.

Sinematik, ürün/duygu odaklı, logo reveal ile bitsin. Metin overlay minimal tut. Bugünün ruhu: ${daySeed}.`,
    }),
    () => ({
      brandName,
      mode: "slides",
      tease: `${brandName} yatırımcıya anlatılıyor…`,
      prompt: `Sıfırdan uydurma startup: ${brandName}. Sektör: ${industry}. Kitle: ${audience}. Estetik: ${aesthetic}.

Yatırımcı sunumu hazırla (slayt slayt):
Problem → Çözüm → Ürün → Neden şimdi → Pazar → İş modeli → Marka kimliği → Sonraki 90 gün.
Tüm isimler, rakamlar ve hikâye uydurma olsun; tutarlı ve inandırıcı yaz. Tarih notu: ${daySeed}.`,
    }),
  ];

  return pick(variants)();
}
