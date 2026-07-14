export interface TypewriterOptions {
  /** Base characters revealed per tick */
  charsPerTick?: number;
  /** Base delay between ticks in ms */
  tickMs?: number;
}

/**
 * Stream path: flush tokens immediately so latency = API only.
 * "Düşünüyor…" UI covers the wait before the first chunk.
 */
export function createStreamTypewriter(
  onChunk: (chunk: string) => void,
  _options?: TypewriterOptions,
) {
  return {
    push(chunk: string) {
      if (chunk) onChunk(chunk);
    },
    async done() {
      // already flushed
    },
  };
}

/** Non-stream fallback: reveal quickly in larger bursts. */
export async function typeText(
  text: string,
  onChunk: (chunk: string) => void,
  _options?: TypewriterOptions,
): Promise<void> {
  if (!text) return;

  const step = 48;
  for (let i = 0; i < text.length; i += step) {
    onChunk(text.slice(i, i + step));
    if (i + step < text.length) {
      await new Promise((resolve) => setTimeout(resolve, 4));
    }
  }
}
