"use client";

import { Bot, Code2, FileText, Laugh } from "lucide-react";

interface WelcomeCardProps {
  onQuickStart: (prompt: string) => void;
  isLoading: boolean;
}

const quickStarts = [
  {
    label: "Summarize this PDF",
    prompt: "Bu metni özetle ve ana noktaları madde madde listele.",
    icon: FileText,
  },
  {
    label: "Write a joke",
    prompt: "Bana kısa ve eğlenceli bir şaka yaz.",
    icon: Laugh,
  },
  {
    label: "Analyze code",
    prompt: "Aşağıdaki kodu analiz et ve iyileştirme önerileri sun.",
    icon: Code2,
  },
] as const;

export function WelcomeCard({ onQuickStart, isLoading }: WelcomeCardProps) {
  return (
    <div className="welcome-card p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/25">
          <Bot className="size-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground md:text-lg">
            Welcome back!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gemini ile sohbete başlayın veya hızlı bir görev seçin.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {quickStarts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              disabled={isLoading}
              onClick={() => onQuickStart(item.prompt)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs font-medium text-secondary-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-foreground disabled:opacity-50 md:text-sm"
            >
              <Icon className="size-3.5 text-primary" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
