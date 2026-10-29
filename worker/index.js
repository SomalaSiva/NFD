const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_SESSION_COOKIE = "__Host-nfd_session";
const GOOGLE_OAUTH_COOKIE = "__Host-nfd_google_oauth";
const GOOGLE_SESSION_SECONDS = 60 * 60 * 24 * 30;
let googleJwksCache;
let googleJwksExpiresAt = 0;
let identityTablesPromise;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/nfd-icon.png") {
      return new Response(APP_ICON, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/auth/google") {
      return startGoogleSignIn(request, env);
    }
    if (request.method === "GET" && url.pathname === "/auth/google/callback") {
      return finishGoogleSignIn(request, env);
    }
    if (request.method === "GET" && url.pathname === "/auth/signout") {
      return signOut(request, env);
    }
    if (request.method === "GET" && url.pathname === "/profile") {
      if (!(await getCurrentUser(request, env))) {
        return Response.redirect(new URL("/login?return_to=%2Fprofile", url), 302);
      }
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && url.pathname === "/privacy") {
      return html(PRIVACY_HTML);
    }
    if (request.method === "GET" && url.pathname === "/login") {
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && ["/", "/feed", "/feed/"].includes(url.pathname)) {
      if (!(await getCurrentUser(request, env))) {
        return Response.redirect(new URL("/login?return_to=%2Ffeed", url), 302);
      }
      if (url.pathname === "/") return Response.redirect(new URL("/feed", url), 302);
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && url.pathname === "/share") {
      if (!(await getCurrentUser(request, env))) {
        return Response.redirect(new URL("/login?return_to=%2Ffeed", url), 302);
      }
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && url.pathname === "/admin") {
      if (!(await getCurrentUser(request, env))) {
        return Response.redirect(new URL("/login?return_to=%2Fadmin", url), 302);
      }
      if (!(await isAdmin(request, env))) {
        return Response.redirect(new URL("/login?access=denied", url), 302);
      }
      return html(PAGE_HTML);
    }

    if (request.method === "GET" && url.pathname === "/api/auth-status") {
      const user = await getCurrentUser(request, env);
      if (!user) {
        return json({ error: "Sign in to use NFD." }, 401);
      }
      return json({ isAdmin: await isAdmin(request, env), provider: user.provider });
    }
    if (url.pathname === "/api/admins" && ["GET", "POST"].includes(request.method)) {
      return manageAdmins(request, env);
    }
    if (url.pathname === "/api/admins" && request.method === "DELETE") {
      return removeAdmin(request, env);
    }
    if (request.method === "GET" && url.pathname === "/api/users") {
      return listNfdUsers(request, env);
    }
    if (url.pathname === "/api/friends" && ["GET", "POST"].includes(request.method)) {
      return manageFriends(request, env);
    }
    const friendActionMatch = url.pathname.match(/^\/api\/friends\/([0-9a-f-]{36})(?:\/(accept))?$/i);
    if (friendActionMatch && request.method === "POST" && friendActionMatch[2] === "accept") {
      return respondToFriendRequest(request, env, friendActionMatch[1], true);
    }
    if (friendActionMatch && request.method === "DELETE") {
      return removeFriendOrRequest(request, env, friendActionMatch[1]);
    }

    if (request.method === "GET" && url.pathname === "/api/experiences") {
      return listExperiences(request, env);
    }
    if (request.method === "GET" && url.pathname === "/api/profile") {
      return getProfile(request, env);
    }
    const ownExperienceMatch = url.pathname.match(/^\/api\/experiences\/([0-9a-f-]{36})$/i);
    if (request.method === "DELETE" && ownExperienceMatch) {
      return deleteOwnExperience(request, env, ownExperienceMatch[1]);
    }

    const evidenceMatch = url.pathname.match(/^\/api\/evidence\/([0-9a-f-]{36})$/i);
    if (request.method === "GET" && evidenceMatch) {
      return serveEvidence(request, env, evidenceMatch[1]);
    }

    if (request.method === "POST" && url.pathname === "/api/experiences") {
      return submitExperience(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
}

async function startGoogleSignIn(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(new URL("/login?google=setup", request.url), 302);
  }
  const state = randomToken(32);
  const nonce = randomToken(32);
  const verifier = randomToken(48);
  const challenge = await sha256Base64Url(verifier);
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  const redirectUri = "https://nfd.nofacedocs.com/auth/google/callback";
  const authorization = new URL(GOOGLE_AUTH_URL);
  authorization.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  const oauthState = base64UrlEncode(JSON.stringify({ state, nonce, verifier, returnTo }));
  return redirect(authorization.toString(), 302, [cookie(GOOGLE_OAUTH_COOKIE, oauthState, 600)]);
}

