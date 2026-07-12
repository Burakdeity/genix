import type { ReactNode } from "react";

/**
 * Lightweight markdown for chat bubbles: **bold**, *italic*, `code`,
 * and simple line breaks. Avoids a heavy markdown dependency while streaming.
 */
export function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match **bold**, *italic*, `code` — order matters (bold before italic).
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={`i-${key++}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function MessageMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        const trimmed = line.trimStart();

        // Unordered list item
        if (/^[-*]\s+/.test(trimmed)) {
          const item = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={`l-${index}`} className="flex gap-2 pl-1">
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                •
              </span>
              <span className="min-w-0">
                {renderInlineMarkdown(item)}
                {!isLast ? "\n" : null}
              </span>
            </div>
          );
        }

        // Heading-ish markdown line
        if (/^#{1,3}\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^#{1,3}\s+/, "");
          return (
            <p
              key={`h-${index}`}
              className="font-semibold text-foreground"
            >
              {renderInlineMarkdown(heading)}
              {!isLast ? "\n" : null}
            </p>
          );
        }

        return (
          <span key={`t-${index}`}>
            {line.length > 0 ? renderInlineMarkdown(line) : "\u00A0"}
            {!isLast ? "\n" : null}
          </span>
        );
      })}
    </div>
  );
}
