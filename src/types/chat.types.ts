import type { ChatStructuredResponse } from "@/server/schemas/chat-response.schema";
import type {
  ApiResponse,
  GeminiGenerateResponse,
  GeminiModelId,
} from "@/server/types/gemini.types";
import type { OrwixMode } from "@/content/orwix-content";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  images?: Array<{
    mimeType: string;
    dataUrl: string;
  }>;
  videos?: Array<{
    mimeType: string;
    dataUrl: string;
  }>;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
  structuredData?: ChatStructuredResponse;
  createdAt: number;
}

export interface ChatAttachment {
  mimeType: string;
  data: string;
  dataUrl: string;
  name?: string;
}

export interface ChatSettings {
  model: GeminiModelId;
  temperature: number;
  systemInstruction: string;
  structuredOutput: boolean;
  streaming: boolean;
}

export interface GeneratePayload {
  prompt: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  images?: Array<{
    mimeType: string;
    data: string;
    name?: string;
  }>;
  model: GeminiModelId;
  systemInstruction?: string;
  temperature: number;
  structured: boolean;
  enableSearch?: boolean;
  enableCodeExecution?: boolean;
}

export interface ImageGeneratePayload {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  imageSize?: "1K" | "2K" | "4K" | "512";
  images?: Array<{
    mimeType: string;
    data: string;
    name?: string;
  }>;
}

export interface VideoGeneratePayload {
  prompt: string;
  model?: string;
  aspectRatio?: "16:9" | "9:16";
}

export type SendMessageOptions = {
  mode?: OrwixMode;
};

export type { ApiResponse, GeminiGenerateResponse, ChatStructuredResponse };
