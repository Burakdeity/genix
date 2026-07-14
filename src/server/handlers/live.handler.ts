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
import { LIVE_BRAND_BRIEFING_ADDON } from "@/lib/voice/live-brand-briefing";
import { getLiveSystemInstruction } from "@/lib/voice/live-system-prompt";
import type { VoiceProfileId } from "@/types/voice.types";

const sessionRequestSchema = z.object({
  voiceProfile: z
    .enum(["juniper", "ember", "breeze"])
    .optional()
    .default("juniper"),
  brandBriefing: z.boolean().optional().default(false),
});

export type LiveSessionRequest = z.infer<typeof sessionRequestSchema>;

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "local";
}

function resolveSystemInstruction(
  voiceProfile: VoiceProfileId,
  brandBriefing: boolean,
): string {
  const base = getLiveSystemInstruction(voiceProfile);
  if (!brandBriefing) return base;
  return `${base}${LIVE_BRAND_BRIEFING_ADDON}`;
}

function buildLiveConfig(voiceName: string, systemInstruction: string) {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction,
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
        prefixPaddingMs: 400,
        silenceDurationMs: 1500,
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
  systemInstruction: string,
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
    systemInstruction,
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
          ? buildLiveConfig(voiceName, systemInstruction)
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

    const { voiceProfile, brandBriefing } = parsed.data;
    const voiceName = getGeminiLiveVoiceName(voiceProfile);
    const systemInstruction = resolveSystemInstruction(
      voiceProfile,
      brandBriefing,
    );
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
            systemInstruction,
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
