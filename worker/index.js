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
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(PAGE_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin",
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/api/experiences") {
      return submitExperience(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

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
