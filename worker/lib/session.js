export const SESSION_IDLE_SECONDS = 4 * 60;

export function isSessionIdle(lastActivityAt, now = Date.now()) {
  const lastActivity = Date.parse(lastActivityAt || "");
  return !Number.isFinite(lastActivity) || now - lastActivity >= SESSION_IDLE_SECONDS * 1000;
}
