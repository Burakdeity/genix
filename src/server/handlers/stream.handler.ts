import { z } from "zod";

import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { getGeminiService } from "@/server/services/gemini.service";
import { GEMINI_MODELS, type GeminiModelId } from "@/server/types/gemini.types";

const streamRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt boş olamaz.").max(8000),
  model: z
    .enum([
      GEMINI_MODELS.FLASH_LITE,
      GEMINI_MODELS.FLASH,
      GEMINI_MODELS.PRO,
    ])
    .optional()
    .default(GEMINI_MODELS.FLASH_LITE),
  systemInstruction: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
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
    const stream = service.generateContentStream({
      prompt: request.prompt,
      model: request.model as GeminiModelId,
      systemInstruction: request.systemInstruction,
      config: {
        temperature: request.temperature,
        maxOutputTokens: 1536,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    const mapped = toApiErrorResponse(error);
    yield `data: ${JSON.stringify({ error: mapped })}\n\n`;
    return;
  }
}

export { streamRequestSchema };
