import { z } from "zod";

import { AppError } from "@/server/errors/api-error";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingKey = parsed.error.issues.some((issue) =>
      issue.path.includes("GEMINI_API_KEY"),
    );

    if (missingKey) {
      throw new AppError(
        "GEMINI_API_KEY tanımlı değil. Proje köküne .env dosyası ekleyip Google AI Studio anahtarınızı yazın.",
        "INVALID_API_KEY",
        500,
      );
    }

    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new AppError(
      `Sunucu ortam değişkenleri geçersiz: ${message}`,
      "INTERNAL_ERROR",
      500,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
