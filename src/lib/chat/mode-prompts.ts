import type { OrwixMode } from "@/content/orwix-content";

import {
  STUDIO_TOOL_OVERLAYS,
  type StudioToolId,
} from "@/lib/chat/studio-tools";
import { normalizeTr, trStem, trWord, TR_LEFT, TR_RIGHT } from "@/lib/chat/tr-text";

const WEBSITE_OVERLAY = `Mod: Web sitesi — üst düzey prodüksiyon.

GÖREV: Kullanıcı isteğine göre tek dosyada, tarayıcıda anında açılan profesyonel bir web sayfası üret.
Kalite çıtan: Linear / Stripe / Apple ürün sayfası seviyesi. Amatör şablon, boş “lorem”, yarım CSS/JS yasak.

ÇIKTI BİÇİMİ (zorunlu):
1) En fazla 3 kısa Türkçe cümle: ne ürettin + nasıl özelleştirilir.
2) Ardından TEK bir \`\`\`html fenced bloğu. Blok dışında kod yok.
3) Belge eksiksiz olsun: <!DOCTYPE html>, <html lang="tr">, <head> (meta viewport + title + description), <body>, kapanış etiketleri.

SAYFA MİMARİSİ (aksi belirtilmedikçe):
- Sticky / glass nav: marka + 3–5 link + birincil CTA
- Full-bleed hero: marka veya ürün adı baskın; TEK güçlü başlık; TEK kısa destek cümlesi; CTA grubu; edge-to-edge görsel düzlem (CSS gradient / pattern / SVG — inset kart hero YASAK)
- 2–4 amaçlı bölüm (her bölümün tek işi olsun): özellikler / nasıl çalışır / sosyal kanıt / fiyat veya CTA
- Footer: linkler + kısa yasal satır
- Mobil-first (≥320px); tablet/desktop için zarif büyütme

GÖRSEL DİL (zorunlu):
- Belirgin CSS değişkenleriyle tutarlı palet (--bg, --fg, --muted, --accent, --surface)
- Tipografi: Google Fonts’tan ekspresif bir display + okunaklı body (Inter/Roboto/Arial/system YASAK varsayılan olarak)
- Zemin: düz tek renk YASAK — gradient, soft mesh, subtle noise/pattern veya atmosferik arka plan
- En az 2–3 bilinçli CSS animasyon/geçiş (reveal, hover, soft float) — titreyen glow spamı yok
- Kart grid’ini varsayılan yapma; kart yalnızca etkileşim gerektiriyorsa
- Yasak klişeler: mor-on-beyaz / purple-indigo glow, krem+#terracotta serif broadsheet, abartılı glow, emoji duvarı, floating badge/sticker yığını
- Gerçekçi Türkçe ürün metni yaz (kullanıcı İngilizce istemedikçe). “Lorem ipsum” ve sahte “Acme Corp” doldurma YASAK — marka uydur ama inandırıcı olsun

TEKNİK:
- Tüm CSS <style> içinde; JS gerekirse tek <script> (vanilla). Tailwind/CDN framework sadece kullanıcı isterse.
- Semantic HTML, focus stilleri, yeterli kontrast, button/link hover
- Görseller için gerçek URL uydurma; SVG / CSS / gradient kullan
- Eksik/kesik kod bırakma. Sayfa TEK seferde çalışır olmalı.`;

