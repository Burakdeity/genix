import { handleVideoGenerateRequest } from "@/server/handlers/video.handler";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = await handleVideoGenerateRequest(body);
  const status = result.success ? 200 : result.error.statusCode || 500;
  return Response.json(result, { status });
}
