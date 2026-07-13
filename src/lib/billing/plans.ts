/** Client-side plan limits — Pro unlocks via Stripe Checkout ($20/mo). */

export const ORWIX_PRO_PRICE_USD = 20;
export const ORWIX_PRO_PRICE_CENTS = ORWIX_PRO_PRICE_USD * 100;
export const ORWIX_PRO_PRICE_LABEL = `$${ORWIX_PRO_PRICE_USD} / ay`;

export const PLAN_LIMITS = {
  guest: {
    imagesPerDay: 1,
    videosPerDay: 1,
    voiceMinutesPerDay: 2,
    brandBirthPerDay: 1,
  },
  free: {
    imagesPerDay: 5,
    videosPerDay: 1,
    voiceMinutesPerDay: 10,
    brandBirthPerDay: 1,
  },
  pro: {
    imagesPerDay: 50,
    videosPerDay: 5,
    voiceMinutesPerDay: 90,
    brandBirthPerDay: 10,
  },
} as const;

/** Re-export friendly names used across UI / stores */
export const GUEST_IMAGE_LIMIT = PLAN_LIMITS.guest.imagesPerDay;
export const FREE_SIGNED_IN_IMAGE_LIMIT = PLAN_LIMITS.free.imagesPerDay;
export const PRO_IMAGE_LIMIT = PLAN_LIMITS.pro.imagesPerDay;

export const GUEST_VIDEO_LIMIT = PLAN_LIMITS.guest.videosPerDay;
export const FREE_SIGNED_IN_VIDEO_LIMIT = PLAN_LIMITS.free.videosPerDay;
export const PRO_VIDEO_LIMIT = PLAN_LIMITS.pro.videosPerDay;

export const GUEST_VOICE_MINUTES = PLAN_LIMITS.guest.voiceMinutesPerDay;
export const FREE_VOICE_MINUTES = PLAN_LIMITS.free.voiceMinutesPerDay;
export const PRO_VOICE_MINUTES = PLAN_LIMITS.pro.voiceMinutesPerDay;

export const GUEST_BRAND_BIRTH_PER_DAY = PLAN_LIMITS.guest.brandBirthPerDay;
export const FREE_BRAND_BIRTH_PER_DAY = PLAN_LIMITS.free.brandBirthPerDay;
export const PRO_BRAND_BIRTH_PER_DAY = PLAN_LIMITS.pro.brandBirthPerDay;

export const PRO_BENEFITS = [
  `Günde ${PRO_IMAGE_LIMIT} görsel (ücretsizde ${FREE_SIGNED_IN_IMAGE_LIMIT})`,
  `Günde ${PRO_VIDEO_LIMIT} video (ücretsizde ${FREE_SIGNED_IN_VIDEO_LIMIT})`,
  "Kalite modeli ve 2K görsel",
  `Günde ${PRO_VOICE_MINUTES} dk canlı ses (ücretsizde ${FREE_VOICE_MINUTES} dk)`,
  `Günde ${PRO_BRAND_BIRTH_PER_DAY} Marka doğur (ücretsizde ${FREE_BRAND_BIRTH_PER_DAY})`,
  "Marka hafızası, içerik takvimi, ticari export",
  "Ticari kullanım hakkı",
] as const;

export const PLAN_COMPARISON = [
  {
    feature: "Fiyat",
    free: "Ücretsiz",
    pro: ORWIX_PRO_PRICE_LABEL,
  },
  {
    feature: "Görsel / gün",
    free: `${FREE_SIGNED_IN_IMAGE_LIMIT}`,
    pro: `${PRO_IMAGE_LIMIT}`,
  },
  {
    feature: "Video / gün",
    free: `${FREE_SIGNED_IN_VIDEO_LIMIT}`,
    pro: `${PRO_VIDEO_LIMIT}`,
  },
  {
    feature: "Canlı ses / gün",
    free: `${FREE_VOICE_MINUTES} dk`,
    pro: `${PRO_VOICE_MINUTES} dk`,
  },
  {
    feature: "Marka doğur / gün",
    free: `${FREE_BRAND_BIRTH_PER_DAY}`,
    pro: `${PRO_BRAND_BIRTH_PER_DAY}`,
  },
  {
    feature: "Kalite modeli + 2K",
    free: "Yok",
    pro: "Var",
  },
  {
    feature: "Ticari kullanım",
    free: "Kişisel",
    pro: "Dahil",
  },
  {
    feature: "Marka hafızası + stüdyo Pro",
    free: "Yok",
    pro: "Var",
  },
] as const;

export const PLAN_CARD_FEATURES = {
  free: [
    { label: `${FREE_SIGNED_IN_IMAGE_LIMIT} görsel / gün`, included: true },
    { label: `${FREE_SIGNED_IN_VIDEO_LIMIT} video / gün`, included: true },
    { label: `${FREE_VOICE_MINUTES} dk canlı ses / gün`, included: true },
    { label: `${FREE_BRAND_BIRTH_PER_DAY} Marka doğur / gün`, included: true },
    { label: "Kalite modeli + 2K", included: false },
    { label: "Marka hafızası / export", included: false },
    { label: "Ticari kullanım", included: false },
  ],
  pro: [
    { label: `${PRO_IMAGE_LIMIT} görsel / gün`, included: true },
    { label: `${PRO_VIDEO_LIMIT} video / gün`, included: true },
    { label: `${PRO_VOICE_MINUTES} dk canlı ses / gün`, included: true },
    { label: `${PRO_BRAND_BIRTH_PER_DAY} Marka doğur / gün`, included: true },
    { label: "Kalite modeli + 2K", included: true },
    { label: "Marka hafızası, takvim, export", included: true },
    { label: "Ticari kullanım hakkı", included: true },
  ],
} as const;

export function billingMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function billingDayKey(date = new Date()): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${billingMonthKey(date)}-${day}`;
}
