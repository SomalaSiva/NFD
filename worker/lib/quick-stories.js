import { ensureAppSettings } from "../db/ensure.js";

const CACHE_MS = 15_000;
let enabledCache = true;
let cacheExpiresAt = 0;

export async function getQuickStoriesEnabled(env) {
  if (!env.DB) return true;
  if (Date.now() < cacheExpiresAt) return enabledCache;
  await ensureAppSettings(env);
  const setting = await env.DB.prepare(
    "SELECT value FROM nfd_app_settings WHERE setting_key = 'quick_stories_enabled'",
  ).first();
  enabledCache = setting?.value !== "0";
  cacheExpiresAt = Date.now() + CACHE_MS;
  return enabledCache;
}

export async function saveQuickStoriesEnabled(env, enabled) {
  await ensureAppSettings(env);
  await env.DB.prepare(
    "UPDATE nfd_app_settings SET value = ?, updated_at = ? WHERE setting_key = 'quick_stories_enabled'",
  )
    .bind(enabled ? "1" : "0", new Date().toISOString())
    .run();
  enabledCache = enabled;
  cacheExpiresAt = Date.now() + CACHE_MS;
}
