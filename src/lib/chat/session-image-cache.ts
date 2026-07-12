const STORAGE_KEY = "orwix-session-images";
const MAX_ENTRIES = 16;

type CachedImage = {
  mimeType: string;
  dataUrl: string;
};

function readCache(): Record<string, CachedImage> {
  if (typeof sessionStorage === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedImage>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CachedImage>): void {
  if (typeof sessionStorage === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function cacheMessageImages(
  messageId: string,
  images: Array<{ mimeType: string; dataUrl: string }>,
): void {
  const primary = images.find((image) => image.dataUrl);
  if (!primary?.dataUrl) return;

  const cache = readCache();
  cache[messageId] = {
    mimeType: primary.mimeType,
    dataUrl: primary.dataUrl,
  };

  const keys = Object.keys(cache);
  if (keys.length > MAX_ENTRIES) {
    for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) {
      delete cache[key];
    }
  }

  writeCache(cache);
}

export function resolveMessageImageDataUrl(
  messageId: string,
  dataUrl: string,
): string {
  if (dataUrl) return dataUrl;
  return readCache()[messageId]?.dataUrl ?? "";
}
