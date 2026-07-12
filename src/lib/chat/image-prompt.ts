const IMAGE_PROMPT_RE =
  /\b(resim|görsel|image|logo|illustration|illüstrasyon|afiş|poster|wallpaper|arkaplan|background|fotoğraf|fotograf|banner|thumbnail|kapak|ikon|icon|mockup|render)\b[\s\S]{0,60}\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla|hazırla|tasarım)\b|\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla)\b[\s\S]{0,60}\b(resim|görsel|image|logo|illustration|illüstrasyon|afiş|poster|fotoğraf|fotograf|banner|kapak|ikon|icon)\b|\b(bana\s+bir\s+(resim|görsel)|draw\s+(me\s+)?an?\s+image|generate\s+an?\s+image|create\s+an?\s+image|görsel\s+üret|image\s+gen)\b/i;

export function isImageGenerationPrompt(prompt: string): boolean {
  return IMAGE_PROMPT_RE.test(prompt.trim());
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

/** Studio-grade prompt wrapper for top-tier image generation. */
export function enhanceImagePrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const base =
    trimmed ||
    "Çarpıcı, stüdyo kalitesinde, profesyonel bir görsel oluştur.";

  return `${base}

Üretim kalitesi (zorunlu):
- Stüdyo / sinematik ışık, yüksek detay, keskin odak
- Profesyonel kompozisyon, dengeli boşluk, premium estetik
- Gerçekçi dokular ve temiz renk yönetimi
- Yapay görünümü, düşük çözünürlük hissi ve bozuk yazılardan kaçın
- Yanıtta mutlaka görsel üret; sadece metin açıklaması yazma`;
}
