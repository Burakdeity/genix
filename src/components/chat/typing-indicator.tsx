export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 py-0.5"
      aria-hidden
    >
      <span className="orwix-typing-dot" />
      <span className="orwix-typing-dot [animation-delay:140ms]" />
      <span className="orwix-typing-dot [animation-delay:280ms]" />
    </div>
  );
}
