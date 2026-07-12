const VIDEO_PROMPT_RE =
  /\b(video|klip|reels|short|animasyon|sinematik\s+sahne)\b[\s\S]{0,60}\b(oluştur|yap|üret|generate|create|çek|tasarla)\b|\b(oluştur|yap|üret|generate|create|çek)\b[\s\S]{0,60}\b(video|klip|reels|short)\b|\b(video\s+üret|generate\s+(a\s+)?video|create\s+(a\s+)?video|bana\s+bir\s+video)\b/i;

export function isVideoGenerationPrompt(prompt: string): boolean {
  return VIDEO_PROMPT_RE.test(prompt.trim());
}

export function enhanceVideoPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const base =
    trimmed ||
    "Sinematik, yüksek kaliteli, akıcı hareketli kısa bir video oluştur.";

  return `${base}

Üretim kalitesi (zorunlu):
- Sinematik kamera, doğal hareket, tutarlı karakter/nesne
- Profesyonel ışık ve renk; düşük çözünürlük hissinden kaçın
- 8 saniyelik kısa sahne için net aksiyon ve tempo`;
}
