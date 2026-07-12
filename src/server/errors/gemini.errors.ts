import { ApiError } from "@google/genai";

import { AppError } from "@/server/errors/api-error";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) {
    return error.status;
  }

  if (error instanceof AppError) {
    return error.statusCode;
  }

  return undefined;
}

export function mapGeminiError(error: unknown): AppError {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);
  const normalized = message.toLowerCase();

  if (
    status === 401 ||
    normalized.includes("api key") ||
    normalized.includes("api_key")
  ) {
    return new AppError(
      "Geçersiz veya eksik API anahtarı. Lütfen sunucu yapılandırmanızı kontrol edin.",
      "INVALID_API_KEY",
      401,
    );
  }

  if (
    status === 403 ||
    normalized.includes("permission_denied") ||
    normalized.includes("denied access")
  ) {
    return new AppError(
      "Google projenize erişim reddedildi. AI Studio'da API'nin etkin olduğunu ve projenizin askıya alınmadığını kontrol edin.",
      "GEMINI_API_ERROR",
      403,
    );
  }

  if (
    status === 429 ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("quota exceeded")
  ) {
    const quotaZero = normalized.includes("limit: 0");
    return new AppError(
      quotaZero
        ? "Ücretsiz API kotanız 0 görünüyor. Google AI Studio kotanızı kontrol edin veya faturalandırmayı etkinleştirin."
        : "İstek limiti aşıldı. Lütfen birkaç saniye sonra tekrar deneyin.",
      quotaZero ? "QUOTA_EXCEEDED" : "RATE_LIMIT",
      429,
    );
  }

  if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    normalized.includes("unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("overloaded") ||
    normalized.includes("temporarily")
  ) {
    return new AppError(
      "Model şu an yoğun. Birkaç saniye içinde otomatik yeniden denenecek; olmazsa tekrar deneyin.",
      "RATE_LIMIT",
      503,
    );
  }

  if (normalized.includes("quota") || normalized.includes("billing")) {
    return new AppError(
      "API kotanız doldu. Google AI Studio kotanızı kontrol edin.",
      "QUOTA_EXCEEDED",
      402,
    );
  }

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnreset") ||
    normalized.includes("etimedout")
  ) {
    return new AppError(
      "Gemini API'ye bağlanılamadı. İnternet bağlantınızı kontrol edin.",
      "NETWORK_ERROR",
      503,
    );
  }

  if (
    status === 404 ||
    normalized.includes("not found") ||
    normalized.includes("no longer available")
  ) {
    return new AppError(
      "Seçilen model kullanılamıyor. Lütfen başka bir model seçin veya sayfayı yenileyin.",
      "GEMINI_API_ERROR",
      404,
    );
  }

  if (
    normalized.includes("boş yanıt") ||
    normalized.includes("boş akış") ||
    normalized.includes("empty response")
  ) {
    return new AppError(
      "Model boş yanıt döndürdü. Başka modele geçiliyor veya tekrar deneyin.",
      "GEMINI_API_ERROR",
      502,
    );
  }

  const detail = message.replace(/\s+/g, " ").trim().slice(0, 180);

  return new AppError(
    detail
      ? `Gemini API isteği başarısız oldu: ${detail}`
      : "Gemini API isteği başarısız oldu. Lütfen tekrar deneyin.",
    "GEMINI_API_ERROR",
    status ?? 502,
  );
}
