"use client";

import { Minus, Plus, UserRound } from "lucide-react";

import { AccountAvatar } from "@/components/auth/account-avatar";
import { AuthFooter } from "@/components/auth/auth-footer";
import { GenixWordmark } from "@/components/brand/genix-logo";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

export function AccountPicker() {
  const accounts = useAuthStore((state) => state.accounts);
  const view = useAuthStore((state) => state.view);
  const signInWithAccount = useAuthStore((state) => state.signInWithAccount);
  const removeAccount = useAuthStore((state) => state.removeAccount);
  const setView = useAuthStore((state) => state.setView);
  const setSignInEmail = useAuthStore((state) => state.setSignInEmail);

  const isRemoveMode = view === "remove";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f0f4f9]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1040px] overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <section className="border-b border-[#dadce0] px-8 py-10 md:border-r md:border-b-0 md:px-10 md:py-14">
              <GenixWordmark className="mb-10 text-3xl font-bold" />
              <h1 className="text-[2rem] leading-tight font-normal text-[#1f1f1f] md:text-[2.75rem]">
                {isRemoveMode ? "Hesabı kaldırma" : "Bir hesap seçin"}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#444746]">
                {isRemoveMode
                  ? "Bu cihazdan kaldırmak istediğiniz hesabı seçin."
                  : "Genix'e devam etmek için bir hesap seçin"}
              </p>
            </section>

            <section className="flex flex-col">
              {accounts.map((account, index) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    if (isRemoveMode) {
                      removeAccount(account.id);
                      if (accounts.length <= 1) {
                        setView("picker");
                      }
                      return;
                    }
                    signInWithAccount(account.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f8f9fa] md:px-8",
                    index > 0 && "border-t border-[#dadce0]",
                  )}
                >
                  <AccountAvatar
                    name={account.name}
                    color={account.avatarColor}
                    picture={account.picture}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[#1f1f1f]">
                      {account.name}
                    </p>
                    <p className="truncate text-sm text-[#444746]">
                      {account.email}
                    </p>
                  </div>
                  {!isRemoveMode && account.signedOut ? (
                    <span className="shrink-0 text-sm text-[#444746]">
                      Oturum kapatıldı
                    </span>
                  ) : null}
                </button>
              ))}

              {!isRemoveMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail(null);
                      setView("sign-in");
                    }}
                    className="flex w-full items-center gap-4 border-t border-[#dadce0] px-6 py-4 text-left transition-colors hover:bg-[#f8f9fa] md:px-8"
                  >
                    <div className="relative flex size-8 items-center justify-center rounded-full border border-[#dadce0] text-[#444746]">
                      <UserRound className="size-4" />
                      <Plus className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-white" />
                    </div>
                    <span className="text-[15px] text-[#1f1f1f]">
                      Başka bir hesap kullan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("remove")}
                    className="flex w-full items-center gap-4 border-t border-[#dadce0] px-6 py-4 text-left transition-colors hover:bg-[#f8f9fa] md:px-8"
                  >
                    <div className="relative flex size-8 items-center justify-center rounded-full border border-[#dadce0] text-[#444746]">
                      <UserRound className="size-4" />
                      <Minus className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-white" />
                    </div>
                    <span className="text-[15px] text-[#1f1f1f]">
                      Hesabı kaldırma
                    </span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("picker")}
                  className="border-t border-[#dadce0] px-6 py-4 text-left text-[15px] text-[#0b57d0] hover:bg-[#f8f9fa] md:px-8"
                >
                  Bitti
                </button>
              )}
            </section>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
