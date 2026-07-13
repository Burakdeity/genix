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

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Clock time for chat bubbles, e.g. 14:05 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Bubble meta: today → only time; older → "9 Tem 14:05"
 */
export function formatMessageTimestamp(
  timestamp: number,
  now = Date.now(),
): string {
  const date = new Date(timestamp);
  const current = new Date(now);
  const time = formatMessageTime(timestamp);

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

  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `Dün ${time}`;
  if (date.getFullYear() === current.getFullYear()) {
    return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${time}`;
  }
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()} ${time}`;
}

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
