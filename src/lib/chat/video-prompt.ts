import { normalizeTr, trStem, trWord, TR_LEFT, TR_RIGHT } from "@/lib/chat/tr-text";

const VIDEO_NOUNS = [
  "video",
  "videosu",
  "videoyu",
  "videoya",
  "klip",
  "klibi",
  "reels",
  "shorts",
  "short",
  "animasyon",
  "animasyonu",
  "sinematik\\s+sahne",
  "kısa\\s+film",
  "kisa\\s+film",
  "reklam\\s+filmi",
  "tanıtım\\s+filmi",
  "tanitim\\s+filmi",
  "marka\\s+filmi",
  "çekim",
  "cekim",
  "çekimi",
  "cekimi",
  "tiktok",
  "story\\s+videosu",
  "hikaye\\s+videosu",
  "hareketli\\s+(?:görüntü|gorsel|sahne)",
  "motion",
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
  "dönüştür",
  "donustur",
  "çevir",
  "cevir",
  "ver",
  "iste",
] as const;

const VIDEO_PROMPT_RE = new RegExp(
  [
    // noun … verb / verb … noun
    `${trStem(VIDEO_NOUNS)}[\\s\\S]{0,100}${trStem(VIDEO_VERBS)}`,
    `${trStem(VIDEO_VERBS)}[\\s\\S]{0,100}${trStem(VIDEO_NOUNS)}`,
    // fixed phrases
    `${TR_LEFT}(?:video\\s+üret|video\\s+uret|generate\\s+(?:a\\s+)?video|create\\s+(?:a\\s+)?video|make\\s+(?:a\\s+)?video|bana\\s+bir\\s+video|video\\s+hazırla|video\\s+hazirla|video\\s+çek|video\\s+cek|klip\\s+çek|klip\\s+cek)${TR_RIGHT}`,
    `${TR_LEFT}(?:videoya\\s+(?:çevir|cevir|dönüştür|donustur)|videoya\\s+dön|şunu\\s+video\\s+yap|sunu\\s+video\\s+yap|bunu\\s+video\\s+yap)${TR_RIGHT}`,
    // trailing “… videosu / … videosunu”
    `${TR_LEFT}[\\s\\S]{2,160}?\\s+(?:video|klip|reels|shorts|animasyon)\\p{L}*\\s*$`,
    // “video: …” / “Video — …”
    `${TR_LEFT}(?:video|klip|reels|shorts)\\s*[:：\\-]\\s*\\S+`,
  ].join("|"),
  "iu",
);

const VERTICAL_RE = new RegExp(
  `${TR_LEFT}(?:9:16|dikey|story|stories|reels|shorts|tiktok|instagram\\s+story|hikaye\\s+videosu|telefon\\s+ekranı|telefon\\s+ekrani)${TR_RIGHT}`,
  "iu",
);

const HORIZONTAL_RE = new RegExp(
  `${TR_LEFT}(?:16:9|yatay|geniş\\s+ekran|genis\\s+ekran|sinema|youtube|landscape)${TR_RIGHT}`,
  "iu",
);

/** Strip generation commands so Veo gets a scene, not “make a video”. */
const COMMAND_NOISE_RE = new RegExp(
  [
    trWord([
      "lütfen",
      "lutfen",
      "please",
      "orwix",
      "bana",
    ]),
    // Only clear media / generate commands — not story verbs like "yapan".
    `${TR_LEFT}(?:video|videosu|videosunu|videoyu|videoya|videolar|klip|klibi|reels|shorts|short|animasyon|animasyonu)${TR_RIGHT}`,
    `${TR_LEFT}(?:oluştur|olustur|oluşturur\\s+musun|olusturur\\s+musun|üret|uret|hazırla|hazirla|tasarla|generate|create|make)${TR_RIGHT}`,
    `${TR_LEFT}(?:çek|cek|çeker\\s+misin|ceker\\s+misin)${TR_RIGHT}`,
    `${TR_LEFT}(?:yap|yapar\\s+mısın|yapar\\s+misin)${TR_RIGHT}`,
    `${TR_LEFT}(?:videoya\\s+(?:çevir|cevir|dönüştür|donustur)|bir\\s+tane)${TR_RIGHT}`,
    `${TR_LEFT}(?:şu\\s+şekilde|su\\s+sekilde)${TR_RIGHT}`,
  ].join("|"),
  "giu",
);

export function isVideoGenerationPrompt(prompt: string): boolean {
  return VIDEO_PROMPT_RE.test(normalizeTr(prompt));
}

export function detectVideoAspectRatio(
  prompt: string,
): "16:9" | "9:16" {
  const text = normalizeTr(prompt);
  if (VERTICAL_RE.test(text)) return "9:16";
  if (HORIZONTAL_RE.test(text)) return "16:9";
  return "16:9";
}

export function extractVideoScene(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "";

  let scene = trimmed
    .replace(COMMAND_NOISE_RE, " ")
    .replace(/[:：\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If stripping wiped everything, keep the original request.
  if (scene.length < 3) scene = trimmed;
  return scene;
}

/**
 * Build a Veo-friendly prompt from Turkish (or mixed) user text.
 * Keeps the user's meaning as the source of truth; avoids meta text that
 * models sometimes bake into the frame.
 */
export function enhanceVideoPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const scene =
    extractVideoScene(trimmed) ||
    "Sinematik, akıcı hareketli, yüksek kaliteli kısa bir sahne";

  const aspect = detectVideoAspectRatio(trimmed);
  const framing =
    aspect === "9:16"
      ? "Vertical 9:16 framing, phone-first composition."
      : "Widescreen 16:9 cinematic framing.";

  return [
    `Create an 8-second cinematic video.`,
    `User request (Turkish — follow meaning exactly, do not ignore): ${trimmed}`,
    `Scene to film: ${scene}`,
    framing,
    `Motion: natural, continuous action (not a still photo); consistent characters and objects across frames.`,
    `Camera: smooth, motivated camera move; professional lighting and color.`,
    `Avoid: on-screen captions, watermarks, UI chrome, logos, subtitles, random text — unless the user explicitly asked for text.`,
    `Quality: sharp detail, coherent physics, no flicker or morphing faces.`,
  ].join("\n");
}