async function finishGoogleSignIn(request, env) {
  const url = new URL(request.url);
  const clearOauthCookie = cookie(GOOGLE_OAUTH_COOKIE, "", 0);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) {
    return redirect("/login?google=setup", 302, [clearOauthCookie]);
  }
  const oauthCookie = getCookie(request, GOOGLE_OAUTH_COOKIE);
  const oauthState = oauthCookie ? safeJsonParse(base64UrlDecode(oauthCookie)) : null;
  if (url.searchParams.has("error")) return redirect("/login?google=cancelled", 302, [clearOauthCookie]);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !oauthState?.state || !constantTimeEqual(state || "", oauthState.state)) {
    return redirect("/login?google=failed", 302, [clearOauthCookie]);
  }
  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: oauthState.verifier,
        grant_type: "authorization_code",
        redirect_uri: "https://nfd.nofacedocs.com/auth/google/callback",
      }),
    });
    const tokens = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokens.id_token) throw new Error("Google did not return a sign-in token.");
    const claims = await verifyGoogleIdToken(tokens.id_token, env.GOOGLE_CLIENT_ID, oauthState.nonce);
    await ensureIdentityTables(env);
    const userId = `google:${claims.sub}`;
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO nfd_users (id, provider, provider_subject, email, display_name, created_at, updated_at)
      VALUES (?, 'google', ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = excluded.updated_at
    `).bind(userId, claims.sub, claims.email.toLowerCase(), claims.name || null, now, now).run();
    const sessionToken = randomToken(32);
    const sessionHash = await sha256Base64Url(sessionToken);
    const expiresAt = new Date(Date.now() + GOOGLE_SESSION_SECONDS * 1000).toISOString();
    await env.DB.prepare("INSERT INTO nfd_sessions (session_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(sessionHash, userId, expiresAt, now).run();
    return redirect(safeReturnTo(oauthState.returnTo), 302, [
      clearOauthCookie,
      cookie(GOOGLE_SESSION_COOKIE, sessionToken, GOOGLE_SESSION_SECONDS),
    ]);
  } catch (error) {
    console.error("Google sign-in failed", error);
    return redirect("/login?google=failed", 302, [clearOauthCookie]);
  }
}

async function signOut(request, env) {
  const token = getCookie(request, GOOGLE_SESSION_COOKIE);
  if (token && env.DB) {
    try {
      const hash = await sha256Base64Url(token);
      await env.DB.prepare("DELETE FROM nfd_sessions WHERE session_hash = ?").bind(hash).run();
    } catch (error) {
      console.error("Google session cleanup failed", error);
    }
  }
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  const hasChatGptSession = Boolean(request.headers.get("oai-authenticated-user-id")?.trim());
  const destination = hasChatGptSession
    ? `/signout-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`
    : returnTo;
  return redirect(destination, 302, [cookie(GOOGLE_SESSION_COOKIE, "", 0)]);
}

async function getCurrentUser(request, env) {
  const token = getCookie(request, GOOGLE_SESSION_COOKIE);
  if (token && env.DB) {
    try {
      await ensureIdentityTables(env);
      const sessionHash = await sha256Base64Url(token);
      const session = await env.DB.prepare(`
        SELECT u.id, u.provider, u.provider_subject AS subject, u.email, u.display_name AS name, s.expires_at
        FROM nfd_sessions s INNER JOIN nfd_users u ON u.id = s.user_id
        WHERE s.session_hash = ? LIMIT 1
      `).bind(sessionHash).first();
      if (session && Date.parse(session.expires_at) > Date.now()) return session;
      if (session) await env.DB.prepare("DELETE FROM nfd_sessions WHERE session_hash = ?").bind(sessionHash).run();
    } catch (error) {
      console.error("Google session lookup failed", error);
    }
  }

  const chatGptId = request.headers.get("oai-authenticated-user-id")?.trim();
  if (chatGptId) {
    const user = {
      id: chatGptId.slice(0, 200),
      provider: "chatgpt",
      subject: chatGptId.slice(0, 200),
      email: (request.headers.get("oai-authenticated-user-email") || "").trim().toLowerCase(),
      name: "",
    };
    if (env.DB) {
      try {
        await ensureIdentityTables(env);
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO nfd_users (id, provider, provider_subject, email, display_name, created_at, updated_at)
          VALUES (?, 'chatgpt', ?, ?, NULL, ?, ?)
          ON CONFLICT(id) DO UPDATE SET email = COALESCE(NULLIF(excluded.email, ''), nfd_users.email), updated_at = excluded.updated_at
        `).bind(user.id, user.subject, user.email, now, now).run();
      } catch (error) {
        console.error("ChatGPT profile save failed", error);
      }
    }
    return user;
  }

  return null;
}

