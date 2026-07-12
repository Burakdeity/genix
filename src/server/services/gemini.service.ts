import { GoogleGenAI } from "@google/genai";

import { getServerEnv } from "@/server/config/env";
import { mapGeminiError } from "@/server/errors/gemini.errors";
import {
  chatStructuredResponseSchema,
  type ChatStructuredResponse,
} from "@/server/schemas/chat-response.schema";
import {
  GEMINI_IMAGE_MODELS,
  GEMINI_MODELS,
  type GeminiGenerateRequest,
  type GeminiGenerateResponse,
  type GeminiGeneratedImage,
  type GeminiImageGenerateRequest,
  type GeminiImageGenerateResponse,
  type GeminiModelId,
  type GeminiStreamChunk,
} from "@/server/types/gemini.types";
import { isRetryableError, withRetry } from "@/server/utils/retry";

const STREAM_FALLBACK_MODELS = [
  GEMINI_MODELS.PRO,
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.FLASH_LITE,
] as const;

const IMAGE_FALLBACK_MODELS = [
  GEMINI_IMAGE_MODELS.PRO,
  GEMINI_IMAGE_MODELS.FLASH_NEW,
  GEMINI_IMAGE_MODELS.FLASH,
] as const;

const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
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

function buildImageParts(
  images?: Array<{ mimeType: string; data: string }>,
): GeminiPart[] {
  if (!images?.length) return [];
  return images.map((image) => ({
    inlineData: {
      mimeType: image.mimeType,
      data: image.data,
    },
  }));
}

function buildContents(request: GeminiGenerateRequest): GeminiContent[] | string {
  const history = request.history?.filter((item) => item.content.trim()) ?? [];
  const imageParts = buildImageParts(request.images);
  const promptText =
    request.prompt.trim() ||
    (imageParts.length > 0 ? "Bu görseli incele ve yardımcı ol." : "");

  if (history.length === 0 && imageParts.length === 0) {
    return promptText;
  }

  if (history.length === 0) {
    return [
      {
        role: "user",
        parts: [{ text: promptText }, ...imageParts],
      },
    ];
  }

  const contents: GeminiContent[] = history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  const last = contents[contents.length - 1];
  const lastTextPart = last?.parts.find(
    (part): part is { text: string } =>
      "text" in part && typeof part.text === "string",
  );
  const lastText = lastTextPart?.text;

  if (
    !last ||
    last.role !== "user" ||
    lastText !== promptText ||
    imageParts.length > 0
  ) {
    contents.push({
      role: "user",
      parts: [{ text: promptText }, ...imageParts],
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

function extractResponseText(response: {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>;
    };
  }>;
}): string {
  const direct = response.text?.trim() ?? "";
  if (direct) return direct;

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractChunkText(chunk: {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>;
    };
  }>;
}): string {
  return extractResponseText(chunk);
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

            const text = extractResponseText(response);

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
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        const shouldFallback =
          isRetryableError(error) ||
          message.includes("boş yanıt") ||
          message.includes("not found") ||
          message.includes("no longer available");

        if (!shouldFallback) {
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
            const text = extractChunkText(chunk);
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
          const message =
            error instanceof Error ? error.message.toLowerCase() : "";
          const shouldFallback =
            isRetryableError(mapped) ||
            message.includes("boş akış") ||
            message.includes("not found") ||
            message.includes("no longer available");

          if (!shouldFallback) {
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

  async generateImage(
    request: GeminiImageGenerateRequest,
  ): Promise<GeminiImageGenerateResponse> {
    const primary = request.model ?? GEMINI_IMAGE_MODELS.PRO;
    const models = [
      primary,
      ...IMAGE_FALLBACK_MODELS.filter((model) => model !== primary),
    ];
    let lastError: unknown;

    const promptText =
      request.prompt.trim() ||
      (request.images?.length
        ? "Bu görselleri referans alarak yeni bir görsel üret."
        : "Yüksek kaliteli bir görsel oluştur.");

    const reinforcedPrompt = `${promptText}

Önemli: Yanıtında mutlaka bir görsel üret. Sadece metin açıklaması yazma.`;

    const contents = request.images?.length
      ? [
          {
            role: "user" as const,
            parts: [
              { text: reinforcedPrompt },
              ...buildImageParts(request.images),
            ],
          },
        ]
      : reinforcedPrompt;

    const modalityAttempts: Array<Array<"TEXT" | "IMAGE">> = [
      ["IMAGE"],
      ["TEXT", "IMAGE"],
    ];

    for (const model of models) {
      const preferLarge =
        model === GEMINI_IMAGE_MODELS.PRO ||
        model === GEMINI_IMAGE_MODELS.FLASH_NEW;
      const imageSize =
        request.imageSize ?? (preferLarge ? "2K" : undefined);

      for (const responseModalities of modalityAttempts) {
        try {
          const response = await this.client.models.generateContent({
            model,
            contents,
            config: {
              responseModalities,
              imageConfig: {
                ...(request.aspectRatio
                  ? { aspectRatio: request.aspectRatio }
                  : {}),
                ...(imageSize ? { imageSize } : {}),
              },
            },
          });

          const candidate = response.candidates?.[0];
          const finishReason = candidate?.finishReason;
          const parts = candidate?.content?.parts ?? [];
          const images: GeminiGeneratedImage[] = [];
          const textParts: string[] = [];

          for (const part of parts) {
            if (part.text && !part.thought) {
              textParts.push(part.text);
            }

            const inline = part.inlineData;
            if (inline?.data) {
              const mimeType = inline.mimeType || "image/png";
              images.push({
                mimeType,
                data: inline.data,
                dataUrl: `data:${mimeType};base64,${inline.data}`,
              });
            }
          }

          if (images.length > 0) {
            return {
              text: textParts.join("\n").trim(),
              images,
              model,
            };
          }

          if (
            finishReason === "SAFETY" ||
            finishReason === "BLOCKLIST" ||
            finishReason === "PROHIBITED_CONTENT"
          ) {
            throw new Error(
              "Görsel güvenlik filtresine takıldı. Promptu daha nötr deneyin.",
            );
          }

          throw new Error(
            `Gemini görsel üretemedi (${model}, ${responseModalities.join("+")}).`,
          );
        } catch (error) {
          lastError = error;
          const message =
            error instanceof Error ? error.message.toLowerCase() : "";
          const shouldFallback =
            isRetryableError(error) ||
            message.includes("görsel üretemedi") ||
            message.includes("not found") ||
            message.includes("no longer available") ||
            message.includes("not supported") ||
            message.includes("invalid");

          if (!shouldFallback) {
            throw mapGeminiError(error);
          }
        }
      }
    }

    throw mapGeminiError(lastError);
  }
}

let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }

  return geminiServiceInstance;
}
