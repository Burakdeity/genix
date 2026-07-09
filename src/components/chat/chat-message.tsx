import { GenixWordmark } from "@/components/brand/genix-logo";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatMessageItemProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function ChatMessageItem({ message, isTyping = false }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "genix-message-enter mx-auto w-full max-w-2xl",
        isUser ? "flex justify-end" : "flex justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[88%] md:max-w-[78%]",
          isUser ? "" : "flex gap-3",
        )}
      >
        {!isUser ? (
          <div className="mt-1 hidden size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card sm:flex">
            <GenixWordmark className="text-[10px] font-bold" />
          </div>
        ) : null}

        <div
          className={cn(
            "min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed md:text-[15px]",
            isUser
              ? "genix-user-bubble text-foreground"
              : "border border-border/70 bg-card/80 text-foreground shadow-sm",
          )}
        >
          {!isUser ? (
            <div className="mb-2 flex items-center gap-2 sm:hidden">
              <GenixWordmark className="text-xs font-bold" />
            </div>
          ) : null}

          {isTyping ? (
            <TypingIndicator />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {message.structuredData ? (
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/50 p-3 text-xs">
              <p className="text-muted-foreground">
                Güven: {(message.structuredData.confidence * 100).toFixed(0)}%
              </p>
              {message.structuredData.followUpQuestions.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {message.structuredData.followUpQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
