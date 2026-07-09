"use client";

import dynamic from "next/dynamic";

export const ChatInterfaceClient = dynamic(
  () =>
    import("@/components/chat/chat-interface").then(
      (module) => module.ChatInterface,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Orwix yükleniyor...
      </div>
    ),
  },
);
