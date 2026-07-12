import type { OrwixMode } from "@/content/orwix-content";

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

/** Only explicit live-web / research intents — "nedir" alone must NOT trigger search. */
const RESEARCH_RE =
  /\b(araştır|araştırma\s+yap|research|web'?de\s+ara|güncel\s+(haber|fiyat|veri)|haberleri|kaynaklarla|kanıtlarla|istatistik|piyasa\s+fiyat|bugün\s+ne|202[5-9]\s+(yılı|veri))\b/i;

const CODE_RE =
  /\b(kod\s+yaz|program\s+yaz|debug\s+et|refactor|unit\s+test|typescript|javascript|python\s+kod|react\s+komponent|next\.?js|sql\s+sorgu)\b/i;

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
  return RESEARCH_RE.test(prompt);
}

export function shouldEnableCodeExecution(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  if (mode === "apps") return CODE_RE.test(prompt) || prompt.length > 20;
  return CODE_RE.test(prompt);
}
