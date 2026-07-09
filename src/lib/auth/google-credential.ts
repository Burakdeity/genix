interface GoogleIdTokenPayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

export function decodeGoogleCredential(
  credential: string,
): GoogleIdTokenPayload | null {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as GoogleIdTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
