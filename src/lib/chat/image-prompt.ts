import type { ChatMessage } from "@/types/chat.types";

import { resolveMessageImageDataUrl } from "@/lib/chat/session-image-cache";

const IMAGE_PROMPT_RE =
  /\b(resim|görsel|image|picture|logo|illustration|illüstrasyon|afiş|poster|wallpaper|arkaplan|background|fotoğraf|fotograf|banner|thumbnail|kapak|ikon|icon|mockup|render)\b[\s\S]{0,80}\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla|hazırla|tasarım)\b|\b(çiz|oluştur|yap|üret|generate|create|draw|tasarla)\b[\s\S]{0,80}\b(resim|görsel|image|picture|logo|illustration|illüstrasyon|afiş|poster|fotoğraf|fotograf|banner|kapak|ikon|icon)\b|\b(bana\s+bir\s+(resim|görsel)|draw\s+(me\s+)?an?\s+(image|picture)|generate\s+an?\s+(image|picture)|create\s+an?\s+(image|picture)|make\s+(me\s+)?an?\s+(image|picture|logo)|görsel\s+üret|image\s+gen|picture\s+of)\b|\b(çiz\s+bana|bana\s+çiz)\b/i;

const IMAGE_EDIT_RE =
  /\b(düzenle|edit|değiştir|varyasyon|yeniden\s+çiz|bu\s+görsel|şu\s+görsel|önceki\s+görsel|make\s+it|change\s+it|add\s+text|yazı\s+ekle|üzerine\s+yaz|renk\s+değiştir|arka\s+plan|background\s+change|remove|kaldır|ekle|sil|çıkar|taşı|yerleştir|koy)\b|\b(bunu|şunu|onu|bunun|şunun)\s+\S{0,24}\s*(yap|koy|ekle|değiştir|kaldır|uzat|kısalt|uzalt|daralt|genişlet)\b|\b(görselde|resimde|fotoda|fotoğrafta|üzerinde|içinde)\b.{0,40}\b(yaz|ekle|koy|yap|değiştir|kaldır|sil|taşı)\b|\b(boyunu|genişliğini|yüksekliğini|enini|boyutunu|oranı|aspect|genişliği|yüksekliği)\b.{0,24}\b(uzat|kısalt|uzalt|uzun|kısa|daralt|genişlet|küçült|büyüt|artır|azalt|değiştir|ayarla)\b|\b(uzat|kısalt|uzalt|daralt|genişlet|küçült|büyüt|crop|kırp)\b.{0,24}\b(boy|genişlik|yükseklik|görsel|resim|foto)\b|\b(oraya|buraya|şuraya|sol|sağ|üst|alt|ortaya|kenara)\b.{0,32}\b(koy|ekle|taşı|yerleştir|yaz|getir|bunu|şunu)\b|\b(daha\s+(kısa|uzun|geniş|dar|büyük|küçük|koyu|açık))\b/i;

/** Short follow-up commands when a reference image is already in context. */
const IMAGE_CONTEXTUAL_EDIT_RE =
  /\b(boy|genişlik|yükseklik|en|oran|crop|kırp|zoom|yakınlaştır|uzaklaştır|filtre|parlak|kontrast|gölge|blur|bulanık)\b|\b(uzat|kısalt|uzalt|daralt|genişlet|küçült|büyüt|artır|azalt|koy|ekle|sil|kaldır|taşı|yerleştir|değiştir|düzenle|ayarla|düzelt|iyileştir|güncelle)\b|\b(oraya|buraya|şuraya|sol|sağ|üst|alt|ortaya)\b|\b(bunu|şunu|onu|bunun|şunun)\b|\b(daha\s+(kısa|uzun|geniş|dar|büyük|küçük))\b/i;

const PURE_TEXT_QUESTION_RE =
  /\b(nedir|nasıl|neden|niçin|açıkla|anlat|yorumla|karşılaştır|fark\s+ne|ne\s+demek|who\s+is|what\s+is|how\s+to|explain)\b/i;

export function isImageGenerationPrompt(prompt: string): boolean {
  return IMAGE_PROMPT_RE.test(prompt.trim());
}

export function isImageEditPrompt(prompt: string): boolean {
  return IMAGE_EDIT_RE.test(prompt.trim());
}

export function isContextualImageEditPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length > 180) return false;
  if (isImageGenerationPrompt(trimmed)) return false;
  if (PURE_TEXT_QUESTION_RE.test(trimmed) && !IMAGE_EDIT_RE.test(trimmed)) {
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

  if (isImageEditPrompt(trimmed)) return true;

  if (options.hasPriorImages || options.hasAttachments) {
    if (isImageGenerationPrompt(trimmed)) return false;
    return isContextualImageEditPrompt(trimmed);
  }

  return false;
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

export function enhanceImageEditPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  const request =
    trimmed ||
    "Referans görseli koruyarak istenen değişikliği uygula.";

  return `${request}

Görsel düzenleme kuralları:
- Ekteki / referans görseli temel al; sıfırdan farklı bir sahne üretme
- Boyut, oran, yerleşim, renk veya nesne ekleme/çıkarma isteklerini görselde uygula
- Görselin genel stilini ve tanınabilir öğelerini mümkün olduğunca koru
- Yanıtta mutlaka düzenlenmiş görsel üret; sadece metin açıklaması yazma`;
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
