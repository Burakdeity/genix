import { GoogleGenAI, Modality } from "@google/genai";
import { z } from "zod";

import { getServerEnv } from "@/server/config/env";
import { AppError, toApiErrorResponse } from "@/server/errors/api-error";
import { mapGeminiError } from "@/server/errors/gemini.errors";
import type { LiveSessionResponse } from "@/server/types/live.types";
import type { ApiResponse } from "@/server/types/gemini.types";
import { checkRateLimit } from "@/server/utils/rate-limit";
import {
  GEMINI_LIVE_MODEL,
  getGeminiLiveVoiceName,
} from "@/lib/voice/gemini-voice-map";
import { LIVE_SYSTEM_INSTRUCTION } from "@/lib/voice/live-system-prompt";

const sessionRequestSchema = z.object({
  voiceProfile: z
    .enum(["juniper", "ember", "breeze"])
    .optional()
    .default("juniper"),
});

export type LiveSessionRequest = z.infer<typeof sessionRequestSchema>;

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "local";
}

export async function handleLiveSessionRequest(
  request: Request,
  body: unknown,
): Promise<ApiResponse<LiveSessionResponse>> {
  try {
    const parsed = sessionRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((issue) => issue.message).join(" "),
        "VALIDATION_ERROR",
        400,
      );
    }

    const clientKey = getClientKey(request);
    const rate = checkRateLimit(`live:${clientKey}`, 12, 60_000);
    if (!rate.allowed) {
      throw new AppError(
        "Çok fazla ses oturumu isteği. Lütfen biraz bekleyin.",
        "RATE_LIMIT",
        429,
      );
    }

    const { voiceProfile } = parsed.data;
    const voiceName = getGeminiLiveVoiceName(voiceProfile);
    const { GEMINI_API_KEY } = getServerEnv();

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(
      Date.now() + 2 * 60 * 1000,
    ).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: GEMINI_LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: LIVE_SYSTEM_INSTRUCTION,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
              languageCode: "tr-TR",
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    });

    const tokenValue = token.name?.trim();
    if (!tokenValue) {
      throw new AppError(
        "Ses oturumu anahtarı oluşturulamadı.",
        "GEMINI_API_ERROR",
        502,
      );
    }

    return {
      success: true,
      data: {
        token: tokenValue,
        model: GEMINI_LIVE_MODEL,
        apiVersion: "v1alpha",
        voiceProfile,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: toApiErrorResponse(error) };
    }
    return { success: false, error: toApiErrorResponse(mapGeminiError(error)) };
  }
}
