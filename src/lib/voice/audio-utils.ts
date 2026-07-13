export const LIVE_INPUT_SAMPLE_RATE = 16_000;
export const LIVE_OUTPUT_SAMPLE_RATE = 24_000;

/** RMS threshold for barge-in while assistant is speaking (0–1). */
export const BARGE_IN_RMS = 0.085;
/** Ignore barge-in briefly after assistant starts talking (echo settle). */
export const BARGE_IN_GUARD_MS = 900;

export function float32ToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

export function int16ToFloat32(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    output[i] = (input[i] ?? 0) / 0x8000;
  }
  return output;
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const sampleCount = Math.floor(bytes.byteLength / 2);
  return new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
}

export function int16ToBase64(input: Int16Array): string {
  const bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export function downsampleTo16k(
  input: Float32Array,
  inputSampleRate: number,
): Float32Array {
  if (inputSampleRate === LIVE_INPUT_SAMPLE_RATE) {
    return input;
  }

  const ratio = inputSampleRate / LIVE_INPUT_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j] ?? 0;
    }
    output[i] = sum / Math.max(1, end - start);
  }

  return output;
}

export function rmsLevel(input: Float32Array): number {
  if (input.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    const sample = input[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / input.length);
}

export class PcmPlaybackQueue {
  private readonly context: AudioContext;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private onDrain: (() => void) | null = null;
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.nextStartTime = context.currentTime;
  }

  setOnDrain(callback: (() => void) | null): void {
    this.onDrain = callback;
  }

  get isPlaying(): boolean {
    return this.activeSources.size > 0 || this.nextStartTime > this.context.currentTime + 0.04;
  }

  get remainingMs(): number {
    return Math.max(0, (this.nextStartTime - this.context.currentTime) * 1000);
  }

  async ensureRunning(): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  enqueuePcm16(base64: string, sampleRate = LIVE_OUTPUT_SAMPLE_RATE): void {
    const pcm = base64ToInt16(base64);
    if (pcm.length === 0) return;

    void this.ensureRunning();

    const floats = int16ToFloat32(pcm);
    const buffer = this.context.createBuffer(1, floats.length, sampleRate);
    buffer.copyToChannel(new Float32Array(floats), 0);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);

    // Small lookahead so chunks stitch without gaps under load.
    const startAt = Math.max(this.context.currentTime + 0.03, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.activeSources.add(source);
    this.clearDrainTimer();

    source.onended = () => {
      this.activeSources.delete(source);
      this.scheduleDrainCheck();
    };
  }

  flush(): void {
    this.clearDrainTimer();
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.activeSources.clear();
    this.nextStartTime = this.context.currentTime;
  }

  private clearDrainTimer(): void {
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
  }

  private scheduleDrainCheck(): void {
    this.clearDrainTimer();
    const remaining = this.remainingMs;
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      if (!this.isPlaying) {
        this.onDrain?.();
      } else {
        this.scheduleDrainCheck();
      }
    }, Math.max(40, remaining + 40));
  }
}

/**
 * Keep AudioContext / mic stream primed from a user gesture so later async
 * Live API setup does not leave audio suspended (silent mic + silent playback).
 */
let primedCapture: AudioContext | null = null;
let primedPlayback: AudioContext | null = null;
let primedStream: MediaStream | null = null;

export async function primeVoiceAudio(): Promise<{
  capture: AudioContext;
  playback: AudioContext;
  stream: MediaStream;
}> {
  if (!primedCapture || primedCapture.state === "closed") {
    primedCapture = new AudioContext({ sampleRate: 48_000 });
  }
  if (!primedPlayback || primedPlayback.state === "closed") {
    primedPlayback = new AudioContext({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
  }

  if (primedCapture.state === "suspended") {
    await primedCapture.resume();
  }
  if (primedPlayback.state === "suspended") {
    await primedPlayback.resume();
  }

  const liveTracks =
    primedStream?.getAudioTracks().some((track) => track.readyState === "live") ??
    false;

  if (!primedStream || !liveTracks) {
    primedStream?.getTracks().forEach((track) => track.stop());
    primedStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  }

  return {
    capture: primedCapture,
    playback: primedPlayback,
    stream: primedStream,
  };
}

export function takePrimedVoiceAudio(): {
  capture: AudioContext;
  playback: AudioContext;
  stream: MediaStream;
} | null {
  if (
    !primedCapture ||
    primedCapture.state === "closed" ||
    !primedPlayback ||
    primedPlayback.state === "closed" ||
    !primedStream
  ) {
    return null;
  }

  const bundle = {
    capture: primedCapture,
    playback: primedPlayback,
    stream: primedStream,
  };

  // Ownership moves to the live session; do not close on next prime.
  primedCapture = null;
  primedPlayback = null;
  primedStream = null;
  return bundle;
}

export function releasePrimedVoiceAudio(): void {
  primedStream?.getTracks().forEach((track) => track.stop());
  primedStream = null;
  void primedCapture?.close();
  void primedPlayback?.close();
  primedCapture = null;
  primedPlayback = null;
}