async function ensureIdentityTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  identityTablesPromise ||= (async () => {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS nfd_users (
        id TEXT PRIMARY KEY NOT NULL,
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (provider, provider_subject)
      )
    `).run();
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS nfd_sessions (
        session_hash TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS nfd_sessions_user_id_idx ON nfd_sessions (user_id)").run();
  })().catch((error) => {
    identityTablesPromise = undefined;
    throw error;
  });
  await identityTablesPromise;
}

async function verifyGoogleIdToken(token, clientId, expectedNonce) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Google returned an invalid identity token.");
  const header = safeJsonParse(base64UrlDecode(parts[0]));
  const claims = safeJsonParse(base64UrlDecode(parts[1]));
  if (!header || !claims || header.alg !== "RS256" || !header.kid) throw new Error("Google returned an unsupported identity token.");
  const key = (await getGoogleJwks()).find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA");
  if (!key) {
    googleJwksExpiresAt = 0;
    throw new Error("Google signing key was not found.");
  }
  const cryptoKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlDecodeBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!validSignature || !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)
    || !audience.includes(clientId) || (claims.azp && claims.azp !== clientId)
    || !Number.isFinite(claims.exp) || claims.exp <= now
    || !Number.isFinite(claims.iat) || claims.iat > now + 300
    || !constantTimeEqual(claims.nonce || "", expectedNonce)
    || typeof claims.sub !== "string" || !claims.sub
    || typeof claims.email !== "string" || !claims.email_verified) {
    throw new Error("Google identity could not be verified.");
  }
  return { sub: claims.sub, email: claims.email, name: typeof claims.name === "string" ? claims.name.slice(0, 200) : "" };
}

async function getGoogleJwks() {
  if (googleJwksCache && googleJwksExpiresAt > Date.now()) return googleJwksCache;
  const response = await fetch(GOOGLE_JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) throw new Error("Google signing keys are temporarily unavailable.");
  const body = await response.json();
  if (!Array.isArray(body.keys)) throw new Error("Google signing keys could not be read.");
  googleJwksCache = body.keys;
  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1] || 3600);
  googleJwksExpiresAt = Date.now() + Math.max(60, Math.min(maxAge, 86400)) * 1000;
  return googleJwksCache;
}

function randomToken(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  try {
    return new TextDecoder().decode(base64UrlDecodeBytes(value));
  } catch {
    return "";
  }
}

function base64UrlDecodeBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (character) => character.charCodeAt(0));
}

function safeJsonParse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function getCookie(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

function redirect(location, status = 302, setCookies = []) {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const value of setCookies) headers.append("set-cookie", value);
  return new Response(null, { status, headers });
}

function safeReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/feed";
  const parsed = new URL(value, "https://nfd.nofacedocs.com");
  return ["/feed", "/share", "/admin", "/login"].includes(parsed.pathname)
    ? `${parsed.pathname}${parsed.search}`
    : "/feed";
}

function ownerEmail(env) {
  return (env.NFD_OWNER_EMAIL || (env.NFD_ADMIN_EMAILS || "").split(",")[0] || "").trim().toLowerCase();
}

async function isOwner(request, env) {
  const email = (await getCurrentUser(request, env))?.email?.trim().toLowerCase();
  return Boolean(email && ownerEmail(env) && email === ownerEmail(env));
}

async function ensureAdminTable(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS nfd_admin_users (
      email TEXT PRIMARY KEY NOT NULL,
      added_by TEXT NOT NULL,
      added_at TEXT NOT NULL
    )
  `).run();
}

async function isAdmin(request, env) {
  const email = (await getCurrentUser(request, env))?.email?.trim().toLowerCase();
  if (!email) return false;
  if (await isOwner(request, env)) return true;
  try {
    await ensureAdminTable(env);
    return Boolean(await env.DB.prepare("SELECT email FROM nfd_admin_users WHERE email = ? LIMIT 1").bind(email).first());
  } catch (error) {
    console.error("Admin access lookup failed", error);
    return false;
  }
}

