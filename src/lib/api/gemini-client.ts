import type {
  ApiResponse,
  GeminiGenerateResponse,
  GeneratePayload,
  ImageGeneratePayload,
} from "@/types/chat.types";
import type { GeminiImageGenerateResponse } from "@/server/types/gemini.types";

export class ClientApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "ClientApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

interface StreamEventPayload {
  text?: string;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
}

function parseStreamEvent(line: string): StreamEventPayload | null {
  if (!line.startsWith("data: ")) {
    return null;
  }

  const payload = line.slice(6).trim();
  if (!payload || payload === "[DONE]") {
    return null;
  }

  try {
    return JSON.parse(payload) as StreamEventPayload;
  } catch {
    return null;
  }
}

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === "TypeError" ||
    message.includes("load failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("fetch failed")
  );
}

function toFriendlyNetworkError(error: unknown): ClientApiError {
  const raw =
    error instanceof Error && error.message.trim()
      ? error.message
      : "Bağlantı hatası";

  // Safari/iOS often surfaces a bare "Load failed".
  if (isNetworkFetchError(error)) {
    return new ClientApiError(
      "Bağlantı kurulamadı. www.orwixai.com adresinden deneyin veya ağı kontrol edip tekrar deneyin.",
      "NETWORK_ERROR",
      0,
    );
  }

  return new ClientApiError(raw, "NETWORK_ERROR", 0);
}

async function parseApiResponse(
  response: Response,
): Promise<GeminiGenerateResponse> {
  const data: ApiResponse<GeminiGenerateResponse> = await response.json();

  if (!response.ok || !data.success) {
    const error = data.success
      ? {
          code: "INTERNAL_ERROR",
          message: "Beklenmeyen bir hata oluştu.",
          statusCode: response.status,
        }
      : data.error;

    throw new ClientApiError(
      error.message,
      error.code,
      error.statusCode,
    );
  }

  return data.data;
}

export async function generateGeminiResponse(
  payload: GeneratePayload,
): Promise<GeminiGenerateResponse> {
  let response: Response;

  try {
    response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (error) {
    throw toFriendlyNetworkError(error);
  }

  return parseApiResponse(response);
}

async function parseImageApiResponse(
  response: Response,
): Promise<GeminiImageGenerateResponse> {
  const data: ApiResponse<GeminiImageGenerateResponse> = await response.json();

  if (!response.ok || !data.success) {
    const error = data.success
      ? {
          code: "INTERNAL_ERROR",
          message: "Beklenmeyen bir hata oluştu.",
          statusCode: response.status,
        }
      : data.error;

    throw new ClientApiError(error.message, error.code, error.statusCode);
  }

  return data.data;
}

export async function generateGeminiImage(
  payload: ImageGeneratePayload,
): Promise<GeminiImageGenerateResponse> {
  let response: Response;

  try {
    response = await fetch("/api/gemini/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (error) {
    throw toFriendlyNetworkError(error);
  }

  return parseImageApiResponse(response);
}

async function readGeminiStream(
  response: Response,
  onChunk: (text: string) => void,
): Promise<void> {
  if (!response.body) {
    throw new ClientApiError(
      "Akış başlatılamadı.",
      "INTERNAL_ERROR",
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;

  const processLine = (line: string): void => {
    const parsed = parseStreamEvent(line);
    if (!parsed) {
      return;
    }

    if (parsed.error) {
      throw new ClientApiError(
        parsed.error.message,
        parsed.error.code,
        parsed.error.statusCode,
      );
    }

    if (parsed.text) {
      receivedText = true;
      onChunk(parsed.text);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      processLine(line);
    }
  }

  if (buffer.trim()) {
    processLine(buffer);
  }

  if (!receivedText) {
    throw new ClientApiError(
      "Gemini'den boş yanıt alındı. Lütfen tekrar deneyin.",
      "EMPTY_RESPONSE",
      502,
    );
  }
}

export async function streamGeminiResponse(
  payload: Omit<GeneratePayload, "structured">,
  onChunk: (text: string) => void,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/gemini/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (error) {
    // Mobile Safari frequently fails SSE/fetch streams with "Load failed".
    // Fall back to the non-streaming endpoint.
    const fallback = await generateGeminiResponse({
      ...payload,
      structured: false,
    });
    if (fallback.text) {
      onChunk(fallback.text);
      return;
    }
    throw toFriendlyNetworkError(error);
  }

  if (!response.ok) {
    let error = {
      code: "INTERNAL_ERROR",
      message: "Akış başlatılamadı.",
      statusCode: response.status,
    };

    try {
      const errorBody: ApiResponse<GeminiGenerateResponse> =
        await response.json();
      if (!errorBody.success) {
        error = errorBody.error;
      }
    } catch {
      // Response body may not be JSON.
    }

    throw new ClientApiError(
      error.message,
      error.code,
      error.statusCode,
    );
  }

  try {
    await readGeminiStream(response, onChunk);
  } catch (error) {
    if (error instanceof ClientApiError) {
      throw error;
    }

    if (isNetworkFetchError(error)) {
      const fallback = await generateGeminiResponse({
        ...payload,
        structured: false,
      });
      if (fallback.text) {
        onChunk(fallback.text);
        return;
      }
    }

    throw toFriendlyNetworkError(error);
  }
}
