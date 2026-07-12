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

export const GEMINI_LIVE_MODEL =
  "gemini-2.5-flash-native-audio-preview-12-2025" as const;
