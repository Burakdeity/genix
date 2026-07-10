const EASTER_EGGS: Array<{ match: RegExp; reply: string }> = [
  {
    match: /karasulu\s*yezda/i,
    reply:
      "Karasulu Yezda, namı değer Burakdeity'in exidir — Burak'ı çok seviyor hala.",
  },
];

export function getEasterEggReply(prompt: string): string | null {
  const normalized = prompt.trim();
  if (!normalized) return null;

  for (const egg of EASTER_EGGS) {
    if (egg.match.test(normalized)) {
      return egg.reply;
    }
  }

  return null;
}
