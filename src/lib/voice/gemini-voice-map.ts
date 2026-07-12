import type { VoiceProfileId } from "@/types/voice.types";

/** Gemini Live prebuilt voice names */
export const GEMINI_LIVE_VOICES: Record<VoiceProfileId, string> = {
  juniper: "Kore",
  ember: "Charon",
  breeze: "Aoede",
};

export function getGeminiLiveVoiceName(profileId: VoiceProfileId): string {
  return GEMINI_LIVE_VOICES[profileId] ?? GEMINI_LIVE_VOICES.juniper;
}

/** Current recommended Live native-audio model */
export const GEMINI_LIVE_MODEL = "gemini-3.1-flash-live-preview" as const;

/** Fallback if 3.1 is unavailable for the API key / region */
export const GEMINI_LIVE_MODEL_FALLBACK =
  "gemini-2.5-flash-native-audio-preview-12-2025" as const;
