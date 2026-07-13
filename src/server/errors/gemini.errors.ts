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
      "Kimlik doğrulama başarısız. Lütfen daha sonra tekrar deneyin.",
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
      "Bu isteğe şu an erişilemiyor. Lütfen biraz sonra tekrar deneyin.",
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
        ? "Hizmet kapasitesi dolu. Lütfen kısa süre sonra tekrar deneyin."
        : "Çok fazla istek gönderildi. Lütfen birkaç saniye sonra tekrar deneyin.",
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
      "Model şu an yoğun. Birkaç saniye sonra tekrar deneyin.",
      "RATE_LIMIT",
      503,
    );
  }

  if (
    normalized.includes("thinking") &&
    (normalized.includes("budget") || normalized.includes("level"))
  ) {
    return new AppError(
      "Model düşünme ayarı reddedildi. Sayfayı yenileyip tekrar deneyin.",
      "GEMINI_API_ERROR",
      400,
    );
  }

  if (normalized.includes("quota") || normalized.includes("billing")) {
    return new AppError(
      "Hizmet kotası doldu. Lütfen kısa süre sonra tekrar deneyin.",
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
      "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.",
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
      "Seçilen model şu an kullanılamıyor. Lütfen sayfayı yenileyip tekrar deneyin.",
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
      "Boş yanıt alındı. Lütfen isteğinizi yeniden gönderin.",
      "GEMINI_API_ERROR",
      502,
    );
  }

  return new AppError(
    "İstek tamamlanamadı. Lütfen tekrar deneyin.",
    "GEMINI_API_ERROR",
    status ?? 502,
  );
}
