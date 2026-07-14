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
  GEMINI_VIDEO_MODELS,
  type GeminiGenerateRequest,
  type GeminiGenerateResponse,
  type GeminiGeneratedImage,
  type GeminiGeneratedVideo,
  type GeminiGenerationConfig,
  type GeminiGroundingSource,
  type GeminiImageGenerateRequest,
  type GeminiImageGenerateResponse,
  type GeminiModelId,
  type GeminiStreamChunk,
  type GeminiVideoGenerateRequest,
  type GeminiVideoGenerateResponse,
} from "@/server/types/gemini.types";
import { isRetryableError, withRetry } from "@/server/utils/retry";

const IMAGE_FALLBACK_MODELS = [
  GEMINI_IMAGE_MODELS.PRO,
  GEMINI_IMAGE_MODELS.FLASH_NEW,
  GEMINI_IMAGE_MODELS.FLASH,
] as const;

const VIDEO_FALLBACK_MODELS = [
  GEMINI_VIDEO_MODELS.FAST,
  GEMINI_VIDEO_MODELS.PRO,
  GEMINI_VIDEO_MODELS.LITE,
] as const;

const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

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
  return model ?? GEMINI_MODELS.FLASH_LITE;
}

function getFallbackModels(primary: GeminiModelId): string[] {
  if (primary === GEMINI_MODELS.FLASH_LITE) {
    return [primary, GEMINI_MODELS.FLASH];
  }
  if (primary === GEMINI_MODELS.FLASH) {
    return [primary, GEMINI_MODELS.FLASH_LITE];
  }
  if (primary === GEMINI_MODELS.PRO) {
    return [primary, GEMINI_MODELS.FLASH];
  }
  return [primary, GEMINI_MODELS.FLASH_LITE];
}

function resolveThinkingLevel(
  model: GeminiModelId,
  requested?: GeminiGenerationConfig["thinkingLevel"],
): "minimal" | "low" | "medium" | "high" {
  // Must be lowercase strings — SDK enum "MINIMAL" is ignored by the API.
  if (
    requested === "high" ||
    requested === "medium" ||
    requested === "low" ||
    requested === "minimal"
  ) {
    return requested;
  }
  if (model === GEMINI_MODELS.PRO) return "low";
  return "minimal";
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
  const model = resolveModel(request.model);
  const tools: Array<Record<string, object>> = [];

  // Structured JSON and tools conflict on many Gemini endpoints.
  if (!structuredOutput) {
    if (request.enableSearch) {
      tools.push({ googleSearch: {} });
    }
    if (request.enableCodeExecution) {
      tools.push({ codeExecution: {} });
    }
  }

  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    // Omit temperature unless explicitly set — Gemini 3.x prefers model defaults
    ...(config?.temperature !== undefined
      ? { temperature: config.temperature }
      : {}),
    maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    ...(config?.topP !== undefined ? { topP: config.topP } : {}),
    ...(config?.topK !== undefined ? { topK: config.topK } : {}),
    thinkingConfig: {
      thinkingLevel: resolveThinkingLevel(model, config?.thinkingLevel),
      includeThoughts: false,
    },
    ...(tools.length > 0 ? { tools } : {}),
    ...(structuredOutput
      ? {
          responseMimeType: structuredOutput.responseMimeType,
          responseJsonSchema: structuredOutput.responseJsonSchema,
        }
      : {}),
  };
}

type ResponsePart = {
  text?: string;
  thought?: boolean;
  executableCode?: { language?: string; code?: string };
  codeExecutionResult?: { output?: string; outcome?: string };
};

function extractResponseText(response: {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: ResponsePart[];
    };
  }>;
}): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const composed = parts
    .map((part) => {
      if (part.thought) return "";
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
      if (part.executableCode?.code) {
        const lang = part.executableCode.language || "code";
        return `\`\`\`${lang}\n${part.executableCode.code}\n\`\`\``;
      }
      if (part.codeExecutionResult?.output) {
        return `Çıktı:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\``;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (composed) return composed;

  return response.text?.trim() ?? "";
}

function extractChunkText(chunk: {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: ResponsePart[];
    };
  }>;
}): string {
  return extractResponseText(chunk);
}

