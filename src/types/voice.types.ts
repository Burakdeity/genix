export type VoiceProfileId = "juniper" | "ember" | "breeze";

export interface VoiceProfile {
  id: VoiceProfileId;
  name: string;
  description: string;
  pitch: number;
  rate: number;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "juniper",
    name: "Juniper",
    description: "Açık fikirli ve neşeli",
    pitch: 1.05,
    rate: 1,
  },
  {
    id: "ember",
    name: "Ember",
    description: "Kendinden emin ve iyimser",
    pitch: 0.92,
    rate: 0.95,
  },
  {
    id: "breeze",
    name: "Breeze",
    description: "Canlı ve içten",
    pitch: 1.12,
    rate: 1.05,
  },
];

export function getVoiceProfile(id: VoiceProfileId): VoiceProfile {
  return VOICE_PROFILES.find((profile) => profile.id === id) ?? VOICE_PROFILES[0];
}
