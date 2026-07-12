import type {
  ApiResponse,
  GeminiGenerateResponse,
  GeneratePayload,
  ImageGeneratePayload,
  VideoGeneratePayload,
} from "@/types/chat.types";
import type {
  GeminiImageGenerateResponse,
  GeminiVideoGenerateResponse,
} from "@/server/types/gemini.types";

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
  sources?: Array<{ title: string; uri: string }>;
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

async function readJsonBody<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function parseApiResponse(
  response: Response,
): Promise<GeminiGenerateResponse> {
  const data = await readJsonBody<ApiResponse<GeminiGenerateResponse>>(response);

  if (!data) {
    throw new ClientApiError(
      response.ok
        ? "Sunucudan geçersiz yanıt alındı."
        : `İstek başarısız oldu (${response.status}).`,
      "INTERNAL_ERROR",
      response.status || 502,
    );
  }

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
  const data =
    await readJsonBody<ApiResponse<GeminiImageGenerateResponse>>(response);

  if (!data) {
    throw new ClientApiError(
      response.ok
        ? "Sunucudan geçersiz yanıt alındı."
        : `Görsel isteği başarısız oldu (${response.status}).`,
      "INTERNAL_ERROR",
      response.status || 502,
    );
  }

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

async function parseVideoApiResponse(
  response: Response,
): Promise<GeminiVideoGenerateResponse> {
  const data =
    await readJsonBody<ApiResponse<GeminiVideoGenerateResponse>>(response);

  if (!data) {
    throw new ClientApiError(
      response.ok
        ? "Sunucudan geçersiz yanıt alındı."
        : `Video isteği başarısız oldu (${response.status}).`,
      "INTERNAL_ERROR",
      response.status || 502,
    );
  }

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

export async function generateGeminiVideo(
  payload: VideoGeneratePayload,
): Promise<GeminiVideoGenerateResponse> {
  let response: Response;

  try {
    response = await fetch("/api/gemini/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (error) {
    throw toFriendlyNetworkError(error);
  }

  return parseVideoApiResponse(response);
}

async function readGeminiStream(
  response: Response,
  onChunk: (text: string) => void,
  onSources?: (sources: Array<{ title: string; uri: string }>) => void,
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

    if (parsed.sources?.length) {
      onSources?.(parsed.sources);
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
  onSources?: (sources: Array<{ title: string; uri: string }>) => void,
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
      if (fallback.sources?.length) onSources?.(fallback.sources);
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

    const errorBody =
      await readJsonBody<ApiResponse<GeminiGenerateResponse>>(response);
    if (errorBody && !errorBody.success) {
      error = errorBody.error;
    }

    throw new ClientApiError(
      error.message,
      error.code,
      error.statusCode,
    );
  }

  let receivedText = false;
  try {
    await readGeminiStream(
      response,
      (chunk) => {
        receivedText = true;
        onChunk(chunk);
      },
      onSources,
    );
  } catch (error) {
    if (error instanceof ClientApiError) {
      throw error;
    }

    // Only fall back when nothing was streamed yet — otherwise we duplicate text.
    if (!receivedText && isNetworkFetchError(error)) {
      const fallback = await generateGeminiResponse({
        ...payload,
        structured: false,
      });
      if (fallback.text) {
        onChunk(fallback.text);
        if (fallback.sources?.length) onSources?.(fallback.sources);
        return;
      }
    }

    throw toFriendlyNetworkError(error);
  }
}
