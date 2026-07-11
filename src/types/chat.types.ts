import type { ChatStructuredResponse } from "@/server/schemas/chat-response.schema";
import type {
  ApiResponse,
  GeminiGenerateResponse,
  GeminiModelId,
} from "@/server/types/gemini.types";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  structuredData?: ChatStructuredResponse;
  createdAt: number;
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
  model: GeminiModelId;
  systemInstruction?: string;
  temperature: number;
  structured: boolean;
}

export type { ApiResponse, GeminiGenerateResponse, ChatStructuredResponse };
