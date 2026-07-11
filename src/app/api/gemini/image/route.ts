import { NextResponse } from "next/server";

import { handleImageGenerateRequest } from "@/server/handlers/image.handler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json();
  const result = await handleImageGenerateRequest(body);

  if (!result.success) {
    return NextResponse.json(result, { status: result.error.statusCode });
  }

  return NextResponse.json(result);
}
