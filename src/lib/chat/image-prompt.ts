import type { ChatMessage } from "@/types/chat.types";

import { resolveMessageImageDataUrl } from "@/lib/chat/session-image-cache";
import { normalizeTr, trStem, trWord, TR_LEFT, TR_RIGHT } from "@/lib/chat/tr-text";

const IMAGE_NOUNS = [
  "resim",
  "resmi",
  "görsel",
  "gorsel",
  "image",
  "picture",
  "logo",
  "illustration",
  "illüstrasyon",
  "illustrasyon",
  "afiş",
  "afis",
  "poster",
  "wallpaper",
  "arkaplan",
  "arka\\s*plan",
  "background",
  "fotoğraf",
  "fotograf",
  "foto",
  "banner",
  "thumbnail",
  "kapak",
  "ikon",
  "icon",
  "mockup",
  "render",
  "avatar",
  "sticker",
  "stiker",
  "çizim",
  "cizim",
  "sahne",
  "manzara",
] as const;

const GEN_VERBS = [
  "çiz",
  "ciz",
  "oluştur",
  "olustur",
  "yap",
  "üret",
  "uret",
  "generate",
  "create",
  "draw",
  "tasarla",
  "hazırla",
  "hazirla",
  "tasarım",
  "tasarim",
] as const;

