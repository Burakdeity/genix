function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface TypewriterOptions {
  /** Characters revealed per tick */
  charsPerTick?: number;
  /** Delay between ticks in ms */
  tickMs?: number;
}

const DEFAULT_OPTIONS: Required<TypewriterOptions> = {
  charsPerTick: 2,
  tickMs: 16,
};

/** Reveal a full string with a typing animation. */
export async function typeText(
  text: string,
  onChunk: (chunk: string) => void,
  options: TypewriterOptions = {},
): Promise<void> {
  const { charsPerTick, tickMs } = { ...DEFAULT_OPTIONS, ...options };

  for (let i = 0; i < text.length; i += charsPerTick) {
    onChunk(text.slice(i, i + charsPerTick));
    if (i + charsPerTick < text.length) {
      await sleep(tickMs);
    }
  }
}

/**
 * Buffers streamed API chunks and reveals them at a steady typing pace,
 * so fast models still feel like they're writing.
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
        await sleep(8);
        continue;
      }

      const next = queue.slice(0, charsPerTick);
      queue = queue.slice(charsPerTick);
      onChunk(next);
      await sleep(tickMs);
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
