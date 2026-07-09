export type AppScreenLayout =
  | "splash"
  | "onboarding"
  | "home"
  | "detail"
  | "profile";

export interface OrwixAppScreen {
  id: string;
  title: string;
  layout: AppScreenLayout;
}

export const ORWIX_APP_DEFAULT_SCREENS: OrwixAppScreen[] = [
  { id: "splash", title: "Açılış", layout: "splash" },
  { id: "onboarding", title: "Tanıtım", layout: "onboarding" },
  { id: "home", title: "Ana Sayfa", layout: "home" },
  { id: "detail", title: "Detay", layout: "detail" },
  { id: "profile", title: "Profil", layout: "profile" },
];

export const ORWIX_APP_STUDIO = {
  label: "Ekran akışı",
  hint: "Akışı gezin veya prompt yazarak özelleştirin",
  appName: "Orwix App",
} as const;