const IMAGE_PROMPT_RE = new RegExp(
  [
    `${trStem(IMAGE_NOUNS)}[\\s\\S]{0,100}${trStem(GEN_VERBS)}`,
    `${trStem(GEN_VERBS)}[\\s\\S]{0,100}${trStem(IMAGE_NOUNS)}`,
    `${TR_LEFT}(?:bana\\s+bir\\s+(?:resim|görsel|gorsel|logo|foto(?:ğraf|graf)?)|draw\\s+(?:me\\s+)?an?\\s+(?:image|picture)|generate\\s+an?\\s+(?:image|picture)|create\\s+an?\\s+(?:image|picture)|make\\s+(?:me\\s+)?an?\\s+(?:image|picture|logo)|görsel\\s+üret|gorsel\\s+uret|image\\s+gen|picture\\s+of)${TR_RIGHT}`,
    `${TR_LEFT}(?:çiz\\s+bana|ciz\\s+bana|bana\\s+çiz|bana\\s+ciz)${TR_RIGHT}`,
    `${TR_LEFT}(?:ürün\\s+foto(?:ğraf|graf)?|profil\\s+foto(?:ğraf|graf)?|ai\\s+art|pixel\\s+art)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

/** Strong edit intents that imply an existing image when context exists. */
const IMAGE_EDIT_STRONG_RE = new RegExp(
  [
    trWord([
      "düzenle",
      "duzenle",
      "editle",
      "edit",
      "değiştir",
      "degistir",
      "varyasyon",
      "retuş",
      "retus",
      "düzelt",
      "duzelt",
      "iyileştir",
      "iyilestir",
      "güncelle",
      "guncelle",
      "kırp",
      "kirp",
      "crop",
    ]),
    `${TR_LEFT}(?:yeniden\\s+çiz|yeniden\\s+ciz|tekrar\\s+çiz|tekrar\\s+ciz|tekrar\\s+dene|bu\\s+görsel|bu\\s+gorsel|şu\\s+görsel|su\\s+gorsel|önceki\\s+görsel|onceki\\s+gorsel|make\\s+it|change\\s+it|add\\s+text|yazı\\s+ekle|yazi\\s+ekle|üzerine\\s+yaz|uzerine\\s+yaz|renk\\s+değiştir|renk\\s+degistir|arka\\s*plan(?:ı|i)?|background\\s+change)${TR_RIGHT}`,
    `${TR_LEFT}(?:bunu|şunu|sunu|onu|bunun|şunun|sunun)\\p{L}{0,6}\\s+\\S{0,28}\\s*(?:yap|koy|ekle|değiştir|degistir|kaldır|kaldir|uzat|kısalt|kisalt|uzalt|daralt|genişlet|genislet)${TR_RIGHT}`,
    `${TR_LEFT}(?:görselde|gorselde|resimde|fotoda|fotoğrafta|fotografda|üzerinde|uzerinde|içinde|icinde)${TR_RIGHT}.{0,48}${trWord([
      "yaz",
      "ekle",
      "koy",
      "yap",
      "değiştir",
      "degistir",
      "kaldır",
      "kaldir",
      "sil",
      "çıkar",
      "cikar",
      "taşı",
      "tasi",
    ])}`,
    `${TR_LEFT}(?:boyunu|genişliğini|genisligini|yüksekliğini|yuksekligini|enini|boyutunu|oranı|orani|aspect)${TR_RIGHT}.{0,28}${trWord([
      "uzat",
      "kısalt",
      "kisalt",
      "uzalt",
      "uzun",
      "kısa",
      "kisa",
      "daralt",
      "genişlet",
      "genislet",
      "küçült",
      "kucult",
      "büyüt",
      "buyut",
      "artır",
      "artir",
      "azalt",
      "değiştir",
      "degistir",
      "ayarla",
    ])}`,
    `${trWord([
      "uzat",
      "kısalt",
      "kisalt",
      "uzalt",
      "daralt",
      "genişlet",
      "genislet",
      "küçült",
      "kucult",
      "büyüt",
      "buyut",
      "crop",
      "kırp",
      "kirp",
    ])}.{0,28}${trWord([
      "boy",
      "genişlik",
      "genislik",
      "yükseklik",
      "yukseklik",
      "görsel",
      "gorsel",
      "resim",
      "foto",
    ])}`,
    `${TR_LEFT}(?:oraya|buraya|şuraya|suraya|sola|sağa|saga|üste|uste|alta|ortaya|kenara)${TR_RIGHT}.{0,36}${trWord([
      "koy",
      "ekle",
      "taşı",
      "tasi",
      "yerleştir",
      "yerlestir",
      "yaz",
      "getir",
      "bunu",
      "şunu",
      "sunu",
    ])}`,
    `${TR_LEFT}daha\\s+(?:kısa|kisa|uzun|geniş|genis|dar|büyük|buyuk|küçük|kucuk|koyu|açık|acik|parlak|bulanık|bulanik)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

/** Bare verbs that only count as edits when a reference image exists. */
const IMAGE_CONTEXTUAL_EDIT_RE = new RegExp(
  [
    trWord([
      "boy",
      "genişlik",
      "genislik",
      "yükseklik",
      "yukseklik",
      "en",
      "oran",
      "crop",
      "kırp",
      "kirp",
      "zoom",
      "yakınlaştır",
      "yakinlastir",
      "uzaklaştır",
      "uzaklastir",
      "filtre",
      "parlak",
      "kontrast",
      "gölge",
      "golge",
      "blur",
      "bulanık",
      "bulanik",
      "uzat",
      "kısalt",
      "kisalt",
      "uzalt",
      "daralt",
      "genişlet",
      "genislet",
      "küçült",
      "kucult",
      "büyüt",
      "buyut",
      "artır",
      "artir",
      "azalt",
      "koy",
      "ekle",
      "sil",
      "kaldır",
      "kaldir",
      "çıkar",
      "cikar",
      "taşı",
      "tasi",
      "yerleştir",
      "yerlestir",
      "değiştir",
      "degistir",
      "düzenle",
      "duzenle",
      "ayarla",
      "düzelt",
      "duzelt",
      "iyileştir",
      "iyilestir",
      "güncelle",
      "guncelle",
      "oraya",
      "buraya",
      "şuraya",
      "suraya",
      "sol",
      "sağ",
      "sag",
      "üst",
      "ust",
      "alt",
      "ortaya",
      "bunu",
      "şunu",
      "sunu",
      "onu",
      "bunun",
      "şunun",
      "sunun",
    ]),
    `${TR_LEFT}daha\\s+(?:kısa|kisa|uzun|geniş|genis|dar|büyük|buyuk|küçük|kucuk)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const PURE_TEXT_QUESTION_RE = new RegExp(
  trWord([
    "nedir",
    "nasıl",
    "nasil",
    "neden",
    "niçin",
    "nicin",
    "açıkla",
    "acikla",
    "anlat",
    "yorumla",
    "karşılaştır",
    "karsilastir",
    "who\\s+is",
    "what\\s+is",
    "how\\s+to",
    "explain",
  ]) +
    `|${TR_LEFT}(?:fark\\s+ne|ne\\s+demek)${TR_RIGHT}`,
  "iu",
);

export function isImageGenerationPrompt(prompt: string): boolean {
  return IMAGE_PROMPT_RE.test(normalizeTr(prompt));
}

export function isImageEditPrompt(prompt: string): boolean {
  return IMAGE_EDIT_STRONG_RE.test(normalizeTr(prompt));
}

export function isContextualImageEditPrompt(prompt: string): boolean {
  const trimmed = normalizeTr(prompt);
  if (!trimmed || trimmed.length > 180) return false;
  if (isImageGenerationPrompt(trimmed)) return false;
  if (PURE_TEXT_QUESTION_RE.test(trimmed) && !IMAGE_EDIT_STRONG_RE.test(trimmed)) {
    return false;
  }
  return IMAGE_CONTEXTUAL_EDIT_RE.test(trimmed);
}

export function shouldRouteToImageEdit(
  prompt: string,
  options: { hasPriorImages: boolean; hasAttachments: boolean },
): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return options.hasAttachments;

  const hasImageContext = options.hasPriorImages || options.hasAttachments;

  // Strong edit language only routes when there is something to edit.
  if (isImageEditPrompt(trimmed)) {
    return hasImageContext;
  }

  if (hasImageContext) {
    if (isImageGenerationPrompt(trimmed)) return false;
    return isContextualImageEditPrompt(trimmed);
  }

  return false;
}

export function detectAspectRatio(
  prompt: string,
): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | undefined {
  const normalized = normalizeTr(prompt);
  if (
    /(?:^|[^\p{L}\p{N}_])(?:16:9|yatay|landscape|widescreen)(?=$|[^\p{L}\p{N}_])/iu.test(
      normalized,
    )
  ) {
    return "16:9";
  }
  if (
    /(?:^|[^\p{L}\p{N}_])(?:9:16|dikey|story|portrait|telefon|reels|shorts)(?=$|[^\p{L}\p{N}_])/iu.test(
      normalized,
    )
  ) {
    return "9:16";
  }
  if (/(?:^|[^\p{L}\p{N}_])4:3(?=$|[^\p{L}\p{N}_])/iu.test(normalized)) {
    return "4:3";
  }
  if (/(?:^|[^\p{L}\p{N}_])3:4(?=$|[^\p{L}\p{N}_])/iu.test(normalized)) {
    return "3:4";
  }
  if (
    /(?:^|[^\p{L}\p{N}_])(?:1:1|kare|square)(?=$|[^\p{L}\p{N}_])/iu.test(
      normalized,
    )
  ) {
    return "1:1";
  }
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

Production rules:
- Follow the user's subject, style, colors, composition, and any text exactly
- Do not force extra cinematic/studio style unless requested
- Prefer sharp detail, coherent lighting, and clean composition
- Avoid generic stock "AI art" clichés, warped hands/text, watermarks
- Always produce an image; never reply with text-only description`;
}

export function enhanceImageEditPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const request =
    trimmed ||
    "Referans görseli koruyarak istenen değişikliği uygula.";

  return `${request}

Image edit rules:
- Edit the attached/reference image; do not invent a new unrelated scene
- Apply size, crop, placement, color, add/remove object requests precisely
- Preserve recognizable subjects, style, and brand elements when possible
- Keep typography legible if text is involved
- Always output the edited image; never text-only`;
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

export function collectPriorReferenceImages(
  messages: ChatMessage[],
): Array<{ mimeType: string; data: string }> {
  const references: Array<{ mimeType: string; data: string }> = [];

  for (const message of [...messages].reverse()) {
    for (const image of [...(message.images ?? [])].reverse()) {
      const dataUrl = resolveMessageImageDataUrl(
        message.id,
        image.dataUrl,
      );
      if (!dataUrl) continue;

      const inline = dataUrlToInlineImage(dataUrl, image.mimeType);
      if (inline) {
        references.push(inline);
        if (references.length >= 2) return references;
      }
    }
  }

  return references;
}
