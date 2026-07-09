"use client";

import { ArrowLeft } from "lucide-react";

import { AuthFooter } from "@/components/auth/auth-footer";
import { GoogleOAuthSignInButton } from "@/components/auth/google-oauth-sign-in-button";
import { GenixWordmark } from "@/components/brand/genix-logo";
import { useAuthStore } from "@/stores/auth.store";

interface SignInPanelProps {
  onBack: () => void;
  onClose?: () => void;
}

export function SignInPanel({ onBack, onClose }: SignInPanelProps) {
  const signInEmail = useAuthStore((state) => state.signInEmail);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f0f4f9]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-[448px] rounded-[28px] bg-white px-10 py-12 shadow-sm">
          <button
            type="button"
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-sm text-[#444746] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Geri
          </button>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/80 text-[#444746] shadow-sm hover:bg-white"
              aria-label="Kapat"
            >
              ✕
            </button>
          ) : null}

          <div className="mb-8">
            <GenixWordmark className="mb-6 text-3xl font-bold" />
            <h1 className="text-2xl font-normal text-[#1f1f1f]">
              Oturum açın
            </h1>
            <p className="mt-2 text-[15px] text-[#444746]">
              {signInEmail
                ? `${signInEmail} ile devam edin`
                : "Genix'e devam etmek için Google hesabınızla oturum açın"}
            </p>
          </div>

          <div className="space-y-4">
            <GoogleOAuthSignInButton />
            <p className="text-center text-xs leading-relaxed text-[#444746]">
              Devam ederek Genix&apos;in{" "}
              <a href="#" className="text-[#0b57d0] hover:underline">
                Hizmet Şartları
              </a>{" "}
              ve{" "}
              <a href="#" className="text-[#0b57d0] hover:underline">
                Gizlilik Politikası
              </a>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
