const IMAGE_PROMPT_RE =
  /\b(resim|görsel|image|logo|illustration|illüstrasyon|afiş|poster|wallpaper|arkaplan|background)\b[\s\S]{0,40}\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla|hazırla)\b|\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla)\b[\s\S]{0,40}\b(resim|görsel|image|logo|illustration|illüstrasyon|afiş|poster)\b|\b(bana\s+bir\s+resim|draw\s+(me\s+)?an?\s+image|generate\s+an?\s+image|create\s+an?\s+image)\b/i;

export function isImageGenerationPrompt(prompt: string): boolean {
  return IMAGE_PROMPT_RE.test(prompt.trim());
}

export function detectAspectRatio(
  prompt: string,
): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | undefined {
  const normalized = prompt.toLowerCase();
  if (/\b(16:9|yatay|landscape|geniş)\b/.test(normalized)) return "16:9";
  if (/\b(9:16|dikey|story|portrait|telefon)\b/.test(normalized)) return "9:16";
  if (/\b(4:3)\b/.test(normalized)) return "4:3";
  if (/\b(3:4)\b/.test(normalized)) return "3:4";
  if (/\b(1:1|kare|square)\b/.test(normalized)) return "1:1";
  return undefined;
}
