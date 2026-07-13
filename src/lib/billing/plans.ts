/** Client-side plan limits — Pro unlocks via Stripe Checkout ($20/mo). */

export const ORWIX_PRO_PRICE_USD = 20;
export const ORWIX_PRO_PRICE_CENTS = ORWIX_PRO_PRICE_USD * 100;
export const ORWIX_PRO_PRICE_LABEL = `$${ORWIX_PRO_PRICE_USD} / ay`;

export const PLAN_LIMITS = {
  guest: {
    images: 1,
    videos: 1,
    voiceMinutesPerDay: 2,
  },
  free: {
    imagesPerMonth: 5,
    videosPerMonth: 1,
    voiceMinutesPerDay: 10,
  },
  pro: {
    imagesPerMonth: 200,
    videosPerMonth: 30,
    voiceMinutesPerDay: 90,
  },
} as const;

/** Re-export friendly names used across UI / stores */
export const GUEST_IMAGE_LIMIT = PLAN_LIMITS.guest.images;
export const FREE_SIGNED_IN_IMAGE_LIMIT = PLAN_LIMITS.free.imagesPerMonth;
export const PRO_IMAGE_LIMIT = PLAN_LIMITS.pro.imagesPerMonth;

export const GUEST_VIDEO_LIMIT = PLAN_LIMITS.guest.videos;
export const FREE_SIGNED_IN_VIDEO_LIMIT = PLAN_LIMITS.free.videosPerMonth;
export const PRO_VIDEO_LIMIT = PLAN_LIMITS.pro.videosPerMonth;

export const GUEST_VOICE_MINUTES = PLAN_LIMITS.guest.voiceMinutesPerDay;
export const FREE_VOICE_MINUTES = PLAN_LIMITS.free.voiceMinutesPerDay;
export const PRO_VOICE_MINUTES = PLAN_LIMITS.pro.voiceMinutesPerDay;

export const PRO_BENEFITS = [
  `Ayda ${PRO_IMAGE_LIMIT} görsel (ücretsizde ${FREE_SIGNED_IN_IMAGE_LIMIT})`,
  `Ayda ${PRO_VIDEO_LIMIT} video (ücretsizde ${FREE_SIGNED_IN_VIDEO_LIMIT})`,
  "Kalite modeli ve 2K görsel",
  `Günde ${PRO_VOICE_MINUTES} dk canlı ses (ücretsizde ${FREE_VOICE_MINUTES} dk)`,
  "Ticari kullanım hakkı",
] as const;

export const PLAN_COMPARISON = [
  {
    feature: "Fiyat",
    free: "Ücretsiz",
    pro: ORWIX_PRO_PRICE_LABEL,
  },
  {
    feature: "Görsel / ay",
    free: `${FREE_SIGNED_IN_IMAGE_LIMIT}`,
    pro: `${PRO_IMAGE_LIMIT}`,
  },
  {
    feature: "Video / ay",
    free: `${FREE_SIGNED_IN_VIDEO_LIMIT}`,
    pro: `${PRO_VIDEO_LIMIT}`,
  },
  {
    feature: "Canlı ses / gün",
    free: `${FREE_VOICE_MINUTES} dk`,
    pro: `${PRO_VOICE_MINUTES} dk`,
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
] as const;

export const PLAN_CARD_FEATURES = {
  free: [
    { label: `${FREE_SIGNED_IN_IMAGE_LIMIT} görsel / ay`, included: true },
    { label: `${FREE_SIGNED_IN_VIDEO_LIMIT} video / ay`, included: true },
    { label: `${FREE_VOICE_MINUTES} dk canlı ses / gün`, included: true },
    { label: "Kalite modeli + 2K", included: false },
    { label: "Ticari kullanım", included: false },
  ],
  pro: [
    { label: `${PRO_IMAGE_LIMIT} görsel / ay`, included: true },
    { label: `${PRO_VIDEO_LIMIT} video / ay`, included: true },
    { label: `${PRO_VOICE_MINUTES} dk canlı ses / gün`, included: true },
    { label: "Kalite modeli + 2K", included: true },
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
