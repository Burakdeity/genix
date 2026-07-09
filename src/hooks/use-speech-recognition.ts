"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return (
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null
  );
}

function mapRecognitionError(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofonu açın.";
    case "no-speech":
      return "Ses algılanmadı. Tekrar konuşmayı deneyin.";
    case "audio-capture":
      return "Mikrofon bulunamadı veya kullanılamıyor.";
    case "network":
      return "Ses tanıma için internet bağlantısı gerekli.";
    default:
      return "Mikrofon veya ses tanıma hatası oluştu.";
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onFinalTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
}

export function useSpeechRecognition({
  lang = "tr-TR",
  continuous = true,
  onFinalTranscript,
  onInterimTranscript,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
    onInterimRef.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError("Tarayıcınız canlı ses tanımayı desteklemiyor. Chrome kullanın.");
      return;
    }

    if (listeningRef.current) {
      return;
    }

    setError(null);
    setTranscript("");

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onstart = () => {
      listeningRef.current = true;
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(mapRecognitionError(event.error));
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalText += text;
        } else {
          interim += text;
        }
      }

      const combined = `${finalText}${interim}`.trim();
      setTranscript(combined);

      if (interim.trim()) {
        onInterimRef.current?.(interim.trim());
      }

      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim());
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError("Mikrofon başlatılamadı. Sayfayı yenileyip tekrar deneyin.");
      listeningRef.current = false;
      setIsListening(false);
    }
  }, [continuous, lang]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
    resetTranscript,
  };
}
