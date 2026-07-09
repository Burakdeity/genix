export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Yanıt yazılıyor">
      <span className="genix-typing-dot" />
      <span className="genix-typing-dot [animation-delay:150ms]" />
      <span className="genix-typing-dot [animation-delay:300ms]" />
    </div>
  );
}
