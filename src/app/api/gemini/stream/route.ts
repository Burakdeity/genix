import {
  createGeminiStream,
  parseStreamRequest,
} from "@/server/handlers/stream.handler";
import { toApiErrorResponse } from "@/server/errors/api-error";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = parseStreamRequest(body);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of createGeminiStream(parsed)) {
            if (chunk.startsWith("data: ")) {
              controller.enqueue(encoder.encode(chunk));
              continue;
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`),
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const mapped = toApiErrorResponse(error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: mapped })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const mapped = toApiErrorResponse(error);
    return Response.json(
      { success: false, error: mapped },
      { status: mapped.statusCode },
    );
  }
}
