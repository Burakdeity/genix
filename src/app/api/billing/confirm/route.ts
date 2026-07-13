import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Ödeme henüz yapılandırılmadı.",
            code: "BILLING_NOT_CONFIGURED",
          },
        },
        { status: 503 },
      );
    }

    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "session_id gerekli.", code: "VALIDATION" },
        },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    if (!paid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Ödeme tamamlanmadı.",
            code: "PAYMENT_INCOMPLETE",
          },
        },
        { status: 402 },
      );
    }

    const accountId = session.metadata?.accountId;
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Hesap bilgisi bulunamadı.",
            code: "MISSING_ACCOUNT",
          },
        },
        { status: 400 },
      );
    }

    let expiresAt: number | null = null;

    const resolveSubscription = async (
      value: string | Stripe.Subscription | null | undefined,
    ): Promise<Stripe.Subscription | null> => {
      if (!value) return null;
      if (typeof value === "string") {
        return stripe.subscriptions.retrieve(value);
      }
      return value;
    };

    const subscription = await resolveSubscription(
      session.subscription as string | Stripe.Subscription | null,
    );

    const periodEnd = subscription?.items?.data?.[0]?.current_period_end;
    if (typeof periodEnd === "number") {
      expiresAt = periodEnd * 1000;
    }

    // Fallback: grant ~31 days if period missing
    if (!expiresAt) {
      expiresAt = Date.now() + 31 * 24 * 60 * 60 * 1000;
    }

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        expiresAt,
        subscriptionId: subscription?.id ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ödeme doğrulanamadı.";
    return NextResponse.json(
      {
        success: false,
        error: { message, code: "CONFIRM_ERROR" },
      },
      { status: 500 },
    );
  }
}
