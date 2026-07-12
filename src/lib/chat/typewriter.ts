function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface TypewriterOptions {
  /** Base characters revealed per tick */
  charsPerTick?: number;
  /** Base delay between ticks in ms */
  tickMs?: number;
}

const DEFAULT_OPTIONS: Required<TypewriterOptions> = {
  charsPerTick: 3,
  tickMs: 14,
};

function pauseForChar(char: string): number {
  if (char === "\n") return 28;
  if (/[.!?…]/.test(char)) return 48;
  if (/[,;:]/.test(char)) return 22;
  if (char === " ") return 4;
  return 0;
}

/** Reveal a full string with a smooth, professional typing cadence. */
export async function typeText(
  text: string,
  onChunk: (chunk: string) => void,
  options: TypewriterOptions = {},
): Promise<void> {
  const { charsPerTick, tickMs } = { ...DEFAULT_OPTIONS, ...options };
  let i = 0;

  while (i < text.length) {
    const remaining = text.length - i;
    const burst = remaining > 180 ? charsPerTick + 3 : charsPerTick;
    const next = text.slice(i, i + burst);
    onChunk(next);
    i += burst;

    if (i < text.length) {
      const last = next[next.length - 1] ?? "";
      await sleep(tickMs + pauseForChar(last));
    }
  }
}

/**
 * Buffers streamed API chunks and reveals them at a steady, natural pace.
 * Speeds up when the buffer grows so long replies don't feel laggy.
 */
export function createStreamTypewriter(
  onChunk: (chunk: string) => void,
  options: TypewriterOptions = {},
) {
  const { charsPerTick, tickMs } = { ...DEFAULT_OPTIONS, ...options };
  let queue = "";
  let finished = false;
  let running: Promise<void> | null = null;

  const pump = async () => {
    while (!finished || queue.length > 0) {
      if (queue.length === 0) {
        await sleep(10);
        continue;
      }

      const backlogBoost =
        queue.length > 240 ? 5 : queue.length > 120 ? 3 : queue.length > 60 ? 1 : 0;
      const step = charsPerTick + backlogBoost;
      const next = queue.slice(0, step);
      queue = queue.slice(step);
      onChunk(next);

      const last = next[next.length - 1] ?? "";
      const delay =
        queue.length > 200
          ? Math.max(6, tickMs - 6)
          : tickMs + pauseForChar(last);
      await sleep(delay);
    }
  };

  return {
    push(chunk: string) {
      queue += chunk;
      if (!running) {
        running = pump();
      }
    },
    async done() {
      finished = true;
      if (!running) {
        running = pump();
      }
      await running;
    },
  };
}
