import { z } from "zod";

import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { chatImageAttachmentSchema } from "@/server/schemas/attachment.schema";
import { getGeminiService } from "@/server/services/gemini.service";
import {
  GEMINI_IMAGE_MODELS,
  type ApiResponse,
  type GeminiImageGenerateResponse,
} from "@/server/types/gemini.types";

const imageRequestSchema = z
  .object({
    prompt: z.string().max(4000).default(""),
    images: z.array(chatImageAttachmentSchema).max(4).optional().default([]),
    model: z
      .enum([
        GEMINI_IMAGE_MODELS.FLASH,
        GEMINI_IMAGE_MODELS.FLASH_NEW,
        GEMINI_IMAGE_MODELS.PRO,
      ])
      .optional()
      .default(GEMINI_IMAGE_MODELS.PRO),
    imageSize: z.enum(["1K", "2K", "4K", "512"]).optional().default("2K"),
    aspectRatio: z
      .enum([
        "1:1",
        "3:2",
        "2:3",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "21:9",
      ])
      .optional(),
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

export type ImageApiRequest = z.infer<typeof imageRequestSchema>;

function createErrorResponse(
  error: unknown,
): ApiResponse<GeminiImageGenerateResponse> {
  const mapped = toApiErrorResponse(error);

  return {
    success: false,
    error: mapped,
  };
}

export async function handleImageGenerateRequest(
  body: unknown,
): Promise<ApiResponse<GeminiImageGenerateResponse>> {
  try {
    const parsed = imageRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((issue) => issue.message).join(" "),
        "VALIDATION_ERROR",
        400,
      );
    }

    const { prompt, model, aspectRatio, images, imageSize } = parsed.data;
    const service = getGeminiService();
    const data = await service.generateImage({
      prompt,
      model,
      aspectRatio,
      imageSize,
      images: images.map(({ mimeType, data }) => ({ mimeType, data })),
    });

    return { success: true, data };
  } catch (error) {
    return createErrorResponse(error);
  }
}

export { imageRequestSchema };
