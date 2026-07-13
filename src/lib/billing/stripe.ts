import Stripe from "stripe";

import {
  ORWIX_PRO_PRICE_CENTS,
  ORWIX_PRO_PRICE_USD,
} from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY tanımlı değil.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getAppBaseUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function buildProPriceData(): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  return {
    currency: "usd",
    unit_amount: ORWIX_PRO_PRICE_CENTS,
    recurring: { interval: "month" },
    product_data: {
      name: "Orwix Pro",
      description: `Aylık Pro abonelik — $${ORWIX_PRO_PRICE_USD}/ay`,
    },
  };
}
