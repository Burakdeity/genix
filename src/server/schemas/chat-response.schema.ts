import { Type, type Schema } from "@google/genai";
import { z } from "zod";

export const chatStructuredResponseSchema = z.object({
  answer: z.string().min(1),
  confidence: z.number().min(0).max(1),
  followUpQuestions: z.array(z.string()).max(3),
});

export type ChatStructuredResponse = z.infer<
  typeof chatStructuredResponseSchema
>;

export const chatStructuredJsonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "Kullanıcının sorusuna verilen ana yanıt.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Yanıtın güven skoru (0 ile 1 arası).",
    },
    followUpQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "Kullanıcının sorabileceği takip sorusu.",
      },
      description: "En fazla 3 takip sorusu.",
    },
  },
  required: ["answer", "confidence", "followUpQuestions"],
};
