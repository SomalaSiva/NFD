import { ensureAppSettings } from "../db/ensure.js";

export const DEFAULT_SESSION_IDLE_MINUTES = 4;
export const MIN_SESSION_IDLE_MINUTES = 1;
export const MAX_SESSION_IDLE_MINUTES = 120;
export const SESSION_IDLE_SECONDS = DEFAULT_SESSION_IDLE_MINUTES * 60;

let idleMinutesCache = DEFAULT_SESSION_IDLE_MINUTES;
let idleMinutesCacheExpiresAt = 0;

export async function getSessionIdleMinutes(env) {
  if (!env.DB) return DEFAULT_SESSION_IDLE_MINUTES;
  if (Date.now() < idleMinutesCacheExpiresAt) return idleMinutesCache;
  await ensureAppSettings(env);
  const setting = await env.DB.prepare(
    "SELECT value FROM nfd_app_settings WHERE setting_key = 'session_idle_minutes'",
  ).first();
  const minutes = Number(setting?.value);
  idleMinutesCache = Number.isInteger(minutes)
    ? Math.min(MAX_SESSION_IDLE_MINUTES, Math.max(MIN_SESSION_IDLE_MINUTES, minutes))
    : DEFAULT_SESSION_IDLE_MINUTES;
  idleMinutesCacheExpiresAt = Date.now() + 15_000;
  return idleMinutesCache;
}

export async function saveSessionIdleMinutes(env, minutes) {
  await ensureAppSettings(env);
  await env.DB.prepare(
    "UPDATE nfd_app_settings SET value = ?, updated_at = ? WHERE setting_key = 'session_idle_minutes'",
  )
    .bind(String(minutes), new Date().toISOString())
    .run();
  idleMinutesCache = minutes;
  idleMinutesCacheExpiresAt = Date.now() + 15_000;
}

export function isSessionIdle(lastActivityAt, now = Date.now(), idleSeconds = SESSION_IDLE_SECONDS) {
  const lastActivity = Date.parse(lastActivityAt || "");
  return !Number.isFinite(lastActivity) || now - lastActivity >= idleSeconds * 1000;
}
