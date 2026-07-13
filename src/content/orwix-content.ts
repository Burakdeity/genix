export const ORWIX_META = {
  title: "Orwix: Yapay Zeka ile Görsel, Video, Web ve Yazılım",
  description:
    "Orwix ile stüdyo kalitesinde görsel ve video üretin; web, slayt, uygulama ve yazılımı tek komutla hayata geçirin. Google Search destekli derin araştırma.",
} as const;

export type OrwixMode =
  | "general"
  | "image"
  | "video"
  | "website"
  | "slides"
  | "design"
  | "apps"
  | "research";

export const ORWIX_BANNER =
  "Stüdyo kalitesinde görsel, video, web ve yazılım — tek komutla.";

export type OrwixNavItem = {
  label: string;
  description?: string;
  mode?: OrwixMode;
  prompt?: string;
  href?: string;
};

export const ORWIX_HEADER_NAV = {
  dropdowns: [
    {
      label: "Özellikler",
      items: [
        {
          label: "Görsel üretimi",
          description: "Logo, poster, ürün fotoğrafı",
          mode: "image" as const,
        },
        {
          label: "Video üretimi",
          description: "Kısa sinematik klipler",
          mode: "video" as const,
        },
        {
          label: "Web sitesi",
          description: "Açılış sayfası ve HTML",
          mode: "website" as const,
        },
        {
          label: "Slaytlar",
          description: "Sunum ve yatırımcı deck",
          mode: "slides" as const,
        },
        {
          label: "Araştırma",
          description: "Güncel kaynaklarla yanıt",
          mode: "research" as const,
        },
        {
          label: "Uygulama / yazılım",
          description: "Kod ve ürün iskeleti",
          mode: "apps" as const,
        },
      ] satisfies ReadonlyArray<OrwixNavItem>,
    },
  ],
} as const;

export const ORWIX_HERO = {
  title: "Sizin için ne yapabilirim?",
  composerLabel: "Ne inşa etmek istersiniz?",
  referenceButton: "Referans görsel ekle",
  figmaImport: "Figma'dan içe aktar",
  language: "Türkçe",
  placeholders: {
    general: "Bir görev atayın veya herhangi bir şey sorun",
    image:
      "Üretmek istediğiniz görseli detaylı anlatın (ör. sinematik ürün fotoğrafı, logo, poster)",
    video:
      "Çekmek istediğiniz kısa videoyu anlatın (sahne, kamera, ışık, tempo)",
    website:
      "Örn: İstanbul’a özel premium kahve markası için açılış sayfası — hero, menü, mağazalar, sipariş CTA",
    slides: "Oluşturmak istediğiniz slaytları tanımlayın",
    design: "Oluşturmak istediğiniz tasarımı tanımlayın",
    apps:
      "Örn: Gider takip uygulaması — ekle/sil, kategoriler, toplamlar, localStorage, tek dosya HTML",
    research: "Araştırmak istediğiniz konuyu yazın — güncel kaynaklarla yanıtlanır",
  },
  modeLabels: {
    general: null,
    image: "Görsel",
    video: "Video",
    website: "Web Sitesi",
    slides: "Slaytlar",
    design: "Tasarım",
    apps: "Yazılım",
    research: "Araştırma",
  },
} as const;

export const ORWIX_SUGGESTIONS: ReadonlyArray<{
  label: string;
  mode: OrwixMode;
  icon: "image" | "video" | "slides" | "website" | "design" | "apps" | "research";
}> = [
  { label: "Görsel oluştur", mode: "image", icon: "image" },
  { label: "Video oluştur", mode: "video", icon: "video" },
  { label: "Araştırma yap", mode: "research", icon: "research" },
  { label: "Web sitesi oluştur", mode: "website", icon: "website" },
  { label: "Uygulama / yazılım", mode: "apps", icon: "apps" },
];

export const ORWIX_MORE_SUGGESTIONS = [
  "Slaytlar oluştur",
  "Tasarım sistemi kur",
  "Belge özetle",
  "Kod yaz",
  "Veri analizi",
  "E-posta yaz",
  "Çeviri yap",
] as const;

export const ORWIX_IMAGE_TEMPLATES = [
  {
    primary: "Logo",
    prompt:
      "Modern minimal bir teknoloji markası için vektörel logo oluştur. Temiz, premium, beyaz arka plan.",
  },
  {
    primary: "Ürün fotoğrafı",
    prompt:
      "Lüks bir ürün için stüdyo kalitesinde sinematik ürün fotoğrafı oluştur. Softbox ışık, yüksek detay.",
  },
  {
    primary: "Poster",
    prompt:
      "Cesur tipografi ve güçlü kompozisyonla 9:16 dikey etkinlik posteri oluştur.",
  },
  {
    primary: "Karakter",
    prompt:
      "Yüksek detaylı 3D karakter illüstrasyonu oluştur. Sinematik ışık, premium render.",
  },
  {
    primary: "Kapak",
    prompt:
      "16:9 yatay dergi kapağı görseli oluştur. Editorial fotoğraf dili, keskin kompozisyon.",
  },
  {
    primary: "İkon seti",
    prompt:
      "Aynı stilde 4 adet uygulama ikonu içeren bir grid görseli oluştur. Minimal, tutarlı çizgi kalınlığı.",
  },
] as const;

