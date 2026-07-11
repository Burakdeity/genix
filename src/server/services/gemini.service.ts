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
  GEMINI_MODELS.PRO,
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.FLASH_LITE,
] as const;

const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || getServerEnv().GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
}

function resolveModel(model?: GeminiModelId): GeminiModelId {
  return model ?? GEMINI_MODELS.PRO;
}

function getFallbackModels(primary: GeminiModelId): string[] {
  // Prefer stronger models first when falling back.
  const ordered = [primary, ...STREAM_FALLBACK_MODELS];
  return [...new Set(ordered)];
}

function buildContents(request: GeminiGenerateRequest): GeminiContent[] | string {
  const history = request.history?.filter((item) => item.content.trim()) ?? [];

  if (history.length === 0) {
    return request.prompt;
  }

  const contents: GeminiContent[] = history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  const last = contents[contents.length - 1];
  if (!last || last.role !== "user" || last.parts[0]?.text !== request.prompt) {
    contents.push({
      role: "user",
      parts: [{ text: request.prompt }],
    });
  }

  return contents;
}

function buildGenerateConfig(request: GeminiGenerateRequest) {
  const { config, structuredOutput, systemInstruction } = request;

  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    temperature: config?.temperature ?? 0.7,
    maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
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
    const contents = buildContents(request);

    for (const model of models) {
      try {
        return await withRetry(
          async () => {
            const response = await this.client.models.generateContent({
              model,
              contents,
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
    const contents = buildContents(request);

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const stream = await this.client.models.generateContentStream({
            model,
            contents,
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
