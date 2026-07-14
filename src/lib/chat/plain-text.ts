/** Strip light markdown so copy/TTS get readable plain text. */
export function toPlainMessageText(text: string): string {
  return text
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    // Stage-direction / nonverbal tags models sometimes emit
    .replace(
      /\[(?:gülüş|nefes|laughs?|giggle|cough|sigh|inhale|exhale)[^\]]*\]/gi,
      " ",
    )
    .replace(
      /\((?:gülüş|nefes|laughs?|giggle|cough|sigh|inhales?|exhales?)[^)]*\)/gi,
      " ",
    )
    .replace(
      /\*(?:nefes\s+al(?:ır|ıyor)?|nefes\s+ver(?:ir|iyor)?|kıkırdar|gül(?:er|üyor)|laughs?|giggles?)\*/gi,
      " ",
    )
    .replace(
      /\b(?:hh+|hhh+|hehe+|haha+|ha\s*ha)\b/gi,
      " ",
    )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
