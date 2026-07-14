export interface TypewriterOptions {
  /** Base characters revealed per tick */
  charsPerTick?: number;
  /** Base delay between ticks in ms */
  tickMs?: number;
}

const DEFAULT_STREAM: Required<TypewriterOptions> = {
  charsPerTick: 2,
  tickMs: 22,
};

const DEFAULT_BATCH: Required<TypewriterOptions> = {
  charsPerTick: 2,
  tickMs: 24,
};

const PUNCTUATION_PAUSE: Record<string, number> = {
  ".": 1.85,
  "!": 1.85,
  "?": 1.85,
  "…": 1.7,
  ",": 1.25,
  ";": 1.35,
  ":": 1.35,
  "\n": 1.55,
};

function paceMultiplier(lastChar: string, backlog: number): number {
  if (backlog > 320) return 0.35;
  if (backlog > 160) return 0.5;
  if (backlog > 80) return 0.7;
  return PUNCTUATION_PAUSE[lastChar] ?? 1;
}

function nextBurstSize(buffer: string, base: number, backlog: number): number {
  if (backlog > 240) return Math.min(buffer.length, base + 6);
  if (backlog > 120) return Math.min(buffer.length, base + 3);
  if (backlog > 60) return Math.min(buffer.length, base + 1);

  // Prefer finishing a short word rather than splitting mid-token harshly.
  const softEnd = Math.min(buffer.length, base + 2);
  const slice = buffer.slice(0, softEnd);
  const space = slice.lastIndexOf(" ");
  if (space >= base - 1) return space + 1;
  return Math.min(buffer.length, base);
}

/**
 * Stream path: queue API chunks and reveal them with a calm, professional cadence.
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
  let lastChar = "";

  const flushTick = () => {
    timer = null;

    if (!buffer) {
      if (finished) {
        resolveDone?.();
        resolveDone = null;
      }
      return;
    }

    const take = nextBurstSize(buffer, charsPerTick, buffer.length);
    const piece = buffer.slice(0, take);
    buffer = buffer.slice(take);
    lastChar = piece[piece.length - 1] ?? lastChar;
    onChunk(piece);

    const delay = Math.max(
      8,
      Math.round(tickMs * paceMultiplier(lastChar, buffer.length)),
    );
    timer = setTimeout(flushTick, delay);
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

/** Non-stream fallback: same professional typing cadence. */
export async function typeText(
  text: string,
  onChunk: (chunk: string) => void,
  options?: TypewriterOptions,
): Promise<void> {
  if (!text) return;

  const charsPerTick = options?.charsPerTick ?? DEFAULT_BATCH.charsPerTick;
  const tickMs = options?.tickMs ?? DEFAULT_BATCH.tickMs;
  let lastChar = "";

  let i = 0;
  while (i < text.length) {
    const remaining = text.length - i;
    const take = nextBurstSize(text.slice(i), charsPerTick, remaining);
    const piece = text.slice(i, i + take);
    i += take;
    lastChar = piece[piece.length - 1] ?? lastChar;
    onChunk(piece);

    if (i < text.length) {
      const delay = Math.max(
        8,
        Math.round(tickMs * paceMultiplier(lastChar, remaining - take)),
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