async function manageAdmins(request, env) {
  if (!(await getCurrentUser(request, env))) {
    return json({ error: "Sign in to manage NFD administrator access." }, 401);
  }
  if (!(await isOwner(request, env))) {
    return json({ error: "Only the NFD owner can add or remove administrators." }, 403);
  }
  try {
    await ensureAdminTable(env);
    if (request.method === "GET") {
      const result = await env.DB.prepare("SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC").all();
      return json({ ownerEmail: ownerEmail(env), admins: result.results || [] });
    }
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "Send the administrator email as JSON." }, 415);
    }
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (email === ownerEmail(env)) {
      return json({ error: "The owner already has permanent administrator access." }, 400);
    }
    await env.DB.prepare("INSERT OR IGNORE INTO nfd_admin_users (email, added_by, added_at) VALUES (?, ?, ?)")
      .bind(email, ownerEmail(env), new Date().toISOString()).run();
    const result = await env.DB.prepare("SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC").all();
    return json({ ownerEmail: ownerEmail(env), admins: result.results || [] }, 201);
  } catch (error) {
    console.error("Admin access update failed", error);
    return json({ error: "Administrator access could not be updated right now." }, 503);
  }
}

async function removeAdmin(request, env) {
  if (!(await getCurrentUser(request, env))) {
    return json({ error: "Sign in to manage NFD administrator access." }, 401);
  }
  if (!(await isOwner(request, env))) {
    return json({ error: "Only the NFD owner can add or remove administrators." }, 403);
  }
  const email = cleanSearchTerm(new URL(request.url).searchParams.get("email")).toLowerCase();
  if (!email || email === ownerEmail(env)) return json({ error: "That administrator cannot be removed." }, 400);
  try {
    await ensureAdminTable(env);
    await env.DB.prepare("DELETE FROM nfd_admin_users WHERE email = ?").bind(email).run();
    const result = await env.DB.prepare("SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC").all();
    return json({ ownerEmail: ownerEmail(env), admins: result.results || [] });
  } catch (error) {
    console.error("Admin access removal failed", error);
    return json({ error: "Administrator access could not be updated right now." }, 503);
  }
}

async function listNfdUsers(request, env) {
  if (!(await getCurrentUser(request, env))) {
    return json({ error: "Sign in to view NFD members." }, 401);
  }
  if (!(await isOwner(request, env))) {
    return json({ error: "Only the NFD owner can view the member directory." }, 403);
  }
  if (!env.DB) return json({ error: "The NFD member directory is unavailable right now." }, 503);
  try {
    await ensureIdentityTables(env);
    const result = await env.DB.prepare(`
      SELECT u.id, u.email, u.display_name, u.provider, u.created_at,
        COUNT(e.id) AS shared_post_count
      FROM nfd_users u
      LEFT JOIN experiences e ON e.author_id = u.id AND e.status = 'shared'
      GROUP BY u.id, u.email, u.display_name, u.provider, u.created_at
      ORDER BY u.created_at DESC
      LIMIT 500
    `).all();
    const users = result.results || [];
    return json({
      total: users.length,
      users: users.map((user) => ({
        email: user.email || "",
        displayName: user.display_name || "",
        provider: user.provider,
        joinedAt: user.created_at,
        sharedPostCount: Number(user.shared_post_count) || 0,
      })),
    });
  } catch (error) {
    console.error("NFD member directory query failed", error);
    return json({ error: "The NFD member directory could not be loaded right now." }, 503);
  }
}

