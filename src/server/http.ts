import { NextResponse } from "next/server";
import { ZodError } from "zod";
export async function limitedBody(
  request: Request,
  max = 65536,
): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > max) throw new Error("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request) {
  return JSON.parse((await limitedBody(request)).toString("utf8"));
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = new URL(process.env.APP_URL || request.url).origin;
  if (!origin || origin !== configured)
    throw new Error("A same-origin request is required.");
}
export function apiError(error: unknown) {
  const message =
    error instanceof ZodError
      ? "Please check the request fields."
      : error instanceof Error
        ? error.message
        : "The request could not be completed.";
  const auth = /session|sign in|access code/i.test(message);
  const status = auth
    ? 401
    : /not found/i.test(message)
      ? 404
      : /authorization|only|permission|origin/i.test(message)
        ? 403
        : 400;
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function json(data: unknown) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
