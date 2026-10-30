import { appOrigin } from "./config";
export function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin === appOrigin()) return true;
    if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
      if (origin === `https://${process.env.VERCEL_URL}`) return true;
    }
    if (process.env.NODE_ENV === "development" && origin) {
      const url = new URL(origin);
      return (
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      );
    }
    return false;
  } catch {
    return false;
  }
}
export const privateHeaders = { "Cache-Control": "private, no-store" };
export function accountJson(
  data: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  const headers = new Headers(privateHeaders);
  new Headers(extraHeaders).forEach((value, name) => headers.set(name, value));
  return Response.json(data, { status, headers });
}
