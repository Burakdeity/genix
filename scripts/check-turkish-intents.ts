import assert from "node:assert/strict";

import {
  isImageEditPrompt,
  isImageGenerationPrompt,
  shouldRouteToImageEdit,
} from "../src/lib/chat/image-prompt";
import { detectPromptMode } from "../src/lib/chat/mode-prompts";
import { isVideoGenerationPrompt } from "../src/lib/chat/video-prompt";

assert.equal(isImageGenerationPrompt("logo çiz"), true);
assert.equal(isImageGenerationPrompt("görsel üret"), true);
assert.equal(isImageGenerationPrompt("bir kedi resmi oluştur"), true);
assert.equal(isImageGenerationPrompt("afiş oluştur"), true);
assert.equal(isVideoGenerationPrompt("kısa bir video çek"), true);
assert.equal(isVideoGenerationPrompt("reels klip oluştur"), true);
assert.equal(isVideoGenerationPrompt("yağmurda yürüyen adam videosu"), true);
assert.equal(
  isVideoGenerationPrompt("bana bir video: sahilde koşan köpek"),
  true,
);
assert.equal(isVideoGenerationPrompt("bunu videoya çevir"), true);
assert.equal(isVideoGenerationPrompt("dikey story videosu yap"), true);
assert.equal(
  shouldRouteToImageEdit("dosyayı sil", {
    hasPriorImages: false,
    hasAttachments: false,
  }),
  false,
);
assert.equal(
  shouldRouteToImageEdit("boyunu uzat", {
    hasPriorImages: true,
    hasAttachments: false,
  }),
  true,
);
assert.equal(detectPromptMode("web sitesi oluştur"), "website");
assert.equal(detectPromptMode("sunum hazırla"), "slides");
assert.equal(detectPromptMode("güncel fiyatı ne"), "research");
assert.equal(isImageEditPrompt("şunu buraya koy"), true);

console.log("turkish intent checks passed");
