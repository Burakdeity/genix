import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildProPriceData,
  getAppBaseUrl,
  getStripe,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  accountId: z.string().min(1),
  email: z.string().email().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Ödeme henüz yapılandırılmadı. STRIPE_SECRET_KEY ekleyin.",
            code: "BILLING_NOT_CONFIGURED",
          },
        },
        { status: 503 },
      );
    }

    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Geçersiz istek.", code: "VALIDATION" },
        },
        { status: 400 },
      );
    }

    const { accountId, email } = parsed.data;
    const stripe = getStripe();
    const baseUrl = getAppBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_email: email,
      line_items: [{ price_data: buildProPriceData(), quantity: 1 }],
      success_url: `${baseUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?billing=cancel`,
      metadata: {
        accountId,
        product: "orwix_pro",
      },
      subscription_data: {
        metadata: {
          accountId,
          product: "orwix_pro",
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Checkout oturumu oluşturulamadı.",
            code: "CHECKOUT_FAILED",
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: session.url, sessionId: session.id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ödeme başlatılamadı.";
    return NextResponse.json(
      {
        success: false,
        error: { message, code: "CHECKOUT_ERROR" },
      },
      { status: 500 },
    );
  }
}