async function manageFriends(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to manage your NFD friends." }, 401);
  if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
  try {
    if (request.method === "GET") {
      const [friends, incoming, outgoing] = await Promise.all([
        env.DB.prepare(`
          SELECT f.id, u.id AS user_id, u.display_name, u.email, f.created_at
          FROM nfd_friend_requests f
          INNER JOIN nfd_users u ON u.id = CASE WHEN f.from_user_id = ? THEN f.to_user_id ELSE f.from_user_id END
          WHERE f.status = 'accepted' AND (f.from_user_id = ? OR f.to_user_id = ?)
          ORDER BY lower(COALESCE(u.display_name, u.email))
        `).bind(user.id, user.id, user.id).all(),
        env.DB.prepare(`
          SELECT f.id, u.display_name, u.email, f.created_at
          FROM nfd_friend_requests f INNER JOIN nfd_users u ON u.id = f.from_user_id
          WHERE f.to_user_id = ? AND f.status = 'pending' ORDER BY f.created_at DESC
        `).bind(user.id).all(),
        env.DB.prepare(`
          SELECT f.id, u.display_name, u.email, f.created_at
          FROM nfd_friend_requests f INNER JOIN nfd_users u ON u.id = f.to_user_id
          WHERE f.from_user_id = ? AND f.status = 'pending' ORDER BY f.created_at DESC
        `).bind(user.id).all(),
      ]);
      const simplify = (result) => (result.results || []).map((row) => ({
        id: row.id,
        userId: row.user_id || "",
        name: row.display_name || "NFD member",
        email: row.email || "",
        createdAt: row.created_at,
      }));
      return json({ friends: simplify(friends), incoming: simplify(incoming), outgoing: simplify(outgoing) });
    }

    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "Send the friend’s email address as JSON." }, 415);
    }
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address for an NFD member." }, 400);
    }
    const target = await env.DB.prepare("SELECT id FROM nfd_users WHERE lower(email) = ? LIMIT 1").bind(email).first();
    if (!target || target.id === user.id) {
      return json({ ok: true, message: "If that email belongs to another NFD member, your request will appear in their profile." }, 202);
    }
    const existing = await env.DB.prepare(`
      SELECT id, status FROM nfd_friend_requests
      WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
      LIMIT 1
    `).bind(user.id, target.id, target.id, user.id).first();
    if (existing) return json({ error: "A friend request is already pending, or you’re already connected." }, 409);
    await env.DB.prepare(`
      INSERT INTO nfd_friend_requests (id, from_user_id, to_user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).bind(crypto.randomUUID(), user.id, target.id, new Date().toISOString(), new Date().toISOString()).run();
    return json({ ok: true, message: "If that email belongs to another NFD member, your request will appear in their profile." }, 202);
  } catch (error) {
    console.error("NFD friends update failed", error);
    return json({ error: "NFD friends could not be updated right now. Please try again." }, 503);
  }
}

async function respondToFriendRequest(request, env, requestId, accept) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to respond to friend requests." }, 401);
  if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
  try {
    const result = await env.DB.prepare(`
      UPDATE nfd_friend_requests SET status = ?, updated_at = ?
      WHERE id = ? AND to_user_id = ? AND status = 'pending'
    `).bind(accept ? "accepted" : "rejected", new Date().toISOString(), requestId, user.id).run();
    if (!(Number(result.meta?.changes) > 0)) return json({ error: "That incoming request is no longer available." }, 404);
    return json({ ok: true, status: accept ? "accepted" : "rejected" });
  } catch (error) {
    console.error("Friend request response failed", error);
    return json({ error: "That friend request could not be updated right now." }, 503);
  }
}

async function removeFriendOrRequest(request, env, requestId) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to update NFD friends." }, 401);
  if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
  try {
    const result = await env.DB.prepare(`
      DELETE FROM nfd_friend_requests
      WHERE id = ? AND (
        (status = 'accepted' AND (from_user_id = ? OR to_user_id = ?))
        OR (status = 'pending' AND (from_user_id = ? OR to_user_id = ?))
      )
    `).bind(requestId, user.id, user.id, user.id, user.id).run();
    if (!(Number(result.meta?.changes) > 0)) return json({ error: "That friend or request was not found." }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error("NFD friend removal failed", error);
    return json({ error: "That friend or request could not be removed right now." }, 503);
  }
}

async function listExperiences(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ error: "Sign in to view the NFD experience feed." }, 401);
  }
  if (!env.DB) return json({ error: "The NFD experience database is not available right now." }, 503);
  try {
    const url = new URL(request.url);
    const placeSearch = cleanSearchTerm(url.searchParams.get("place"));
    const locationSearch = cleanSearchTerm(url.searchParams.get("location"));
    const experienceCategory = cleanSearchTerm(url.searchParams.get("experienceCategory"));
    const incidentCategory = cleanSearchTerm(url.searchParams.get("incidentCategory"));
    const placeCategory = cleanSearchTerm(url.searchParams.get("placeCategory"));
    const visibilitySql = `(e.author_id = ? OR e.visibility IN ('public', 'anonymous') OR (e.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM nfd_friend_requests f WHERE f.status = 'accepted'
      AND ((f.from_user_id = e.author_id AND f.to_user_id = ?) OR (f.from_user_id = ? AND f.to_user_id = e.author_id))
    )))`;
    const visibilityBindings = [user.id, user.id, user.id];
    const conditions = ["e.status = ?", visibilitySql];
    const bindings = ["shared", ...visibilityBindings];
    if (placeSearch) {
      conditions.push("instr(lower(e.place), lower(?)) > 0");
      bindings.push(placeSearch);
    }
    if (locationSearch) {
      conditions.push(`(
        instr(lower(COALESCE(e.location_details, '')), lower(?)) > 0
        OR instr(lower(e.place_category), lower(?)) > 0
        OR instr(lower(e.place), lower(?)) > 0
      )`);
      bindings.push(locationSearch, locationSearch, locationSearch);
    }
    if (experienceCategory) {
      conditions.push("e.experience_category = ?");
      bindings.push(experienceCategory);
    }
    if (incidentCategory) {
      conditions.push("e.incident_category = ?");
      bindings.push(incidentCategory);
    }
    if (placeCategory) {
      conditions.push("e.place_category = ?");
      bindings.push(placeCategory);
    }
    const where = conditions.join(" AND ");
    const [result, totalResult, placeResult, locationResult, experienceCategoryResult, incidentCategoryResult, placeCategoryResult] = await Promise.all([
      env.DB.prepare(`
        SELECT e.id, e.experience_category, e.incident_category, e.place, e.place_category,
          e.location_details, e.incident_time, e.incident_time_zone, e.short_description,
          e.full_description, e.visibility, e.created_at,
          CASE WHEN e.visibility = 'anonymous' THEN NULL ELSE u.display_name END AS author_name
        FROM experiences e LEFT JOIN nfd_users u ON u.id = e.author_id
        WHERE ${where}
        ORDER BY e.created_at DESC
        LIMIT 50
      `).bind(...bindings).all(),
      env.DB.prepare(`SELECT COUNT(*) AS total FROM experiences e WHERE ${where}`).bind(...bindings).first(),
      env.DB.prepare(`SELECT DISTINCT e.place FROM experiences e WHERE ${where} ORDER BY e.place COLLATE NOCASE LIMIT 100`).bind(...bindings).all(),
      env.DB.prepare(`SELECT DISTINCT e.location_details FROM experiences e WHERE ${where} AND e.location_details IS NOT NULL AND trim(e.location_details) != '' ORDER BY e.location_details COLLATE NOCASE LIMIT 100`).bind(...bindings).all(),
      env.DB.prepare(`SELECT DISTINCT e.experience_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.experience_category COLLATE NOCASE`).bind("shared", ...visibilityBindings).all(),
      env.DB.prepare(`SELECT DISTINCT e.incident_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.incident_category COLLATE NOCASE`).bind("shared", ...visibilityBindings).all(),
      env.DB.prepare(`SELECT DISTINCT e.place_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.place_category COLLATE NOCASE`).bind("shared", ...visibilityBindings).all(),
    ]);
    const experiences = result.results || [];
    const evidenceByExperience = new Map();
    if (experiences.length) {
      const ids = experiences.map((experience) => experience.id);
      const placeholders = ids.map(() => "?").join(", ");
      const evidenceResult = await env.DB.prepare(`
        SELECT id, experience_id, original_filename, content_type, size_bytes
        FROM experience_evidence
        WHERE experience_id IN (${placeholders})
        ORDER BY created_at ASC
      `).bind(...ids).all();
      for (const file of evidenceResult.results || []) {
        const files = evidenceByExperience.get(file.experience_id) || [];
        files.push({
          id: file.id,
          originalFilename: file.original_filename,
          contentType: file.content_type,
          sizeBytes: file.size_bytes,
        });
        evidenceByExperience.set(file.experience_id, files);
      }
    }

    return json({
      total: totalResult?.total || 0,
      placeSuggestions: (placeResult.results || []).map((row) => row.place),
      locationSuggestions: (locationResult.results || []).map((row) => row.location_details),
      experienceCategoryOptions: (experienceCategoryResult.results || []).map((row) => row.experience_category),
      incidentCategoryOptions: (incidentCategoryResult.results || []).map((row) => row.incident_category),
      placeCategoryOptions: (placeCategoryResult.results || []).map((row) => row.place_category),
      experiences: experiences.map((experience) => ({
        id: experience.id,
        experienceCategory: experience.experience_category,
        incidentCategory: experience.incident_category,
        place: experience.place,
        placeCategory: experience.place_category,
        locationDetails: experience.location_details || "",
        incidentTime: experience.incident_time,
        incidentTimeZone: experience.incident_time_zone,
        shortDescription: experience.short_description,
        fullDescription: experience.full_description,
        visibility: experience.visibility,
        authorName: experience.visibility === "anonymous" ? "" : (experience.author_name || "NFD member"),
        createdAt: experience.created_at,
        evidence: evidenceByExperience.get(experience.id) || [],
      })),
    });
  } catch (error) {
    console.error("Experience feed query failed", error);
    return json({ error: "NFD couldn’t load the experience feed right now." }, 503);
  }
}

async function getProfile(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to view your profile." }, 401);
  if (!env.DB) return json({ error: "Your NFD profile is not available right now." }, 503);
  try {
    const result = await env.DB.prepare(`
      SELECT id, experience_category, incident_category, place, place_category,
        location_details, incident_time, incident_time_zone, short_description,
        full_description, visibility, created_at
      FROM experiences
      WHERE author_id = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(user.id, "shared").all();
    const experiences = result.results || [];
    const evidenceByExperience = new Map();
    if (experiences.length) {
      const ids = experiences.map((experience) => experience.id);
      const placeholders = ids.map(() => "?").join(", ");
      const evidenceResult = await env.DB.prepare(`
        SELECT id, experience_id, original_filename, content_type, size_bytes
        FROM experience_evidence
        WHERE experience_id IN (${placeholders})
        ORDER BY created_at ASC
      `).bind(...ids).all();
      for (const file of evidenceResult.results || []) {
        const files = evidenceByExperience.get(file.experience_id) || [];
        files.push({
          id: file.id,
          originalFilename: file.original_filename,
          contentType: file.content_type,
          sizeBytes: file.size_bytes,
        });
        evidenceByExperience.set(file.experience_id, files);
      }
    }
    return json({
      user: { name: user.name || "", email: user.email || "", provider: user.provider },
      total: experiences.length,
      experiences: experiences.map((experience) => ({
        id: experience.id,
        experienceCategory: experience.experience_category,
        incidentCategory: experience.incident_category,
        place: experience.place,
        placeCategory: experience.place_category,
        locationDetails: experience.location_details || "",
        incidentTime: experience.incident_time,
        incidentTimeZone: experience.incident_time_zone,
        shortDescription: experience.short_description,
        fullDescription: experience.full_description,
        visibility: experience.visibility,
        createdAt: experience.created_at,
        evidence: evidenceByExperience.get(experience.id) || [],
      })),
    });
  } catch (error) {
    console.error("Profile query failed", error);
    return json({ error: "Your NFD profile could not be loaded right now." }, 503);
  }
}

