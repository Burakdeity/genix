import { NextResponse } from "next/server";

import { handleGenerateRequest } from "@/server/handlers/generate.handler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json();
  const result = await handleGenerateRequest(body);

  if (!result.success) {
    return NextResponse.json(result, { status: result.error.statusCode });
  }

  return NextResponse.json(result);
}
