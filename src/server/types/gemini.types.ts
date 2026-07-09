import type { Schema } from "@google/genai";

export const GEMINI_MODELS = {
  FLASH_LITE: "gemini-2.5-flash-lite",
  FLASH: "gemini-2.5-flash",
  PRO: "gemini-2.5-pro",
} as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

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
  model?: GeminiModelId;
  systemInstruction?: string;
  config?: GeminiGenerationConfig;
  structuredOutput?: GeminiStructuredOutputConfig;
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