function extractGroundingSources(response: {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
      }>;
    };
  }>;
}): GeminiGroundingSource[] {
  const chunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: GeminiGroundingSource[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const uri = chunk.web?.uri?.trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({
      title: chunk.web?.title?.trim() || uri,
      uri,
    });
  }

  return sources;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function videoToDataUrl(
  client: GoogleGenAI,
  videoFile: unknown,
): Promise<GeminiGeneratedVideo | null> {
  const file = videoFile as {
    videoBytes?: string | Uint8Array;
    uri?: string;
    mimeType?: string;
    video?: {
      videoBytes?: string | Uint8Array;
      uri?: string;
      mimeType?: string;
    };
  };

  const nested = file.video ?? file;
  const mimeType = nested.mimeType || file.mimeType || "video/mp4";

  if (nested.videoBytes) {
    const bytes =
      typeof nested.videoBytes === "string"
        ? nested.videoBytes
        : Buffer.from(nested.videoBytes).toString("base64");
    return {
      mimeType,
      dataUrl: `data:${mimeType};base64,${bytes}`,
    };
  }

  const uri = nested.uri || file.uri;
  if (!uri) return null;

  try {
    // Prefer SDK download when available; fall back to authenticated fetch.
    const download = (
      client as unknown as {
        files?: {
          download?: (args: {
            file: unknown;
            downloadPath?: string;
          }) => Promise<unknown>;
        };
      }
    ).files?.download;

    const apiKey =
      process.env.GEMINI_API_KEY?.trim() || getServerEnv().GEMINI_API_KEY;
    const separator = uri.includes("?") ? "&" : "?";
    const response = await fetch(`${uri}${separator}key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Video indirilemedi (${response.status}).`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    void download;
    return {
      mimeType,
      dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
    };
  } catch {
    return null;
  }
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

            const sources = extractGroundingSources(response);
            const result: GeminiGenerateResponse = {
              text,
              model: model as GeminiModelId,
              ...(sources.length > 0 ? { sources } : {}),
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
          message.includes("no longer available") ||
          message.includes("tool") ||
          message.includes("google_search") ||
          message.includes("code_execution");

        if (!shouldFallback) {
          throw mapGeminiError(error);
        }

        // If tools caused the failure, retry once without tools on same model.
        if (
          (request.enableSearch || request.enableCodeExecution) &&
          (message.includes("tool") ||
            message.includes("google_search") ||
            message.includes("code_execution") ||
            message.includes("invalid"))
        ) {
          try {
            return await withRetry(
              async () => {
                const response = await this.client.models.generateContent({
                  model,
                  contents,
                  config: buildGenerateConfig({
                    ...request,
                    enableSearch: false,
                    enableCodeExecution: false,
                  }),
                });
                const text = extractResponseText(response);
                if (!text) {
                  throw new Error("Gemini API boş yanıt döndürdü.");
                }
                return {
                  text,
                  model: model as GeminiModelId,
                };
              },
              { maxAttempts: 1, baseDelayMs: 200 },
            );
          } catch {
            // continue model fallback
          }
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
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents,
          config: buildGenerateConfig(request),
        });

        let hasContent = false;
        let lastSources: GeminiGroundingSource[] = [];

        for await (const chunk of stream) {
          const text = extractChunkText(chunk);
          const sources = extractGroundingSources(chunk);
          if (sources.length > 0) {
            lastSources = sources;
          }
          if (text) {
            hasContent = true;
            yield { text, done: false };
          }
        }

        if (!hasContent) {
          throw new Error("Gemini API boş akış yanıtı döndürdü.");
        }

        yield {
          text: "",
          done: true,
          ...(lastSources.length > 0 ? { sources: lastSources } : {}),
        };
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
      }
    }

    throw lastMapped;
  }

  async generateImage(
    request: GeminiImageGenerateRequest,
  ): Promise<GeminiImageGenerateResponse> {
    const primary = request.model ?? GEMINI_IMAGE_MODELS.FLASH_NEW;
    const fallback = IMAGE_FALLBACK_MODELS.find((model) => model !== primary);
    // Cap to primary + one fallback to avoid long sequential chains
    const models = fallback ? [primary, fallback] : [primary];
    let lastError: unknown;

    const promptText =
      request.prompt.trim() ||
      (request.images?.length
        ? "Bu görselleri referans alarak istenen değişikliği uygula."
        : "Yüksek kaliteli bir görsel oluştur.");

    const contents = request.images?.length
      ? [
          {
            role: "user" as const,
            parts: [
              { text: promptText },
              ...buildImageParts(request.images),
            ],
          },
        ]
      : promptText;

    // TEXT+IMAGE first — IMAGE-only often fails and wastes a full round-trip
    const modalityAttempts: Array<Array<"TEXT" | "IMAGE">> = [
      ["TEXT", "IMAGE"],
      ["IMAGE"],
    ];

    for (const model of models) {
      const preferLarge =
        model === GEMINI_IMAGE_MODELS.PRO ||
        model === GEMINI_IMAGE_MODELS.FLASH_NEW;
      const imageSize =
        request.imageSize ?? (preferLarge ? "1K" : undefined);

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
                data: "",
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

  async generateVideo(
    request: GeminiVideoGenerateRequest,
  ): Promise<GeminiVideoGenerateResponse> {
    const primary = request.model ?? GEMINI_VIDEO_MODELS.FAST;
    const models = [
      primary,
      ...VIDEO_FALLBACK_MODELS.filter((model) => model !== primary),
    ];
    let lastError: unknown;

    const prompt =
      request.prompt.trim() ||
      "Sinematik, yüksek kaliteli kısa bir video oluştur.";

    for (const model of models) {
      try {
        let operation = await this.client.models.generateVideos({
          model,
          prompt,
          config: {
            numberOfVideos: 1,
            ...(request.aspectRatio
              ? { aspectRatio: request.aspectRatio }
              : { aspectRatio: "16:9" }),
          },
        });

        const maxPolls = 36;
        for (let i = 0; i < maxPolls && !operation.done; i += 1) {
          await sleep(8000);
          operation = await this.client.operations.getVideosOperation({
            operation,
          });
        }

        if (!operation.done) {
          throw new Error("Video üretimi zaman aşımına uğradı.");
        }

        const generated =
          (
            operation as {
              response?: {
                generatedVideos?: Array<{ video?: unknown } | unknown>;
              };
            }
          ).response?.generatedVideos ?? [];

        if (!generated.length) {
          throw new Error(`Gemini video üretemedi (${model}).`);
        }

        const videos: GeminiGeneratedVideo[] = [];
        for (const item of generated) {
          const file =
            item && typeof item === "object" && "video" in item
              ? (item as { video: unknown }).video
              : item;
          const converted = await videoToDataUrl(this.client, file ?? item);
          if (converted) videos.push(converted);
        }

        if (videos.length === 0) {
          throw new Error("Video indirilemedi.");
        }

        return {
          text: "Video hazır.",
          videos,
          model,
        };
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        const shouldFallback =
          isRetryableError(error) ||
          message.includes("video üretemedi") ||
          message.includes("not found") ||
          message.includes("no longer available") ||
          message.includes("not supported") ||
          message.includes("permission") ||
          message.includes("quota");

        if (!shouldFallback) {
          throw mapGeminiError(error);
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
