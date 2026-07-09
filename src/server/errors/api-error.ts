export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_API_KEY"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR"
  | "GEMINI_API_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export function toApiErrorResponse(error: unknown): {
  code: ApiErrorCode;
  message: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    statusCode: 500,
  };
}
