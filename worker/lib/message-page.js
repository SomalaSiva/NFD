export const MESSAGE_PAGE_SIZE = 50;
export function encodeMessageCursor(time, id) {
  return btoa(JSON.stringify([time, id]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
export function decodeMessageCursor(value) {
  if (!value || value.length > 600 || !/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  try {
    const [time, id, ...extra] = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
    if (
      extra.length ||
      typeof time !== "string" ||
      !Number.isFinite(Date.parse(time)) ||
      typeof id !== "string" ||
      !id.length ||
      id.length > 200
    )
      return null;
    return { time, id };
  } catch {
    return null;
  }
}
export async function conditionalMessageJson(request, payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const etag =
    '"' + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("") + '"';
  const headers = { etag, "cache-control": "private, no-cache", vary: "Cookie, oai-authenticated-user-id" };
  return request.headers.get("if-none-match") === etag
    ? new Response(null, { status: 304, headers })
    : Response.json(payload, { headers });
}
