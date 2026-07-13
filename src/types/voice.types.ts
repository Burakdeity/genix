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
    name: "Ada",
    description: "Sıcak, neşeli ve biraz cilveli",
    pitch: 1.05,
    rate: 1,
  },
  {
    id: "ember",
    name: "Kaan",
    description: "Sakin, esprili ve samimi",
    pitch: 0.92,
    rate: 0.95,
  },
  {
    id: "breeze",
    name: "Ela",
    description: "Canlı, tatlı ve oyuncu",
    pitch: 1.12,
    rate: 1.05,
  },
];

export function getVoiceProfile(id: VoiceProfileId): VoiceProfile {
  return VOICE_PROFILES.find((profile) => profile.id === id) ?? VOICE_PROFILES[0];
}
