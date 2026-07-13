/**
 * Turkish-safe word edges. JS `\b` breaks on ç/ğ/ı/ö/ş/ü.
 * Use with the `u` (unicode) flag.
 */
export const TR_LEFT = String.raw`(?<![\p{L}\p{N}_])`;
export const TR_RIGHT = String.raw`(?![\p{L}\p{N}_])`;

export function trAlt(parts: readonly string[]): string {
  return parts.join("|");
}

export function trWord(parts: readonly string[]): string {
  return `${TR_LEFT}(?:${trAlt(parts)})${TR_RIGHT}`;
}

export function trStem(parts: readonly string[]): string {
  // Stem + optional Turkish-ish suffix run (agglutination).
  return `${TR_LEFT}(?:${trAlt(parts)})\\p{L}*${TR_RIGHT}`;
}

export function normalizeTr(text: string): string {
  return text.trim().toLocaleLowerCase("tr-TR");
}
