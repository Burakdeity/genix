/** Extract the best HTML document/snippet from an assistant reply. */
export function extractHtmlFromContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const fenced = /```(?:html|htm|svg)?\s*([\s\S]*?)```/gi;
  let best: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = fenced.exec(trimmed)) !== null) {
    const candidate = match[1]?.trim() ?? "";
    if (isLikelyHtml(candidate) && (!best || candidate.length > best.length)) {
      best = candidate;
    }
  }

  if (best) return normalizeHtmlDocument(best);

  const docMatch = trimmed.match(/<!DOCTYPE\s+html[\s\S]*<\/html>/i)?.[0];
  if (docMatch) return normalizeHtmlDocument(docMatch);

  const htmlMatch = trimmed.match(/<html[\s\S]*<\/html>/i)?.[0];
  if (htmlMatch) return normalizeHtmlDocument(htmlMatch);

  if (
    /<(?:div|section|main|header|body)\b/i.test(trimmed) &&
    trimmed.length > 400 &&
    (trimmed.match(/</g)?.length ?? 0) > 8
  ) {
    return normalizeHtmlDocument(trimmed);
  }

  return null;
}

/** Human-readable reply text without the raw HTML payload. */
export function getDisplayTextWithoutHtml(content: string): string {
  const cleaned = content
    .replace(/```(?:html|htm|svg)?\s*[\s\S]*?```/gi, "")
    .replace(/<!DOCTYPE\s+html[\s\S]*<\/html>/gi, "")
    .replace(/<html[\s\S]*<\/html>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return (
    cleaned ||
    "Web sitesi hazır. Canlı önizlemeyi aşağıdan inceleyebilirsin."
  );
}

function isLikelyHtml(value: string): boolean {
  if (!value) return false;
  if (/<!DOCTYPE\s+html|<html[\s>]/i.test(value)) return true;
  if (/<(?:div|section|main|header|body|style|script)\b/i.test(value)) {
    return (value.match(/</g)?.length ?? 0) >= 3;
  }
  return false;
}

function normalizeHtmlDocument(html: string): string {
  const value = html.trim();
  if (/<!DOCTYPE\s+html|<html[\s>]/i.test(value)) {
    return value;
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orwix Önizleme</title>
  <style>
    html, body { margin: 0; min-height: 100%; }
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
${value}
</body>
</html>`;
}