async function deleteOwnExperience(request, env, experienceId) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to delete your post." }, 401);
  if (!env.DB || !env.BUCKET) return json({ error: "Post storage is not available right now." }, 503);
  try {
    const ownedPost = await env.DB.prepare(
      "SELECT id FROM experiences WHERE id = ? AND author_id = ? AND status = ? LIMIT 1",
    ).bind(experienceId, user.id, "shared").first();
    if (!ownedPost) return json({ error: "That post was not found in your profile." }, 404);

    const evidence = await env.DB.prepare(
      "SELECT object_key FROM experience_evidence WHERE experience_id = ?",
    ).bind(experienceId).all();
    const results = await env.DB.batch([
      env.DB.prepare(`
        DELETE FROM experience_evidence
        WHERE experience_id = ? AND EXISTS (
          SELECT 1 FROM experiences WHERE id = ? AND author_id = ? AND status = ?
        )
      `).bind(experienceId, experienceId, user.id, "shared"),
      env.DB.prepare(
        "DELETE FROM experiences WHERE id = ? AND author_id = ? AND status = ?",
      ).bind(experienceId, user.id, "shared"),
    ]);
    if (!(Number(results[1]?.meta?.changes) > 0)) {
      return json({ error: "That post was not found in your profile." }, 404);
    }

    const cleanup = await Promise.allSettled(
      (evidence.results || []).map((file) => env.BUCKET.delete(file.object_key)),
    );
    const cleanupPending = cleanup.some((result) => result.status === "rejected");
    if (cleanupPending) console.error("Some evidence could not be removed after post deletion", experienceId);
    return json({ ok: true, cleanupPending });
  } catch (error) {
    console.error("Post deletion failed", error);
    return json({ error: "Your post could not be deleted right now. Please try again." }, 503);
  }
}

