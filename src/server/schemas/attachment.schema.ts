import { z } from "zod";

export const chatImageAttachmentSchema = z.object({
  mimeType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|webp|gif)$/i, "Desteklenmeyen görsel türü."),
  data: z.string().min(1).max(8_000_000),
  name: z.string().max(200).optional(),
});

export type ChatImageAttachment = z.infer<typeof chatImageAttachmentSchema>;
