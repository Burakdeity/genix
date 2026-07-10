import { GoogleGenAI } from "@google/genai";

import { getServerEnv } from "@/server/config/env";
import { mapGeminiError } from "@/server/errors/gemini.errors";
import {
  chatStructuredResponseSchema,
  type ChatStructuredResponse,
} from "@/server/schemas/chat-response.schema";
import {
  GEMINI_MODELS,
  type GeminiGenerateRequest,
  type GeminiGenerateResponse,
  type GeminiModelId,
  type GeminiStreamChunk,
} from "@/server/types/gemini.types";
import { isRetryableError, withRetry } from "@/server/utils/retry";

const STREAM_FALLBACK_MODELS = [
  GEMINI_MODELS.FLASH_LITE,
  GEMINI_MODELS.FLASH,
] as const;

function createGeminiClient(): GoogleGenAI {
  const { GEMINI_API_KEY } = getServerEnv();
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

function resolveModel(model?: GeminiModelId): GeminiModelId {
  return model ?? GEMINI_MODELS.FLASH_LITE;
}

function getFallbackModels(primary: GeminiModelId): string[] {
  return [...new Set([primary, ...STREAM_FALLBACK_MODELS])];
}

function buildGenerateConfig(request: GeminiGenerateRequest) {
  const { config, structuredOutput, systemInstruction } = request;

  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(config?.temperature !== undefined
      ? { temperature: config.temperature }
      : {}),
    ...(config?.maxOutputTokens !== undefined
      ? { maxOutputTokens: config.maxOutputTokens }
      : {}),
    ...(config?.topP !== undefined ? { topP: config.topP } : {}),
    ...(config?.topK !== undefined ? { topK: config.topK } : {}),
    ...(structuredOutput
      ? {
          responseMimeType: structuredOutput.responseMimeType,
          responseJsonSchema: structuredOutput.responseJsonSchema,
        }
      : {}),
  };
}

function parseStructuredResponse(text: string): ChatStructuredResponse {
  const parsed: unknown = JSON.parse(text);
  return chatStructuredResponseSchema.parse(parsed);
}

export class GeminiService {
  private readonly client: GoogleGenAI;

  constructor(client?: GoogleGenAI) {
    this.client = client ?? createGeminiClient();
  }

  async generateContent(
    request: GeminiGenerateRequest,
  ): Promise<GeminiGenerateResponse> {
    const models = getFallbackModels(resolveModel(request.model));
    let lastError: unknown;

    for (const model of models) {
      try {
        return await withRetry(
          async () => {
            const response = await this.client.models.generateContent({
              model,
              contents: request.prompt,
              config: buildGenerateConfig(request),
            });

            const text = response.text ?? "";

            if (!text) {
              throw new Error("Gemini API boş yanıt döndürdü.");
            }

            const result: GeminiGenerateResponse = {
              text,
              model: model as GeminiModelId,
            };

            if (request.structuredOutput) {
              result.structuredData = parseStructuredResponse(text);
            }

            return result;
          },
          { maxAttempts: 2, baseDelayMs: 400 },
        );
      } catch (error) {
        lastError = error;
        if (!isRetryableError(error)) {
          throw mapGeminiError(error);
        }
      }
    }

    throw mapGeminiError(lastError);
  }

  async *generateContentStream(
    request: GeminiGenerateRequest,
  ): AsyncGenerator<GeminiStreamChunk> {
    const models = getFallbackModels(resolveModel(request.model));
    let lastMapped = mapGeminiError(
      new Error("Gemini API isteği başarısız oldu."),
    );

    for (const model of models) {
      // One quick retry, then switch model — avoids long waits on overloaded models.
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const stream = await this.client.models.generateContentStream({
            model,
            contents: request.prompt,
            config: buildGenerateConfig(request),
          });

          let hasContent = false;

          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) {
              hasContent = true;
              yield { text, done: false };
            }
          }

          if (!hasContent) {
            throw new Error("Gemini API boş akış yanıtı döndürdü.");
          }

          yield { text: "", done: true };
          return;
        } catch (error) {
          const mapped = mapGeminiError(error);
          lastMapped = mapped;

          if (!isRetryableError(mapped)) {
            throw mapped;
          }

          if (attempt < 2) {
            await new Promise((resolve) => {
              setTimeout(resolve, 350);
            });
          }
        }
      }
    }

    throw lastMapped;
  }
}

let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }

  return geminiServiceInstance;
}
