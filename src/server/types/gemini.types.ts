import type { Schema } from "@google/genai";

export const GEMINI_MODELS = {
  FLASH_LITE: "gemini-2.5-flash-lite",
  FLASH: "gemini-2.5-flash",
  PRO: "gemini-2.5-pro",
} as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

export const GEMINI_IMAGE_MODELS = {
  FLASH: "gemini-2.5-flash-image",
  FLASH_NEW: "gemini-3.1-flash-image",
  PRO: "gemini-3-pro-image",
} as const;

export type GeminiImageModelId =
  (typeof GEMINI_IMAGE_MODELS)[keyof typeof GEMINI_IMAGE_MODELS];

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
}

export interface GeminiImageGenerateRequest {
  prompt: string;
  model?: GeminiImageModelId;
  aspectRatio?: GeminiImageAspectRatio;
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
}

export interface GeminiStreamChunk {
  text: string;
  done: boolean;
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
