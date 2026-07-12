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
    video:
      "Çekmek istediğiniz kısa videoyu anlatın (sahne, kamera, ışık, tempo)",
    website: "Oluşturmak istediğiniz web sitesini tanımlayın",
    slides: "Oluşturmak istediğiniz slaytları tanımlayın",
    design: "Oluşturmak istediğiniz tasarımı tanımlayın",
    apps: "Geliştirmek istediğiniz uygulamayı / yazılımı tanımlayın",
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
  "Gün batımında sahil yolunda ilerleyen klasik kırmızı spor arabanın kısa sinematik videosunu oluştur.",
  "Sıcak ve davetkar bir kahve dükkanı web sitesi tasarla. Menü, konum ve online sipariş bölümleri olsun.",
  "Yatırımcılara yönelik etkileyici bir sunum hazırla. Problem, çözüm, pazar, iş modeli ve yol haritası slaytları olsun.",
  "Modern bir startup için logo ve marka kiti oluştur. Renk paleti, tipografi ve kullanım örnekleri dahil olsun.",
  "Minimal ve dönüşüm odaklı bir e-ticaret mağazası sitesi oluştur. Ürün listesi, sepet ve ödeme akışı olsun.",
  "TypeScript ile küçük bir görev yönetim API'si yaz. CRUD endpointleri ve örnek kullanım olsun.",
  "2026 yapay zeka pazar trendlerini araştır ve kaynaklı kısa bir brifing hazırla.",
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
