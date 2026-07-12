import { NextResponse } from "next/server";

import { toApiErrorResponse } from "@/server/errors/api-error";
import { handleGenerateRequest } from "@/server/handlers/generate.handler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const result = await handleGenerateRequest(body);

    if (!result.success) {
      return NextResponse.json(result, { status: result.error.statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    const mapped = toApiErrorResponse(error);
    return NextResponse.json(
      { success: false, error: mapped },
      { status: mapped.statusCode },
    );
  }
}
