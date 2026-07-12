const MONTHS_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

export function formatChatHistoryDate(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const current = new Date(now);

  const startOfToday = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
  ).getTime();
  const startOfMessage = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();

  const dayDiff = Math.round((startOfToday - startOfMessage) / 86_400_000);

  if (dayDiff === 0) return "Bugün";
  if (dayDiff === 1) return "Dün";

  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]}`;
}