const APPS_OVERLAY = `Mod: Yazılım / Uygulama — üretim kalitesinde kod.

GÖREV: Kullanıcının istediği uygulamayı veya yazılımı GERÇEKTEN çalışır şekilde teslim et. İskelet, “…”, sahte fonksiyon, yarım dosya YASAK.

ÇIKTI BİÇİMİ (zorunlu):
1) Kısa mimari (en fazla 6 madde): stack, veri modeli, önemli akışlar.
2) Ardından eksiksiz kod blokları. Her blokta dil etiketi (html/ts/tsx/js/css/py…).
3) Sonunda “Çalıştırma” adımları (1–4 satır).

ÜRÜN TİPİNE GÖRE TERCİH:
A) UI / mini-app / dashboard / araç (çoğu “uygulama oluştur” isteği):
   - TEK dosya çalışır HTML+CSS+JS (veya tek HTML içinde gömülü) üret ki önizlenebilsin.
   - \`\`\`html bloğu zorunlu; modern, okunaklı, ürün kalitesinde arayüz.
   - Durumlar: boş durum, yükleniyor, hata, başarı. Form validasyonu.
   - LocalStorage veya in-memory state ile kalıcılık/akış; en az 3 ekran/görünüm veya anlamlı tek ekran + paneller.
B) Kütüphane / API / algoritma / backend:
   - TypeScript veya kullanıcının dilini kullan; tipler, hata işleme, kenar durumlar.
   - Çalıştırılabilir örnek + net arayüz (export function / endpoint).

KALİTE ÇITASİ:
- Production hissi: spacing, tipografi, erişilebilir etiketler, klavye kullanılabilirliği
- Temiz isimlendirme; magik string yığını yok
- Yorum yalnızca kritik yerlerde
- Kullanıcı dilinde UI metni (varsayılan Türkçe)
- “Todo: implement later”, placeholder button, boş onclick YASAK

GÖRSEL (UI ise):
- Tutarlı palet + tipografi; mobil uyumlu
- Amatör gri kutu layout’lardan kaçın; premium SaaS araç hissi hedefle`;

const IMAGE_OVERLAY = `Mod: Görsel stüdyosu — prodüksiyon kalitesi.

GÖREV: Kullanıcı isteğini görsele dönüştür. Metin-only geçiştirme YASAK; asıl çıktı görsel üretimine gidecek.

KALİTE:
- Konu, stil, ışık, kompozisyon, lens/açı, renk, malzeme ve atmosferi net tut
- Kullanıcı stil belirtmediyse aşırı sinematik dayatma; istediği türü (logo/ikon/poster/foto) bozma
- Metin içeren görsellerde yazım doğru, yerleşim bilinçli olsun
- Jenerik stok “AI art” klişelerinden kaçın; özgün, net, yüksek detay hedefle`;

const VIDEO_OVERLAY = `Mod: Video stüdyosu — sinematik prodüksiyon.

GÖREV: Kullanıcının Türkçe isteğini birebir sahneye çevir. Metin-only yanıtla yetinme — asıl çıktı video.

KALİTE:
- Sahne, aksiyon, kamera hareketi, ışık, tempo, süre hissi net
- Karakter/nesne tutarlılığı; morphe/flicker hissi yaratacak belirsizlik yok
- Kullanıcı istemedikçe ekran yazısı, watermark, UI, altyazı yok
- Kısa, çekilebilir, sinematik açıklama; üretim motoruna gidecek kadar somut ol`;

const SLIDES_OVERLAY = `Mod: Sunum — yatırımcı / yönetim kalitesi.

GÖREV: Kullanıcının konusuna göre slayt slayt, ikna edici bir sunum üret.

ÇIKTI:
- Her slayt: **Başlık** → 3–6 madde → (isteğe bağlı) konuşmacı notu (1–2 cümle)
- Tipik akış (aksi belirtilmedikçe): Kapak → Problem → Çözüm → Ürün/Nasıl → Kanıt → Pazar/Model → Yol haritası → CTA
- Madde başı dolgu yok; her madde tek fikir, ölçülebilir veya somut
- Türkçe (istenirse İngilizce); profesyonel ton; emoji yığını yok
- 8–14 slayt arası (çok kısa isteklerde 6–8); gereksiz slayt şişirme
- Görsel önerisi satırı eklenebilir (tek satır: “Görsel: …”) ama asıl içerik metin netliği`;

const DESIGN_OVERLAY = `Mod: Tasarım sistemi — marka / UI spesifikasyonu.

GÖREV: Uygulanabilir bir tasarım sistemi veya marka kiti teslim et. Muğlak “modern ve şık” yetmez.

ÇIKTI (zorunlu bölümler):
1) Konsept (2–4 cümle) + konumlandırma
2) Renkler: primary/secondary/neutral/accent + hex + kullanım
3) Tipografi: display + body + mono (varsa) — font önerisi, boyut/weight skalası
4) Spacing / radius / shadow / stroke kuralları
5) Bileşen notları: button, input, card, nav (durumlar: default/hover/disabled)
6) Do / Don’t (3’er madde)
7) İsteğe bağlı: logo yönü, ikon dili, hareket ilkeleri

Yasak: Inter-only varsayılan, rastgele purple gradient önerisi, uygulanamaz fluff.`;