export const ORWIX_VIDEO_TEMPLATES = [
  {
    primary: "Ürün videosu",
    prompt:
      "Modern bir kulaklığın 360 derece stüdyo tanıtım videosunu oluştur. Softbox ışık, yavaş kamera pani.",
  },
  {
    primary: "Şehir drone",
    prompt:
      "Gün batımında neon ışıklı bir şehir üzerinden sinematik drone çekimi videosu oluştur.",
  },
  {
    primary: "Doğa",
    prompt:
      "Sisli ormanda yavaş ilerleyen kamera ile atmosferik kısa video oluştur. Doğal ses hissi.",
  },
  {
    primary: "Reels",
    prompt:
      "9:16 dikey, dinamik geçişli kısa sosyal medya reels videosu oluştur. Enerjik tempo.",
  },
] as const;

export const ORWIX_TEMPLATES = [
  {
    primary: "E-ticaret",
    secondary: "Shopify",
    prompt:
      "Modern bir ev tekstili markası için premium Shopify tarzı e-ticaret açılış + vitrin sayfası oluştur. Kategoriler, öne çıkan ürünler, güven rozetleri, sepete ekle CTA. Türkçe, mobil-first, tek dosya HTML.",
  },
  {
    primary: "Açılış Sayfası",
    prompt:
      "B2B SaaS ürünü için dönüşüm odaklı açılış sayfası oluştur. Hero + özellikler + nasıl çalışır + fiyat + SSS + CTA. Marka adı uydur; ciddi ama sıcak ton; tek dosya HTML.",
  },
  {
    primary: "Kontrol Paneli",
    prompt:
      "Finans / analitik kontrol paneli (dashboard) arayüzü oluştur. Kenar menü, KPI kartları, grafik alanları (SVG), tablo ve filtreler. Koyu profesyonel tema; tek dosya HTML+JS.",
  },
  {
    primary: "Portföy",
    prompt:
      "Yaratıcı bir ürün tasarımcısı için kişisel portföy sitesi oluştur. Büyük tipografi, seçilmiş işler grid'i, hakkında, iletişim. Karakterli tipografi ve atmosferik zemin; tek dosya HTML.",
  },
  {
    primary: "Kurumsal",
    prompt:
      "İstanbul merkezli bir danışmanlık firması için kurumsal web sitesi oluştur. Hakkımızda, hizmetler, ekip, referanslar, iletişim. Güven veren, sade premium dil; tek dosya HTML.",
  },
  {
    primary: "SaaS",
    prompt:
      "Geliştirici araçları SaaS ürünü için ürün sitesi oluştur. Ürün demosu alanı, entegrasyonlar, fiyatlandırma (3 plan), müşteri alıntıları, güçlü CTA. Tek dosya HTML.",
  },
  {
    primary: "Biyografi bağlantısı",
    prompt:
      "İçerik üreticisi için link-in-bio / biyografi bağlantı sayfası oluştur. Avatar, kısa bio, sosyal ikonlar, 6 düzenli CTA linki. Mobil odaklı, şık; tek dosya HTML.",
  },
  {
    primary: "Blog",
    prompt:
      "Düşünce liderliği blogu ana sayfası oluştur. Öne çıkan yazı, kategori filtreleri, yazı listesi, bülten kaydı. Okunaklı tipografi; tek dosya HTML.",
  },
] as const;

export const ORWIX_APP_TEMPLATES = [
  {
    primary: "Görev listesi",
    prompt:
      "Modern bir todo / görev uygulaması oluştur. Ekle, tamamla, sil, filtrele (tümü/aktif/biten), localStorage kalıcılığı. Premium UI; tek dosya HTML+CSS+JS.",
  },
  {
    primary: "Gider takip",
    prompt:
      "Kişisel gider takip uygulaması oluştur. Harcama ekle (tutar, kategori, not), toplamlar, kategori dağılımı, silme. Türkçe UI; tek dosya HTML+JS.",
  },
  {
    primary: "Not defteri",
    prompt:
      "Hızlı not defteri uygulaması oluştur. Not listesi + düzenleyici, arama, pinleme, localStorage. Temiz yazı deneyimi; tek dosya HTML.",
  },
  {
    primary: "Pomodoro",
    prompt:
      "Pomodoro odak zamanlayıcısı oluştur. 25/5 döngü, başlat/duraklat/sıfırla, tur sayacı, isteğe bağlı ses bitiş sinyali. Minimal ama premium; tek dosya HTML.",
  },
  {
    primary: "Admin panel",
    prompt:
      "Küçük işletme admin paneli UI’si oluştur. Giriş sonrası dashboard, kullanıcı tablosu (örnek veri), modal ile ekle/düzenle. Tek dosya HTML+JS.",
  },
  {
    primary: "Chat UI",
    prompt:
      "Gerçekçi bir mesajlaşma arayüzü oluştur. Konuşma listesi, baloncuklar, yazıyor… durumu, gönder. Sahte bot yanıtı ekle; tek dosya HTML+JS.",
  },
] as const;

export const ORWIX_FOOTER = {
  tagline: "Hayal et. Söyle. Oluşsun.",
  subtitle: "Bugün hangi markayı doğuralım?",
  surpriseLabel: "Marka doğur",
  copyright: "© 2026 Orwix",
} as const;

export const ORWIX_SURPRISE_PROMPTS = [
  // Kept for backward compatibility; footer now uses createBrandBirth().
  "Sıfırdan uydurma bir marka icat et ve premium açılış sayfası HTML üret.",
] as const;

export const ORWIX_COOKIE = {
  title: "Kullanıcı deneyiminizi geliştirmek için çerezler kullanıyoruz.",
  bodyPrefix:
    "Kullanılan tüm çerezlerin tam bir genel görünümü için lütfen bakın.",
  policyLabel: "Çerez Politikamıza",
  policyHref: "#cerez-politikasi",
  customize: "Özelleştir",
  rejectAll: "Hepsini reddet",
  acceptAll: "Hepsini kabul et",
} as const;
