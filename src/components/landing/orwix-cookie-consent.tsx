"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ORWIX_COOKIE } from "@/content/orwix-content";

const STORAGE_KEY = "orwix-cookie-consent";

export function OrwixCookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = (choice: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      id="cerez-politikasi"
      className="orwix-glass pointer-events-auto fixed bottom-4 left-3 right-3 z-50 rounded-2xl border border-primary/20 p-5 shadow-2xl shadow-primary/10 sm:bottom-5 sm:left-auto sm:right-6 sm:max-w-[380px]"
    >
      <p className="text-base font-semibold leading-snug text-foreground">
        {ORWIX_COOKIE.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {ORWIX_COOKIE.bodyPrefix}{" "}
        <a
          href={ORWIX_COOKIE.policyHref}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {ORWIX_COOKIE.policyLabel}
        </a>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          className="orwix-cta-btn w-full rounded-xl border-0 text-white"
          onClick={() => dismiss("accept")}
        >
          {ORWIX_COOKIE.acceptAll}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => dismiss("reject")}
          >
            {ORWIX_COOKIE.rejectAll}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 rounded-xl"
            onClick={() => dismiss("customize")}
          >
            {ORWIX_COOKIE.customize}
          </Button>
        </div>
      </div>
    </div>
  );
}
