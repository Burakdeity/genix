import { useAuthStore } from "@/stores/auth.store";

/** Accounts with no daily generation / voice caps (owner / internal). */
const UNLIMITED_ACCOUNT_EMAILS = new Set(["burakdeity41@gmail.com"]);

/** Soft ceiling used where a numeric limit is required by UI math. */
export const UNLIMITED_DAILY_QUOTA = 1_000_000;

export function isUnlimitedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return UNLIMITED_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

export function isUnlimitedAccountId(
  accountId: string | null | undefined,
): boolean {
  if (!accountId) return false;
  const account = useAuthStore
    .getState()
    .accounts.find((item) => item.id === accountId);
  return isUnlimitedEmail(account?.email);
}
