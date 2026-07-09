"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuthStore } from "@/stores/auth.store";

export function GoogleOAuthSignInButton() {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const login = useGoogleLogin({
    scope: "openid profile email",
    onSuccess: async (tokenResponse) => {
      setError(null);

      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Google profil bilgisi alınamadı.");
        }

        const profile = (await response.json()) as {
          email?: string;
          name?: string;
          picture?: string;
        };

        if (!profile.email) {
          throw new Error("Google hesabından e-posta alınamadı.");
        }

        signInWithGoogle(
          profile.name ?? profile.email,
          profile.email,
          profile.picture,
        );
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Google ile giriş başarısız oldu.",
        );
      }
    },
    onError: () => {
      setError("Google ile giriş iptal edildi veya başarısız oldu.");
    },
  });

  if (!clientId) {
    return (
      <p className="rounded-xl border border-[#f9ab00] bg-[#fff8e1] px-4 py-3 text-sm text-[#5f6368]">
        Google Client ID tanımlı değil. `.env.local` dosyasına{" "}
        <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> ekleyin.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <GoogleSignInButton onClick={() => login()} />
      {error ? (
        <p className="text-center text-sm text-[#d93025]">{error}</p>
      ) : null}
    </div>
  );
}
