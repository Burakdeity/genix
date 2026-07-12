import type { Schema } from "@google/genai";

/** Top-tier Gemini 3.x aliases available on this API key */
export const GEMINI_MODELS = {
  FLASH_LITE: "gemini-3.1-flash-lite",
  FLASH: "gemini-3.5-flash",
  PRO: "gemini-3.1-pro-preview",
} as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

export const GEMINI_IMAGE_MODELS = {
  FLASH: "gemini-2.5-flash-image",
  FLASH_NEW: "gemini-3.1-flash-image",
  PRO: "gemini-3-pro-image",
} as const;

export type GeminiImageModelId =
  (typeof GEMINI_IMAGE_MODELS)[keyof typeof GEMINI_IMAGE_MODELS];

export const GEMINI_VIDEO_MODELS = {
  FAST: "veo-3.1-fast-generate-preview",
  PRO: "veo-3.1-generate-preview",
  LITE: "veo-3.1-lite-generate-preview",
} as const;

export type GeminiVideoModelId =
  (typeof GEMINI_VIDEO_MODELS)[keyof typeof GEMINI_VIDEO_MODELS];

export type GeminiImageAspectRatio =
  | "1:1"
  | "3:2"
  | "2:3"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

export interface GeminiGeneratedImage {
  mimeType: string;
  /** Raw base64 without data: prefix */
  data: string;
  dataUrl: string;
}

export interface GeminiImageGenerateResponse {
  text: string;
  images: GeminiGeneratedImage[];
  model: string;
}

export interface GeminiGeneratedVideo {
  mimeType: string;
  dataUrl: string;
}

export interface GeminiVideoGenerateRequest {
  prompt: string;
  model?: GeminiVideoModelId;
  aspectRatio?: "16:9" | "9:16";
}

export interface GeminiVideoGenerateResponse {
  text: string;
  videos: GeminiGeneratedVideo[];
  model: string;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiStructuredOutputConfig {
  responseMimeType: "application/json";
  responseJsonSchema: Schema;
}

export interface GeminiGroundingSource {
  title: string;
  uri: string;
}

export interface GeminiGenerateRequest {
  prompt: string;
  /** Prior turns + current user message for multi-turn chat */
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  /** Optional images attached to the current user prompt */
  images?: Array<{
    mimeType: string;
    data: string;
  }>;
  model?: GeminiModelId;
  systemInstruction?: string;
  config?: GeminiGenerationConfig;
  structuredOutput?: GeminiStructuredOutputConfig;
  /** Google Search grounding for up-to-date research answers */
  enableSearch?: boolean;
  /** Sandboxed code execution tool */
  enableCodeExecution?: boolean;
}

export interface GeminiImageGenerateRequest {
  prompt: string;
  model?: GeminiImageModelId;
  aspectRatio?: GeminiImageAspectRatio;
  /** Optional output size for Pro image models: 1K | 2K | 4K */
  imageSize?: "1K" | "2K" | "4K" | "512";
  /** Optional reference images for edit / guided generation */
  images?: Array<{
    mimeType: string;
    data: string;
  }>;
}

export interface GeminiGenerateResponse {
  text: string;
  model: GeminiModelId;
  structuredData?: unknown;
  sources?: GeminiGroundingSource[];
}

export interface GeminiStreamChunk {
  text: string;
  done: boolean;
  sources?: GeminiGroundingSource[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
