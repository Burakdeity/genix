import type { VoiceProfileId } from "@/types/voice.types";

export interface LiveSessionResponse {
  token: string;
  model: string;
  apiVersion: "v1alpha";
  voiceProfile: VoiceProfileId;
}
