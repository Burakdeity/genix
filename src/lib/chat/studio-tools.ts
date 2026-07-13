import type { OrwixMode } from "@/content/orwix-content";

export type StudioToolId =
  | "prompt-enhance"
  | "voice-brand-brief"
  | "clone-studio"
  | "image-to-prompt"
  | "ocr-rewrite"
  | "ab-headlines"
  | "brand-memory"
  | "content-calendar"
  | "export-pack";

export type StudioTool = {
  id: StudioToolId;
  label: string;
  description: string;
  mode: OrwixMode;
  /** Fill composer; user edits then sends (unless starter is complete). */
  starter: string;
  proOnly?: boolean;
  /** Opens live voice instead of chat */
  opensVoice?: boolean;
};

export const ORWIX_STUDIO_TOOLS: readonly StudioTool[] = [
  {
    id: "prompt-enhance",
    label: "Prompt geliştirici",
    description: "Zayıf isteği prodüksiyon promptuna çevir",
    mode: "general",
    starter:
      "Aşağıdaki kısa isteğimi stüdyo kalitesinde, ayrıntılı bir üretim promptuna dönüştür. Önce geliştirilmiş promptu ver, sonra 3 kısa varyasyon ekle:\n\n",
  },
  {
    id: "voice-brand-brief",
    label: "Sesli marka brifingi",
    description: "Konuşarak marka brief’i çıkar",
    mode: "general",
    starter: "",
    opensVoice: true,
  },
  {
    id: "clone-studio",
    label: "Klon stüdyo",
    description: "Rakip URL’sinden özgün açılış sayfası",
    mode: "website",
    starter:
      "Şu rakip / referans siteyi incele (stil, yapı, mesaj). Aynı sektörde özgün, daha premium tek dosyalık HTML açılış sayfası üret. Kopyalama; ilham al:\n\nURL: ",
  },
  {
    id: "image-to-prompt",
    label: "Görselden prompt",
    description: "Yüklenen görseli tersine mühendislik et",
    mode: "general",
    starter:
      "Ekteki görseli analiz et ve aynı tarzda yeniden üretilebilir, ayrıntılı bir Türkçe görsel promptu yaz. Konu, stil, ışık, kompozisyon, renk ve kamera notlarını ekle.",
  },
  {
    id: "ocr-rewrite",
    label: "Metin düzelt (OCR)",
    description: "Afişteki yazıyı oku ve yeniden yaz",
    mode: "image",
    starter:
      "Ekteki görseldeki tüm metinleri oku (OCR). Yazım hatalarını düzelt. Ardından aynı yerleşimi koruyarak metni daha güçlü bir sloganla yeniden yazılmış yeni görsel üret.",
  },
  {
    id: "ab-headlines",
    label: "A/B başlık seti",
    description: "10 CTA + headline varyasyonu",
    mode: "general",
    starter:
      "Şu ürün / marka için açılış sayfasına uygun 10 A/B başlık + alt metin + CTA çifti üret. Ton: net, dönüşüm odaklı, Türkçe:\n\n",
  },
  {
    id: "brand-memory",
    label: "Marka hafızası",
    description: "Logo, renk ve sesi kaydet (Pro)",
    mode: "design",
    starter:
      "Marka kimliğimi kaydetmek için yapılandır: isim, slogan, 3 ana renk (hex), tipografi hissi, ses/ton (3 sıfat), yasaklar. Sonunda kısa bir marka kartı çıkar.\n\n",
    proOnly: true,
  },
  {
    id: "content-calendar",
    label: "İçerik takvimi",
    description: "7 günlük post/reels planı (Pro)",
    mode: "general",
    starter:
      "Markam için 7 günlük içerik takvimi oluştur. Her gün: platform, format (post/reels/story), başlık, caption, görsel/video brief, CTA. Marka:\n\n",
    proOnly: true,
  },
  {
    id: "export-pack",
    label: "Ticari export paketi",
    description: "Dosya listesi + kullanım lisans notu (Pro)",
    mode: "general",
    starter:
      "Ürettiğim asset’ler için ticari export paketi hazırla: önerilen dosya adları (PNG/SVG/MP4/HTML), klasör yapısı, boyutlar, ticari kullanım notu ve müşteriye teslim checklist’i. Proje:\n\n",
    proOnly: true,
  },
] as const;

export const STUDIO_TOOL_OVERLAYS: Record<StudioToolId, string> = {
  "prompt-enhance": `Mod: Prompt laboratuvarı — stüdyo seviyesi.

Kullanıcının kısa isteğini prodüksiyon kalitesinde, motora yapıştırılabilir bir prompta yükselt.
Çıktı: (1) tek güçlü ana prompt (2) 3 kısa varyasyon (açı/ışık/stil farkı).
Meta sohbet yok. Kullanıcının niyetini bozma; belirsizlikte en iyi yaratıcı varsayımı seç.`,
  "voice-brand-brief": `Mod: Sesli marka brifingi özeti. Konuşmadan net marka brief’i çıkar (isim, ton, renk, hedef, ilk üretim).`,
  "clone-studio": `Mod: Klon stüdyo — özgün premium açılış.

Referans URL/açıklamadan YALNIZCA stil ve yapı ilhamı al; birebir kopyalama YASAK.
Tek dosya eksiksiz HTML (\`\`\`html) üret: sticky nav, full-bleed hero, 2–4 amaçlı bölüm, footer.
Daha premium tipografi + atmosferik zemin + 2–3 incelikli motion.
Türkçe gerçekçi kopya; lorem yok. Kısa özet (≤3 cümle) + kod.`,
  "image-to-prompt": `Mod: Görselden prompt — tersine mühendislik.

Ekteki görseli yeniden üretilebilir Türkçe prompta çevir:
konu, stil, ışık, kompozisyon, kamera, renk, malzeme, atmosfer, varsa yazı.
Tek güçlü prompt + 2 kısa varyasyon. Uydurma detay ekleme; görüneni net yaz.`,
  "ocr-rewrite": `Mod: OCR + görsel metin yenileme.

Metni oku, yazım düzelt, sloganı güçlendir; yerleşimi koruyarak düzenlenmiş görsel üret.
Okunamayan kısımları uydurma; emin değilsen belirt.`,
  "ab-headlines": `Mod: Dönüşüm yazarlığı — A/B seti.

10 satır: Başlık | Alt metin | CTA. Türkçe, net, clickbait abartısı yok.
Farklı açıları dene (fayda, kanıt, aciliyet, merak). Tablo veya numaralı liste.`,
  "brand-memory": `Mod: Marka hafızası kurulum.

Yapılandırılmış marka kartı: isim, slogan, 3+ hex renk, tipografi, ses/ton (3 sıfat), yasaklar.
Kısa, kaydedilebilir format; fluff yok.`,
  "content-calendar": `Mod: İçerik stratejisi — 7 gün.

Her gün: platform, format (post/reels/story), başlık, caption, görsel/video brief, CTA, amaç.
Uygulanabilir olsun; boş slogan satırı doldurma.`,
  "export-pack": `Mod: Ticari teslimat paketi.

Klasör yapısı, dosya adları (PNG/SVG/MP4/HTML), boyutlar, lisans/ticari kullanım notu, müşteri checklist.
Eksiksiz teslim listesi; belirsiz “gerekirse ekle” yok.`,
};

export function getStudioTool(id: StudioToolId | undefined): StudioTool | null {
  if (!id) return null;
  return ORWIX_STUDIO_TOOLS.find((tool) => tool.id === id) ?? null;
}
