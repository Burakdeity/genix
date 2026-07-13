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
  GEMINI_LIVE_MODEL_FALLBACK,
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

function buildLiveConfig(voiceName: string) {
  return {
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
    // Longer silence tolerance = fewer mid-sentence cutoffs.
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false,
        startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
        endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
        prefixPaddingMs: 300,
        silenceDurationMs: 1100,
      },
      // Echo from speakers often falsely "interrupts"; client also gates mic.
      activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
    },
  };
}

async function createLiveToken(
  apiKey: string,
  model: string,
  voiceName: string,
  includeVadConfig: boolean,
) {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "v1alpha" },
  });

  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(
    Date.now() + 2 * 60 * 1000,
  ).toISOString();

  const baseConfig = {
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
  };

  return ai.authTokens.create({
    config: {
      uses: 1,
      expireTime,
      newSessionExpireTime,
      liveConnectConstraints: {
        model,
        config: includeVadConfig
          ? buildLiveConfig(voiceName)
          : baseConfig,
      },
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
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

    const models = [GEMINI_LIVE_MODEL, GEMINI_LIVE_MODEL_FALLBACK];
    let lastError: unknown;

    for (const model of models) {
      for (const includeVad of [true, false]) {
        try {
          const token = await createLiveToken(
            GEMINI_API_KEY,
            model,
            voiceName,
            includeVad,
          );
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
              model,
              apiVersion: "v1alpha",
              voiceProfile,
            },
          };
        } catch (error) {
          lastError = error;
          const message =
            error instanceof Error
              ? error.message.toLowerCase()
              : String(error);
          const retryable =
            message.includes("not found") ||
            message.includes("not supported") ||
            message.includes("invalid") ||
            message.includes("unknown") ||
            message.includes("thinking") ||
            message.includes("sensitivity") ||
            message.includes("realtime");
          if (!retryable) break;
        }
      }
    }

    if (lastError instanceof AppError) {
      return { success: false, error: toApiErrorResponse(lastError) };
    }
    return {
      success: false,
      error: toApiErrorResponse(mapGeminiError(lastError)),
    };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: toApiErrorResponse(error) };
    }
    return { success: false, error: toApiErrorResponse(mapGeminiError(error)) };
  }
}
