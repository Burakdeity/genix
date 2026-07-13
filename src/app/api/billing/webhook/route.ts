import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook — keeps subscription metadata consistent.
 * Client unlock still happens via /api/billing/confirm after Checkout.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) {
    return NextResponse.json(
      { received: false, error: "Webhook yapılandırılmadı." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "İmza yok." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook doğrulanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Acknowledge — Pro entitlement is confirmed client-side from Checkout session.
  // Extend here later with a durable store if needed.
  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
