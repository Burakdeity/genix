import type {
  ApiResponse,
  GeminiGenerateResponse,
  GeneratePayload,
} from "@/types/chat.types";

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
  const response = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseApiResponse(response);
}

export async function streamGeminiResponse(
  payload: Omit<GeneratePayload, "structured">,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch("/api/gemini/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
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
