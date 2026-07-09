export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Yanıt yazılıyor">
      <span className="orwix-typing-dot" />
      <span className="orwix-typing-dot [animation-delay:150ms]" />
      <span className="orwix-typing-dot [animation-delay:300ms]" />
    </div>
  );
}
