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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/login") {
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && ["/", "/feed", "/feed/"].includes(url.pathname)) {
      if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
        return Response.redirect(new URL("/login?return_to=%2Ffeed", url), 302);
      }
      if (url.pathname === "/") return Response.redirect(new URL("/feed", url), 302);
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && url.pathname === "/share") {
      if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
        return Response.redirect(new URL("/login?return_to=%2Ffeed", url), 302);
      }
      return html(PAGE_HTML);
    }
    if (request.method === "GET" && url.pathname === "/admin") {
      if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
        return Response.redirect(new URL("/login?return_to=%2Fadmin", url), 302);
      }
      if (!(await isAdmin(request, env))) {
        return Response.redirect(new URL("/login?access=denied", url), 302);
      }
      return html(PAGE_HTML);
    }

    if (request.method === "GET" && url.pathname === "/api/auth-status") {
      if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
        return json({ error: "Sign in to use NFD." }, 401);
      }
      return json({ isAdmin: await isAdmin(request, env) });
    }
    if (url.pathname === "/api/admins" && ["GET", "POST"].includes(request.method)) {
      return manageAdmins(request, env);
    }
    if (url.pathname === "/api/admins" && request.method === "DELETE") {
      return removeAdmin(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/experiences") {
      return listExperiences(request, env);
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

function ownerEmail(env) {
  return (env.NFD_OWNER_EMAIL || (env.NFD_ADMIN_EMAILS || "").split(",")[0] || "").trim().toLowerCase();
}

function isOwner(request, env) {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
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
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) return false;
  if (isOwner(request, env)) return true;
  try {
    await ensureAdminTable(env);
    return Boolean(await env.DB.prepare("SELECT email FROM nfd_admin_users WHERE email = ? LIMIT 1").bind(email).first());
  } catch (error) {
    console.error("Admin access lookup failed", error);
    return false;
  }
}

async function manageAdmins(request, env) {
  if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
    return json({ error: "Sign in to manage NFD administrator access." }, 401);
  }
  if (!isOwner(request, env)) {
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
  if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
    return json({ error: "Sign in to manage NFD administrator access." }, 401);
  }
  if (!isOwner(request, env)) {
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

async function listExperiences(request, env) {
  if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
    return json({ error: "Sign in to view the NFD experience feed." }, 401);
  }
  if (!env.DB) return json({ error: "The NFD experience database is not available right now." }, 503);
  try {
    const url = new URL(request.url);
    const placeSearch = cleanSearchTerm(url.searchParams.get("place"));
    const locationSearch = cleanSearchTerm(url.searchParams.get("location"));
    const conditions = ["status = ?"];
    const bindings = ["shared"];
    if (placeSearch) {
      conditions.push("instr(lower(place), lower(?)) > 0");
      bindings.push(placeSearch);
    }
    if (locationSearch) {
      conditions.push(`(
        instr(lower(COALESCE(location_details, '')), lower(?)) > 0
        OR instr(lower(place_category), lower(?)) > 0
        OR instr(lower(place), lower(?)) > 0
      )`);
      bindings.push(locationSearch, locationSearch, locationSearch);
    }
    const where = conditions.join(" AND ");
    const [result, totalResult, placeResult, locationResult] = await Promise.all([
      env.DB.prepare(`
        SELECT id, experience_category, incident_category, place, place_category,
          location_details, incident_time, incident_time_zone, short_description,
          full_description, created_at
        FROM experiences
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(...bindings).all(),
      env.DB.prepare(`SELECT COUNT(*) AS total FROM experiences WHERE ${where}`).bind(...bindings).first(),
      env.DB.prepare(`SELECT DISTINCT place FROM experiences WHERE ${where} ORDER BY place COLLATE NOCASE LIMIT 100`).bind(...bindings).all(),
      env.DB.prepare(`SELECT DISTINCT location_details FROM experiences WHERE ${where} AND location_details IS NOT NULL AND trim(location_details) != '' ORDER BY location_details COLLATE NOCASE LIMIT 100`).bind(...bindings).all(),
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
        createdAt: experience.created_at,
        evidence: evidenceByExperience.get(experience.id) || [],
      })),
    });
  } catch (error) {
    console.error("Experience feed query failed", error);
    return json({ error: "NFD couldn’t load the experience feed right now." }, 503);
  }
}

function cleanSearchTerm(value) {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100) : "";
}

async function serveEvidence(request, env, evidenceId) {
  if (!request.headers.get("oai-authenticated-user-id")?.trim()) {
    return new Response("Sign in to view this evidence.", { status: 401 });
  }
  if (!env.DB || !env.BUCKET) return new Response("Evidence storage is unavailable.", { status: 503 });
  try {
    const record = await env.DB.prepare(`
      SELECT ee.object_key, ee.original_filename, ee.content_type
      FROM experience_evidence ee
      INNER JOIN experiences e ON e.id = ee.experience_id
      WHERE ee.id = ? AND e.status = ?
    `).bind(evidenceId, "shared").first();
    if (!record) return new Response("Evidence not found.", { status: 404 });
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

async function submitExperience(request, env) {
  const authorId = request.headers.get("oai-authenticated-user-id")?.trim();
  if (!authorId) return json({ error: "Sign in to share an experience." }, 401);
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
  };
  const missing = Object.entries(fields).some(([key, value]) => key !== "locationDetails" && !value);
  if (missing) return json({ error: "Complete the required experience details before sharing." }, 400);
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
          short_description, full_description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        experienceId,
        authorId.slice(0, 200),
        fields.experienceCategory,
        fields.incidentCategory,
        fields.place,
        fields.placeCategory,
        new Date(fields.incidentTime).toISOString(),
        fields.incidentTimeZone,
        fields.locationDetails || null,
        fields.shortDescription,
        fields.fullDescription,
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
