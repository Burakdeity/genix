const IMAGE_PROMPT_RE =
  /\b(resim|görsel|image|picture|logo|illustration|illüstrasyon|afiş|poster|wallpaper|arkaplan|background|fotoğraf|fotograf|banner|thumbnail|kapak|ikon|icon|mockup|render)\b[\s\S]{0,80}\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla|hazırla|tasarım)\b|\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla)\b[\s\S]{0,80}\b(resim|görsel|image|picture|logo|illustration|illüstrasyon|afiş|poster|fotoğraf|fotograf|banner|kapak|ikon|icon)\b|\b(bana\s+bir\s+(resim|görsel)|draw\s+(me\s+)?an?\s+(image|picture)|generate\s+an?\s+(image|picture)|create\s+an?\s+(image|picture)|make\s+(me\s+)?an?\s+(image|picture|logo)|görsel\s+üret|image\s+gen|picture\s+of)\b|\b(çiz\s+bana|bana\s+çiz)\b/i;

const IMAGE_EDIT_RE =
  /\b(düzenle|edit|değiştir|varyasyon|yeniden\s+çiz|bu\s+görsel|şu\s+görsel|önceki\s+görsel|make\s+it|change\s+it|add\s+text|yazı\s+ekle|üzerine\s+yaz|renk\s+değiştir|arka\s+plan|background\s+change|remove|kaldır|ekle)\b|\b(bunu|şunu|onu)\s+\S{2,20}\s+yap\b|\b(görselde|resimde|fotoda|üzerinde)\b.{0,40}\b(yaz|ekle|koy|yap|değiştir|kaldır)\b/i;

export function isImageGenerationPrompt(prompt: string): boolean {
  return IMAGE_PROMPT_RE.test(prompt.trim());
}

export function isImageEditPrompt(prompt: string): boolean {
  return IMAGE_EDIT_RE.test(prompt.trim());
}

export function detectAspectRatio(
  prompt: string,
): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | undefined {
  const normalized = prompt.toLowerCase();
  if (/\b(16:9|yatay|landscape|geniş|widescreen)\b/.test(normalized)) {
    return "16:9";
  }
  if (/\b(9:16|dikey|story|portrait|telefon|reels)\b/.test(normalized)) {
    return "9:16";
  }
  if (/\b(4:3)\b/.test(normalized)) return "4:3";
  if (/\b(3:4)\b/.test(normalized)) return "3:4";
  if (/\b(1:1|kare|square)\b/.test(normalized)) return "1:1";
  return undefined;
}

/**
 * Light wrapper: keep the user's request as the source of truth.
 * Avoid forcing cinematic/studio style that overrides logos, icons, comics, etc.
 */
export function enhanceImagePrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const base =
    trimmed ||
    "Kullanıcı isteğine sadık kalarak net ve kaliteli bir görsel oluştur.";

  return `${base}

Kurallar:
- İstenen konu, stil, renk, kompozisyon ve metne birebir uy
- Kullanıcı belirtmedikçe ekstra sinematik/stüdyo stili dayatma
- Yanıtta mutlaka görsel üret; sadece metin açıklaması yazma`;
}

export function dataUrlToInlineImage(
  dataUrl: string,
  fallbackMime = "image/png",
): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match?.[2]) return null;
  return {
    mimeType: match[1] || fallbackMime,
    data: match[2],
  };
}
