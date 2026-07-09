import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { GoogleGenAI } from "@google/genai";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  console.log("Key prefix:", apiKey.slice(0, 6));
  console.log("Key length:", apiKey.length);

  const ai = new GoogleGenAI({ apiKey });

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: "Merhaba",
      });
      console.log(`OK ${model}:`, response.text?.slice(0, 60));
      return;
    } catch (error) {
      console.error(`FAIL ${model}:`);
      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error("Unhandled:", error);
  process.exit(1);
});