function cleanSearchTerm(value) {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100) : "";
}

async function serveEvidence(request, env, evidenceId) {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return new Response("Sign in to view this evidence.", { status: 401 });
  }
  if (!env.DB || !env.BUCKET) return new Response("Evidence storage is unavailable.", { status: 503 });
  try {
    const record = await env.DB.prepare(`
      SELECT ee.object_key, ee.original_filename, ee.content_type,
        e.author_id, e.visibility
      FROM experience_evidence ee
      INNER JOIN experiences e ON e.id = ee.experience_id
      WHERE ee.id = ? AND e.status = ?
    `).bind(evidenceId, "shared").first();
    if (!record) return new Response("Evidence not found.", { status: 404 });
    if (!(await canViewExperience(env, user, record))) return new Response("Evidence not found.", { status: 404 });
    const object = await env.BUCKET.get(record.object_key);
    if (!object) return new Response("Evidence not found.", { status: 404 });
    const filename = safeFilename(record.original_filename);
    const disposition = record.content_type.startsWith("image/") ? "inline" : "attachment";
    return new Response(object.body, {
      headers: {
        "content-type": record.content_type,
        "content-disposition": `${disposition}; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Evidence fetch failed", error);
    return new Response("Evidence could not be loaded.", { status: 503 });
  }
}

async function canViewExperience(env, viewer, experience) {
  if (viewer.id === experience.author_id || experience.visibility === "public" || experience.visibility === "anonymous") return true;
  if (experience.visibility !== "friends") return false;
  const connection = await env.DB.prepare(`
    SELECT id FROM nfd_friend_requests
    WHERE status = 'accepted'
      AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
    LIMIT 1
  `).bind(experience.author_id, viewer.id, viewer.id, experience.author_id).first();
  return Boolean(connection);
}

async function submitExperience(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "Sign in to share an experience." }, 401);
  if (!env.DB || !env.BUCKET) {
    return json({ error: "Experience storage is not available right now. Please try again later." }, 503);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return json({ error: "Submit the experience using the form." }, 415);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_TOTAL_BYTES + 1024 * 1024) {
    return json({ error: "Attachments exceed the 25 MB combined limit." }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The submission could not be read. Please try again." }, 400);
  }

  const fields = {
    experienceCategory: textField(form, "experienceCategory", 100),
    incidentCategory: textField(form, "incidentCategory", 120),
    place: textField(form, "place", 240),
    placeCategory: textField(form, "placeCategory", 100),
    incidentTime: textField(form, "incidentTimeUtc", 40),
    incidentTimeZone: textField(form, "incidentTimeZone", 80),
    locationDetails: textField(form, "locationDetail", 300),
    shortDescription: textField(form, "shortDescription", 240),
    fullDescription: textField(form, "fullDescription", 4000),
    visibility: textField(form, "visibility", 20),
  };
  const missing = Object.entries(fields).some(([key, value]) => key !== "locationDetails" && !value);
  if (missing) return json({ error: "Complete the required experience details before sharing." }, 400);
  if (!["public", "friends", "anonymous"].includes(fields.visibility)) {
    return json({ error: "Choose who can see this experience before sharing." }, 400);
  }
  if (!Number.isFinite(Date.parse(fields.incidentTime))) {
    return json({ error: "Choose a valid date and time for the experience." }, 400);
  }

  const submittedFiles = form.getAll("evidence");
  if (submittedFiles.some((file) => !(file instanceof File))) {
    return json({ error: "One of the attachments could not be read." }, 400);
  }
  const files = submittedFiles.filter((file) => file.size > 0);
  if (files.length > MAX_FILES) return json({ error: "Attach no more than five files." }, 400);
  if (files.some((file) => !ALLOWED_TYPES.has(file.type))) {
    return json({ error: "Use a supported image, PDF, or Word document." }, 415);
  }
  if (files.some((file) => file.size > MAX_FILE_BYTES)) {
    return json({ error: "Each attachment must be 10 MB or smaller." }, 413);
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return json({ error: "Attachments must total 25 MB or less." }, 413);
  }

  const experienceId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const storedFiles = [];
  try {
    for (const file of files) {
      const evidenceId = crypto.randomUUID();
      const objectKey = `evidence/${experienceId}/${evidenceId}`;
      const originalFilename = safeFilename(file.name);
      await env.BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { experienceId, evidenceId, originalFilename },
      });
      storedFiles.push({
        id: evidenceId,
        objectKey,
        originalFilename,
        contentType: file.type,
        sizeBytes: file.size,
      });
    }

    const statements = [
      env.DB.prepare(`
        INSERT INTO experiences (
          id, author_id, experience_category, incident_category, place,
          place_category, incident_time, incident_time_zone, location_details,
          short_description, full_description, visibility, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        experienceId,
        user.id.slice(0, 200),
        fields.experienceCategory,
        fields.incidentCategory,
        fields.place,
        fields.placeCategory,
        new Date(fields.incidentTime).toISOString(),
        fields.incidentTimeZone,
        fields.locationDetails || null,
        fields.shortDescription,
        fields.fullDescription,
        fields.visibility,
        "shared",
        createdAt,
      ),
      ...storedFiles.map((file) => env.DB.prepare(`
        INSERT INTO experience_evidence (
          id, experience_id, object_key, original_filename, content_type, size_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        file.id,
        experienceId,
        file.objectKey,
        file.originalFilename,
        file.contentType,
        file.sizeBytes,
        createdAt,
      )),
    ];
    await env.DB.batch(statements);
  } catch (error) {
    await Promise.allSettled(storedFiles.map((file) => env.BUCKET.delete(file.objectKey)));
    console.error("Experience submission failed", error);
    return json({ error: "NFD couldn’t save your experience right now. Your details are still here; please try again." }, 503);
  }

  return json({ id: experienceId, status: "shared", createdAt }, 201);
}

function textField(form, name, maxLength) {
  const value = form.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function safeFilename(value) {
  return value
    .replace(/[\\/\r\n\0]/g, "_")
    .replace(/[<>:"|?*]/g, "_")
    .trim()
    .slice(0, 120) || "attachment";
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}
