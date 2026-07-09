export type AuthProvider = "google" | "email";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  picture?: string;
  provider: AuthProvider;
  signedOut?: boolean;
}

export type AuthView = "picker" | "sign-in" | "remove";
