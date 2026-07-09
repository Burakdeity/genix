"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getVoiceProfile } from "@/types/voice.types";
import type { VoiceProfileId } from "@/types/voice.types";

export function useSpeechSynthesis(profileId: VoiceProfileId) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text.trim() || typeof window === "undefined") return;

      const profile = getVoiceProfile(profileId);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;

      const voices = window.speechSynthesis.getVoices();
      const turkishVoice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("tr")) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
        voices[0];

      if (turkishVoice) {
        utterance.voice = turkishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [profileId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
  };
}
