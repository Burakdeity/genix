import { z } from "zod";

import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { chatImageAttachmentSchema } from "@/server/schemas/attachment.schema";
import { chatStructuredJsonSchema } from "@/server/schemas/chat-response.schema";
import { getGeminiService } from "@/server/services/gemini.service";
import {
  GEMINI_MODELS,
  type ApiResponse,
  type GeminiGenerateResponse,
  type GeminiModelId,
} from "@/server/types/gemini.types";

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
});

const generateRequestSchema = z
  .object({
    prompt: z.string().max(8000).default(""),
    history: z.array(historyItemSchema).max(40).optional().default([]),
    images: z.array(chatImageAttachmentSchema).max(4).optional().default([]),
    model: z
      .enum([
        GEMINI_MODELS.FLASH_LITE,
        GEMINI_MODELS.FLASH,
        GEMINI_MODELS.PRO,
      ])
      .optional()
      .default(GEMINI_MODELS.FLASH_LITE),
    systemInstruction: z.string().max(16000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    structured: z.boolean().optional().default(false),
    enableSearch: z.boolean().optional().default(false),
    enableCodeExecution: z.boolean().optional().default(false),
    maxOutputTokens: z.number().int().min(256).max(16384).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.prompt.trim() && value.images.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Prompt veya görsel gerekli.",
        path: ["prompt"],
      });
    }
  });

export type GenerateApiRequest = z.infer<typeof generateRequestSchema>;

function createErrorResponse(
  error: unknown,
): ApiResponse<GeminiGenerateResponse> {
  const mapped = toApiErrorResponse(error);

  return {
    success: false,
    error: mapped,
  };
}

export async function handleGenerateRequest(
  body: unknown,
): Promise<ApiResponse<GeminiGenerateResponse>> {
  try {
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((issue) => issue.message).join(" "),
        "VALIDATION_ERROR",
        400,
      );
    }

    const {
      prompt,
      history,
      images,
      model,
      systemInstruction,
      temperature,
      structured,
      enableSearch,
      enableCodeExecution,
      maxOutputTokens: requestedTokens,
    } = parsed.data;

    const isPro = model === GEMINI_MODELS.PRO;
    const defaultTokens = isPro ? 8192 : 4096;
    const maxOutputTokens = Math.min(
      requestedTokens ?? defaultTokens,
      isPro ? 16384 : 8192,
    );
    const service = getGeminiService();
    const data = await service.generateContent({
      prompt,
      history,
      images: images.map(({ mimeType, data }) => ({ mimeType, data })),
      model: model as GeminiModelId,
      systemInstruction,
      enableSearch: structured ? false : enableSearch === true,
      enableCodeExecution: structured ? false : enableCodeExecution === true,
      config: {
        ...(temperature !== undefined ? { temperature } : {}),
        maxOutputTokens,
        ...(isPro ? { thinkingLevel: "low" as const } : { thinkingBudget: 0 }),
      },
      ...(structured
        ? {
            structuredOutput: {
              responseMimeType: "application/json",
              responseJsonSchema: chatStructuredJsonSchema,
            },
          }
        : {}),
    });

    return { success: true, data };
  } catch (error) {
    return createErrorResponse(error);
  }
}

export { generateRequestSchema };
