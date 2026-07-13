import type { OrwixMode } from "@/content/orwix-content";

import { normalizeTr, trStem, trWord, TR_LEFT, TR_RIGHT } from "@/lib/chat/tr-text";

const MODE_OVERLAYS: Record<Exclude<OrwixMode, "general">, string> = {
  image: `Mod: Görsel stüdyosu. Net, zengin görsel promptu üret.`,
  video: `Mod: Video stüdyosu. Kısa sinematik sahne tanımı ver.`,
  website: `Mod: Web sitesi. Tek dosya çalışır HTML (\`\`\`html) üret. Kısa özet + kod.`,
  slides: `Mod: Sunum. Slayt slayt yapı: başlık, madde, not.`,
  design: `Mod: Tasarım. Renk, tipografi, spacing spesifikasyonu ver.`,
  apps: `Mod: Yazılım. Çalışan kod + kısa mimari açıklama.`,
  research: `Mod: Araştırma. Güncel kaynaklarla özet → bulgular → sonuç.`,
};

export function buildSystemInstruction(
  base: string,
  mode: OrwixMode = "general",
): string {
  const overlay = mode !== "general" ? MODE_OVERLAYS[mode] : null;
  if (!overlay) return base;
  return `${base.trim()}\n\n${overlay}`;
}

const RESEARCH_RE = new RegExp(
  [
    trWord([
      "araştır",
      "arastir",
      "research",
      "gündem",
      "gundem",
      "istatistik",
      "incele",
    ]),
    `${TR_LEFT}(?:araştırma\\s+yap|arastirma\\s+yap|web'?de\\s+ara|google'?da\\s+ara|netten\\s+bak|güncel\\s+(?:haber|fiyat|veri|durum)|guncel\\s+(?:haber|fiyat|veri|durum)|haberleri|kaynaklarla|kanıtlarla|kanitlarla|piyasa\\s+fiyat|bugün\\s+ne|bugun\\s+ne|son\\s+durum|fiyatı?\\s+ne|fiyati?\\s+ne|kaç\\s+para|kac\\s+para|ne\\s+kadar\\s+(?:oldu|eder)|şu\\s+an\\s+ne|su\\s+an\\s+ne|202[5-9]\\s+(?:yılı|yili|veri))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const CODE_RE = new RegExp(
  [
    `${TR_LEFT}(?:kod\\s+yaz|program\\s+yaz|uygulama\\s+yaz|yazılım\\s+yaz|yazilim\\s+yaz|script\\s+yaz|fonksiyon\\s+yaz|api\\s+yaz|debug\\s+et|refactor|unit\\s+test|typescript|javascript|python(?:\\s+kod)?|react(?:\\s+komponent)?|next\\.?js|sql(?:\\s+sorgu)?|backend|frontend|mobil\\s+uygulama|todo\\s+app)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const WEBSITE_RE = new RegExp(
  [
    `${trStem([
      "website",
      "web\\s*sitesi",
      "landing(?:\\s*page)?",
      "açılış\\s*sayfa",
      "acilis\\s*sayfa",
      "html\\s*sayfa",
      "portföy\\s*site",
      "portfoy\\s*site",
      "e-?ticaret\\s*site",
      "shopify",
      "saas\\s*site",
      "kurumsal\\s*site",
      "blog\\s*site",
    ])}[\\s\\S]{0,80}${trStem([
      "oluştur",
      "olustur",
      "yap",
      "üret",
      "uret",
      "tasarla",
      "hazırla",
      "hazirla",
      "kodla",
    ])}`,
    `${TR_LEFT}(?:web\\s*sitesi\\s+(?:oluştur|olustur|yap)|site\\s+(?:oluştur|olustur|yap)|landing\\s*page\\s+(?:yap|oluştur|olustur))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const SLIDES_RE = new RegExp(
  [
    `${trStem([
      "slayt",
      "sunum",
      "powerpoint",
      "ppt",
      "deck",
      "prezentasyon",
      "sunu",
      "yatırımcı\\s*sunum",
      "yatirimci\\s*sunum",
    ])}[\\s\\S]{0,80}${trStem([
      "oluştur",
      "olustur",
      "yap",
      "üret",
      "uret",
      "hazırla",
      "hazirla",
      "tasarla",
    ])}`,
    `${TR_LEFT}(?:slayt\\s+(?:oluştur|olustur|yap)|sunum\\s+(?:hazırla|hazirla|yap))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const APPS_RE = new RegExp(
  [
    CODE_RE.source,
    `${trStem([
      "uygulama",
      "app",
      "yazılım",
      "yazilim",
      "program",
    ])}[\\s\\S]{0,80}${trStem([
      "yaz",
      "oluştur",
      "olustur",
      "yap",
      "geliştir",
      "gelistir",
      "kodla",
    ])}`,
  ].join("|"),
  "iu",
);

export function detectPromptMode(prompt: string): OrwixMode | null {
  const text = normalizeTr(prompt);
  if (!text) return null;
  if (WEBSITE_RE.test(text)) return "website";
  if (SLIDES_RE.test(text)) return "slides";
  if (APPS_RE.test(text)) return "apps";
  if (RESEARCH_RE.test(text)) return "research";
  return null;
}

export function shouldEnableSearch(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  if (mode === "research") return true;
  if (
    mode === "image" ||
    mode === "video" ||
    mode === "website" ||
    mode === "slides" ||
    mode === "design" ||
    mode === "apps"
  ) {
    return false;
  }
  return RESEARCH_RE.test(normalizeTr(prompt));
}

export function shouldEnableCodeExecution(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  const text = normalizeTr(prompt);
  if (mode === "apps") return CODE_RE.test(text) || text.length > 20;
  return CODE_RE.test(text);
}
