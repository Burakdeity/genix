import { z } from "zod";

import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { getGeminiService } from "@/server/services/gemini.service";
import {
  GEMINI_VIDEO_MODELS,
  type ApiResponse,
  type GeminiVideoGenerateResponse,
} from "@/server/types/gemini.types";

const videoRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z
    .enum([
      GEMINI_VIDEO_MODELS.FAST,
      GEMINI_VIDEO_MODELS.PRO,
      GEMINI_VIDEO_MODELS.LITE,
    ])
    .optional()
    .default(GEMINI_VIDEO_MODELS.FAST),
  aspectRatio: z.enum(["16:9", "9:16"]).optional().default("16:9"),
});

export type VideoApiRequest = z.infer<typeof videoRequestSchema>;

function createErrorResponse(
  error: unknown,
): ApiResponse<GeminiVideoGenerateResponse> {
  return {
    success: false,
    error: toApiErrorResponse(error),
  };
}

export async function handleVideoGenerateRequest(
  body: unknown,
): Promise<ApiResponse<GeminiVideoGenerateResponse>> {
  try {
    const parsed = videoRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((issue) => issue.message).join(" "),
        "VALIDATION_ERROR",
        400,
      );
    }

    const { prompt, model, aspectRatio } = parsed.data;
    const service = getGeminiService();
    const data = await service.generateVideo({
      prompt,
      model,
      aspectRatio,
    });

    return { success: true, data };
  } catch (error) {
    return createErrorResponse(error);
  }
}
