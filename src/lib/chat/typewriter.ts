export interface TypewriterOptions {
  /** Characters revealed per tick */
  charsPerTick?: number;
  /** Delay between ticks in ms */
  tickMs?: number;
}

const DEFAULT_STREAM: Required<TypewriterOptions> = {
  charsPerTick: 3,
  tickMs: 16,
};

const DEFAULT_BATCH: Required<TypewriterOptions> = {
  charsPerTick: 4,
  tickMs: 18,
};

/**
 * Stream path: queue API chunks and reveal them at a typing pace
 * so the UI looks like Orwix is writing live.
 */
export function createStreamTypewriter(
  onChunk: (chunk: string) => void,
  options?: TypewriterOptions,
) {
  const charsPerTick = options?.charsPerTick ?? DEFAULT_STREAM.charsPerTick;
  const tickMs = options?.tickMs ?? DEFAULT_STREAM.tickMs;

  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let finished = false;
  let resolveDone: (() => void) | null = null;

  const flushTick = () => {
    timer = null;

    if (!buffer) {
      if (finished) {
        resolveDone?.();
        resolveDone = null;
      }
      return;
    }

    const take = Math.min(charsPerTick, buffer.length);
    const piece = buffer.slice(0, take);
    buffer = buffer.slice(take);
    onChunk(piece);

    // Catch up if the model is far ahead of the display.
    const catchUp =
      buffer.length > 180 ? Math.max(1, Math.floor(tickMs * 0.45)) : tickMs;

    timer = setTimeout(flushTick, catchUp);
  };

  const ensureRunning = () => {
    if (timer !== null) return;
    timer = setTimeout(flushTick, tickMs);
  };

  return {
    push(chunk: string) {
      if (!chunk) return;
      buffer += chunk;
      ensureRunning();
    },
    async done() {
      finished = true;
      if (!buffer && timer === null) return;

      await new Promise<void>((resolve) => {
        resolveDone = resolve;
        ensureRunning();
      });
    },
  };
}

/** Non-stream fallback: reveal text with the same typing feel. */
export async function typeText(
  text: string,
  onChunk: (chunk: string) => void,
  options?: TypewriterOptions,
): Promise<void> {
  if (!text) return;

  const charsPerTick = options?.charsPerTick ?? DEFAULT_BATCH.charsPerTick;
  const tickMs = options?.tickMs ?? DEFAULT_BATCH.tickMs;

  for (let i = 0; i < text.length; i += charsPerTick) {
    onChunk(text.slice(i, i + charsPerTick));
    if (i + charsPerTick < text.length) {
      await new Promise((resolve) => setTimeout(resolve, tickMs));
    }
  }
}
