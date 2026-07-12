import { NextResponse } from "next/server";

import { handleLiveSessionRequest } from "@/server/handlers/live.handler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await handleLiveSessionRequest(request, body);

  if (!result.success) {
    return NextResponse.json(result, { status: result.error.statusCode });
  }

  return NextResponse.json(result);
}