const RESEARCH_OVERLAY = `Mod: Araştırma — danışman kalitesi.

GÖREV: Güncel ve doğrulanabilir bilgiyle net rapor. Uydurma kaynak / sahte istatistik YASAK.

ÇIKTI YAPISI:
1) Kısa özet (3–5 cümle)
2) Ana bulgular (madde; her bulgunun dayanağı)
3) Karşılaştırma / bağlam (varsa)
4) Riskler / belirsizlikler
5) Sonuç + uygulanabilir öneriler
6) Kaynaklar (başlık + URL; search tool sonuçlarından)

Üslup: resmi ama okunur Türkçe. Çelişen verilerde söyle. Emin olmadığın rakamı kesinmiş gibi yazma.`;

const MODE_OVERLAYS: Record<Exclude<OrwixMode, "general">, string> = {
  image: IMAGE_OVERLAY,
  video: VIDEO_OVERLAY,
  website: WEBSITE_OVERLAY,
  slides: SLIDES_OVERLAY,
  design: DESIGN_OVERLAY,
  apps: APPS_OVERLAY,
  research: RESEARCH_OVERLAY,
};

export function buildSystemInstruction(
  base: string,
  mode: OrwixMode = "general",
  options?: {
    studioTool?: StudioToolId;
    brandMemoryBlock?: string | null;
  },
): string {
  const parts = [base.trim()];
  const modeOverlay = mode !== "general" ? MODE_OVERLAYS[mode] : null;
  if (modeOverlay) parts.push(modeOverlay);
  if (options?.studioTool) {
    parts.push(STUDIO_TOOL_OVERLAYS[options.studioTool]);
  }
  if (options?.brandMemoryBlock?.trim()) {
    parts.push(options.brandMemoryBlock.trim());
  }
  return parts.join("\n\n");
}

/** Higher token budget for long-form / build modes. */
export function resolveBuildMaxOutputTokens(
  mode: OrwixMode,
  options?: { studioTool?: StudioToolId; isPro?: boolean },
): number | undefined {
  const highBudget =
    mode === "website" ||
    mode === "apps" ||
    mode === "slides" ||
    mode === "design" ||
    mode === "research" ||
    options?.studioTool === "clone-studio" ||
    options?.studioTool === "content-calendar" ||
    options?.studioTool === "export-pack";
  if (!highBudget) return undefined;
  return options?.isPro ? 16384 : 8192;
}

/**
 * Expand short mode chip prompts into a production brief
 * without overriding a detailed user request.
 */
export function enhanceBuildUserPrompt(
  prompt: string,
  mode: OrwixMode,
): string {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length > 280) return trimmed;

  if (mode === "website") {
    return `${trimmed}

Prodüksiyon notları (uygula):
- Tek dosya, eksiksiz, çalışır HTML (\`\`\`html)
- Sticky nav + full-bleed hero + 2–4 amaçlı bölüm + footer
- Premium tipografi (Google Fonts), atmosferik arka plan, 2–3 incelikli animasyon
- Gerçekçi Türkçe kopya; lorem/sahte acme yok
- Mobil-first, erişilebilir, kart spamı ve AI-purple klişe yok`;
  }

  if (mode === "apps") {
    return `${trimmed}

Prodüksiyon notları (uygula):
- UI ise tek dosya çalışır HTML+CSS+JS (\`\`\`html) — hemen önizlenebilir
- Kısa mimari + eksiksiz kod + çalıştırma adımları
- Boş/yükleniyor/hata durumları ve form doğrulama
- Production kalitesinde arayüz; yarım/iskelet kod yok
- Varsayılan dil: Türkçe UI metinleri`;
  }

  if (mode === "slides") {
    return `${trimmed}

Prodüksiyon notları (uygula):
- Slayt slayt: başlık + 3–6 madde + isteğe konuşmacı notu
- İkna edici akış; dolgu maddesi yok
- 8–14 slayt (kısa istekte 6–8); profesyonel Türkçe`;
  }

  if (mode === "design") {
    return `${trimmed}

Prodüksiyon notları (uygula):
- Renk (hex) + tipografi + spacing/radius + bileşen durumları
- Do/Don’t listesi; uygulanabilir sistem, fluff yok`;
  }

  if (mode === "research") {
    return `${trimmed}

Araştırma notları (uygula):
- Özet → bulgular → bağlam → riskler → öneriler → kaynaklar (URL)
- Uydurma rakam/kaynak yok; belirsizliği açıkça yaz`;
  }

  return trimmed;
}

