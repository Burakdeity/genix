import { z } from "zod";

import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { chatImageAttachmentSchema } from "@/server/schemas/attachment.schema";
import { getGeminiService } from "@/server/services/gemini.service";
import { GEMINI_MODELS, type GeminiModelId } from "@/server/types/gemini.types";

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
});

const streamRequestSchema = z
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
    systemInstruction: z.string().max(8000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    enableSearch: z.boolean().optional().default(false),
    enableCodeExecution: z.boolean().optional().default(false),
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

export type StreamApiRequest = z.infer<typeof streamRequestSchema>;

export function parseStreamRequest(body: unknown): StreamApiRequest {
  const parsed = streamRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues.map((issue) => issue.message).join(" "),
      "VALIDATION_ERROR",
      400,
    );
  }

  return parsed.data;
}

export async function* createGeminiStream(
  request: StreamApiRequest,
): AsyncGenerator<string> {
  try {
    const service = getGeminiService();
    const isPro = request.model === GEMINI_MODELS.PRO;
    const stream = service.generateContentStream({
      prompt: request.prompt,
      history: request.history,
      images: request.images.map(({ mimeType, data }) => ({ mimeType, data })),
      model: request.model as GeminiModelId,
      systemInstruction: request.systemInstruction,
      enableSearch: request.enableSearch === true,
      enableCodeExecution: request.enableCodeExecution === true,
      config: {
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
        maxOutputTokens: isPro ? 8192 : 2048,
        ...(isPro ? { thinkingLevel: "low" as const } : { thinkingBudget: 0 }),
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
      if (chunk.done && chunk.sources?.length) {
        yield `data: ${JSON.stringify({
          sources: chunk.sources.slice(0, 6),
        })}\n\n`;
      }
    }
  } catch (error) {
    const mapped = toApiErrorResponse(error);
    yield `data: ${JSON.stringify({ error: mapped })}\n\n`;
    return;
  }
}

export { streamRequestSchema };
