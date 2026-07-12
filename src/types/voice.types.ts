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
    description: "Sıcak ve neşeli Orwix sesi",
    pitch: 1.05,
    rate: 1,
  },
  {
    id: "ember",
    name: "Kaan",
    description: "Sakin ve net Orwix sesi",
    pitch: 0.92,
    rate: 0.95,
  },
  {
    id: "breeze",
    name: "Ela",
    description: "Canlı ve içten Orwix sesi",
    pitch: 1.12,
    rate: 1.05,
  },
];

export function getVoiceProfile(id: VoiceProfileId): VoiceProfile {
  return VOICE_PROFILES.find((profile) => profile.id === id) ?? VOICE_PROFILES[0];
}
