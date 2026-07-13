import {
  ORWIX_PRO_PRICE_LABEL,
  ORWIX_PRO_PRICE_USD,
} from "@/lib/billing/plans";

export async function createProCheckoutSession(input: {
  accountId: string;
  email?: string | null;
}): Promise<{ url: string }> {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: input.accountId,
      email: input.email ?? undefined,
    }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    data?: { url?: string };
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || !payload.data?.url) {
    throw new Error(
      payload.error?.message ??
        `Pro ödeme başlatılamadı (${ORWIX_PRO_PRICE_LABEL}).`,
    );
  }

  return { url: payload.data.url };
}

export async function confirmProCheckoutSession(sessionId: string): Promise<{
  accountId: string;
  expiresAt: number;
}> {
  const response = await fetch(
    `/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`,
  );

  const payload = (await response.json()) as {
    success?: boolean;
    data?: { accountId?: string; expiresAt?: number };
    error?: { message?: string };
  };

  if (
    !response.ok ||
    !payload.success ||
    !payload.data?.accountId ||
    !payload.data.expiresAt
  ) {
    throw new Error(
      payload.error?.message ??
        `$${ORWIX_PRO_PRICE_USD} ödemesi doğrulanamadı.`,
    );
  }

  return {
    accountId: payload.data.accountId,
    expiresAt: payload.data.expiresAt,
  };
}
