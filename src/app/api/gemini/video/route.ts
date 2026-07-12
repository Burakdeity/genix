import { toApiErrorResponse } from "@/server/errors/api-error";
import { handleVideoGenerateRequest } from "@/server/handlers/video.handler";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = await handleVideoGenerateRequest(body);
    const status = result.success ? 200 : result.error.statusCode || 500;
    return Response.json(result, { status });
  } catch (error) {
    const mapped = toApiErrorResponse(error);
    return Response.json(
      { success: false, error: mapped },
      { status: mapped.statusCode },
    );
  }
}