const RESEARCH_RE = new RegExp(
  [
    trWord([
      "araştır",
      "arastir",
      "research",
      "gündem",
      "gundem",
      "istatistik",
      "incele",
    ]),
    `${TR_LEFT}(?:araştırma\\s+yap|arastirma\\s+yap|web'?de\\s+ara|google'?da\\s+ara|netten\\s+bak|güncel\\s+(?:haber|fiyat|veri|durum)|guncel\\s+(?:haber|fiyat|veri|durum)|haberleri|kaynaklarla|kanıtlarla|kanitlarla|piyasa\\s+fiyat|bugün\\s+ne|bugun\\s+ne|son\\s+durum|fiyatı?\\s+ne|fiyati?\\s+ne|kaç\\s+para|kac\\s+para|ne\\s+kadar\\s+(?:oldu|eder)|şu\\s+an\\s+ne|su\\s+an\\s+ne|202[5-9]\\s+(?:yılı|yili|veri))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const CODE_RE = new RegExp(
  [
    `${TR_LEFT}(?:kod\\s+yaz|program\\s+yaz|uygulama\\s+yaz|yazılım\\s+yaz|yazilim\\s+yaz|script\\s+yaz|fonksiyon\\s+yaz|api\\s+yaz|debug\\s+et|refactor|unit\\s+test|typescript|javascript|python(?:\\s+kod)?|react(?:\\s+komponent)?|next\\.?js|sql(?:\\s+sorgu)?|backend|frontend|mobil\\s+uygulama|todo\\s+app)${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const WEBSITE_RE = new RegExp(
  [
    `${trStem([
      "website",
      "web\\s*sitesi",
      "landing(?:\\s*page)?",
      "açılış\\s*sayfa",
      "acilis\\s*sayfa",
      "html\\s*sayfa",
      "portföy\\s*site",
      "portfoy\\s*site",
      "e-?ticaret\\s*site",
      "shopify",
      "saas\\s*site",
      "kurumsal\\s*site",
      "blog\\s*site",
    ])}[\\s\\S]{0,80}${trStem([
      "oluştur",
      "olustur",
      "yap",
      "üret",
      "uret",
      "tasarla",
      "hazırla",
      "hazirla",
      "kodla",
    ])}`,
    `${TR_LEFT}(?:web\\s*sitesi\\s+(?:oluştur|olustur|yap)|site\\s+(?:oluştur|olustur|yap)|landing\\s*page\\s+(?:yap|oluştur|olustur))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const SLIDES_RE = new RegExp(
  [
    `${trStem([
      "slayt",
      "sunum",
      "powerpoint",
      "ppt",
      "deck",
      "prezentasyon",
      "sunu",
      "yatırımcı\\s*sunum",
      "yatirimci\\s*sunum",
    ])}[\\s\\S]{0,80}${trStem([
      "oluştur",
      "olustur",
      "yap",
      "üret",
      "uret",
      "hazırla",
      "hazirla",
      "tasarla",
    ])}`,
    `${TR_LEFT}(?:slayt\\s+(?:oluştur|olustur|yap)|sunum\\s+(?:hazırla|hazirla|yap))${TR_RIGHT}`,
  ].join("|"),
  "iu",
);

const APPS_RE = new RegExp(
  [
    CODE_RE.source,
    `${trStem([
      "uygulama",
      "app",
      "yazılım",
      "yazilim",
      "program",
    ])}[\\s\\S]{0,80}${trStem([
      "yaz",
      "oluştur",
      "olustur",
      "yap",
      "geliştir",
      "gelistir",
      "kodla",
    ])}`,
  ].join("|"),
  "iu",
);

export function detectPromptMode(prompt: string): OrwixMode | null {
  const text = normalizeTr(prompt);
  if (!text) return null;
  if (WEBSITE_RE.test(text)) return "website";
  if (SLIDES_RE.test(text)) return "slides";
  if (APPS_RE.test(text)) return "apps";
  if (RESEARCH_RE.test(text)) return "research";
  return null;
}

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
  return RESEARCH_RE.test(normalizeTr(prompt));
}

export function shouldEnableCodeExecution(
  prompt: string,
  mode: OrwixMode = "general",
): boolean {
  if (mode === "apps") return true;
  return CODE_RE.test(normalizeTr(prompt));
}
