export const ORWIX_META = {
  title: "Orwix: Yapay Zeka ile Görsel, Web ve Uygulama",
  description:
    "Orwix ile stüdyo kalitesinde görseller üretin; web sitesi, slayt ve uygulamaları tek komutla hayata geçirin.",
} as const;

export type OrwixMode =
  | "general"
  | "image"
  | "website"
  | "slides"
  | "design"
  | "apps";

export const ORWIX_BANNER =
  "Orwix — Stüdyo kalitesinde görsel üretin; slayt, web ve uygulama geliştirin.";

export const ORWIX_HEADER_NAV = {
  dropdowns: ["Özellikler", "Çözümler", "Kaynaklar"] as const,
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
    website: "Oluşturmak istediğiniz web sitesini tanımlayın",
    slides: "Oluşturmak istediğiniz slaytları tanımlayın",
    design: "Oluşturmak istediğiniz tasarımı tanımlayın",
    apps: "Geliştirmek istediğiniz uygulamayı tanımlayın",
  },
  modeLabels: {
    general: null,
    image: "Görsel",
    website: "Web Sitesi",
    slides: "Slaytlar",
    design: "Tasarım",
    apps: "Uygulama",
  },
} as const;

export const ORWIX_SUGGESTIONS: ReadonlyArray<{
  label: string;
  mode: OrwixMode;
  icon: "image" | "slides" | "website" | "design" | "apps";
}> = [
  { label: "Görsel oluştur", mode: "image", icon: "image" },
  { label: "Slaytlar oluştur", mode: "slides", icon: "slides" },
  { label: "Web sitesi oluştur", mode: "website", icon: "website" },
  { label: "Tasarım", mode: "design", icon: "design" },
  { label: "Uygulama geliştir", mode: "apps", icon: "apps" },
];

export const ORWIX_MORE_SUGGESTIONS = [
  "Araştırma yap",
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

export const ORWIX_TEMPLATES = [
  {
    primary: "E-ticaret",
    secondary: "Shopify",
    prompt: "E-ticaret Shopify web sitesi oluştur",
  },
  { primary: "Açılış Sayfası", prompt: "Açılış Sayfası oluştur" },
  { primary: "Kontrol Paneli", prompt: "Kontrol Paneli oluştur" },
  { primary: "Portföy", prompt: "Portföy web sitesi oluştur" },
  { primary: "Kurumsal", prompt: "Kurumsal web sitesi oluştur" },
  { primary: "SaaS", prompt: "SaaS web sitesi oluştur" },
  {
    primary: "Biyografi bağlantısı",
    prompt: "Biyografi bağlantısı sayfası oluştur",
  },
  { primary: "Blog", prompt: "Blog web sitesi oluştur" },
  { primary: "Mini Oyunlar", prompt: "Mini Oyunlar web sitesi oluştur" },
  { primary: "Verimlilik", prompt: "Verimlilik web sitesi oluştur" },
] as const;

export const ORWIX_FOOTER = {
  tagline: "Hayal et. Söyle. Oluşsun.",
  subtitle: "Bugün ne inşa edelim?",
  surpriseLabel: "Şaşırt beni",
  copyright: "© 2026 Orwix",
} as const;

export const ORWIX_SURPRISE_PROMPTS = [
  "Neon ışıklı yağmurlu bir şehirde duran futuristik spor araba, sinematik gece fotoğrafı oluştur.",
  "Sıcak ve davetkar bir kahve dükkanı web sitesi tasarla. Menü, konum ve online sipariş bölümleri olsun.",
  "Yatırımcılara yönelik etkileyici bir sunum hazırla. Problem, çözüm, pazar, iş modeli ve yol haritası slaytları olsun.",
  "Modern bir startup için logo ve marka kiti oluştur. Renk paleti, tipografi ve kullanım örnekleri dahil olsun.",
  "Minimal ve dönüşüm odaklı bir e-ticaret mağazası sitesi oluştur. Ürün listesi, sepet ve ödeme akışı olsun.",
  "Erken aşama bir SaaS startup için yüksek dönüşümlü landing page tasarla. Hero, özellikler ve CTA bölümleri olsun.",
  "Tarayıcıda oynanabilir basit bir mini oyun fikri geliştir. Oynanış mekaniği, skor sistemi ve arayüz taslağı olsun.",
  "Analitik odaklı bir yönetim paneli tasarla. KPI kartları, grafikler ve filtreleme alanı olsun.",
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
