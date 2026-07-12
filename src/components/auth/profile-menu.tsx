"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogIn, LogOut, UserRound } from "lucide-react";

import { AccountAvatar } from "@/components/auth/account-avatar";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface ProfileMenuProps {
  align?: "sidebar" | "drawer" | "header";
}

export function ProfileMenu({ align = "sidebar" }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hydrated = useStoresHydrated();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const accounts = useAuthStore((state) => state.accounts);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const signOut = useAuthStore((state) => state.signOut);

  const activeAccount =
    hydrated && activeAccountId
      ? accounts.find((account) => account.id === activeAccountId) ?? null
      : null;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  function updateMenuPosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (align === "header") {
      const width = 240;
      setMenuStyle({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - width),
      });
      return;
    }

    if (align === "sidebar") {
      setMenuStyle({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
      return;
    }

    setMenuStyle({
      top: rect.top - 8,
      left: rect.left,
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }

    updateMenuPosition();
    setOpen(true);
  }

  function handleSignIn() {
    setOpen(false);
    openAuthModal("picker");
  }

  function handleSignOut() {
    signOut();
    setOpen(false);
  }

  function handleSwitchAccount() {
    setOpen(false);
    openAuthModal("picker");
  }

  const menu = open ? (
    <div
      ref={containerRef}
      style={
        align === "sidebar"
          ? {
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              transform: "translateY(-50%)",
              zIndex: 200,
            }
          : align === "header"
            ? {
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                zIndex: 200,
                width: 240,
              }
            : {
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                transform: "translate(-0%, -100%)",
                zIndex: 200,
                width: buttonRef.current?.offsetWidth,
              }
      }
      className="min-w-[220px] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      {activeAccount ? (
        <>
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <AccountAvatar
                name={activeAccount.name}
                color={activeAccount.avatarColor}
                picture={activeAccount.picture}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {activeAccount.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activeAccount.email}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted"
          >
            <UserRound className="size-4 text-muted-foreground" />
            Hesap değiştir
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted"
          >
            <LogOut className="size-4 text-muted-foreground" />
            Oturumu kapat
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted"
        >
          <LogIn className="size-4 text-muted-foreground" />
          Giriş yap
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={activeAccount ? activeAccount.name : "Profil"}
        onClick={toggleMenu}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          align === "sidebar" && "size-8",
          align === "header" &&
            "size-9 ring-1 ring-border/70 hover:ring-primary/40",
          align === "drawer" &&
            "h-11 w-full justify-start gap-3 rounded-xl px-3 text-sm text-foreground hover:bg-muted",
          align === "sidebar" &&
            !activeAccount &&
            "border border-border text-muted-foreground",
          !activeAccount &&
            align === "sidebar" &&
            "hover:bg-muted hover:text-foreground",
        )}
      >
        {activeAccount ? (
          <>
            <AccountAvatar
              name={activeAccount.name}
              color={activeAccount.avatarColor}
              picture={activeAccount.picture}
              className={cn(
                "text-sm",
                align === "header" ? "size-9" : "size-8",
              )}
            />
            {align === "drawer" ? (
              <span className="truncate font-medium">{activeAccount.name}</span>
            ) : null}
          </>
        ) : (
          <>
            <span
              className={cn(
                "flex items-center justify-center rounded-full border border-border",
                align === "sidebar" || align === "header"
                  ? "size-8"
                  : "size-8 shrink-0",
              )}
            >
              <UserRound className="size-4" strokeWidth={1.75} />
            </span>
            {align === "drawer" ? (
              <span className="font-medium">Giriş yap</span>
            ) : null}
          </>
        )}
      </button>

      {hydrated && open ? createPortal(menu, document.body) : null}
    </>
  );
}
