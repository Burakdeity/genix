import { AppError } from "@/server/errors/api-error";

const RETRYABLE_CODES = new Set(["RATE_LIMIT", "NETWORK_ERROR"]);
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return (
      RETRYABLE_CODES.has(error.code) ||
      RETRYABLE_STATUSES.has(error.statusCode)
    );
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  return (
    message.includes("resource exhausted") ||
    message.includes("rate limit") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  );
}

function extractRetryDelayMs(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/retry in ([\d.]+)s/i);

  if (!match) {
    return null;
  }

  return Math.ceil(Number.parseFloat(match[1]) * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const retryDelay =
        extractRetryDelayMs(error) ?? baseDelayMs * 2 ** (attempt - 1);

      await sleep(Math.min(retryDelay, 10000));
    }
  }

  throw lastError;
}
