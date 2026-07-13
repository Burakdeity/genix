import { normalizeTr, trStem, TR_LEFT, TR_RIGHT } from "@/lib/chat/tr-text";

const VIDEO_NOUNS = [
  "video",
  "klip",
  "reels",
  "shorts",
  "short",
  "animasyon",
  "sinematik\\s+sahne",
  "kısa\\s+film",
  "kisa\\s+film",
  "reklam\\s+filmi",
  "tanıtım\\s+filmi",
  "tanitim\\s+filmi",
  "çekim",
  "cekim",
  "tiktok",
  "story\\s+videosu",
] as const;

const VIDEO_VERBS = [
  "oluştur",
  "olustur",
  "yap",
  "üret",
  "uret",
  "generate",
  "create",
  "çek",
  "cek",
  "tasarla",
  "hazırla",
  "hazirla",
] as const;

const VIDEO_PROMPT_RE = new RegExp(
  [
    `${trStem(VIDEO_NOUNS)}[\\s\\S]{0,80}${trStem(VIDEO_VERBS)}`,
    `${trStem(VIDEO_VERBS)}[\\s\\S]{0,80}${trStem(VIDEO_NOUNS)}`,
    `${TR_LEFT}(?:video\\s+üret|video\\s+uret|generate\\s+(?:a\\s+)?video|create\\s+(?:a\\s+)?video|bana\\s+bir\\s+video|video\\s+hazırla|video\\s+hazirla)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

export function isVideoGenerationPrompt(prompt: string): boolean {
  return VIDEO_PROMPT_RE.test(normalizeTr(prompt));
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
