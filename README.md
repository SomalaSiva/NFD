# NFD — No Face Docs

NFD is a story-sharing web app. Its pages are plain HTML, CSS, and JavaScript. A Cloudflare Worker serves the pages and API, D1 stores application data, and R2 stores uploaded files. OpenAI Sites publishes the production Worker at `https://nfd.nofacedocs.com`.

## Stack

- **Browser UI:** HTML, CSS, vanilla JavaScript. No frontend framework.
- **Server:** JavaScript ES modules and the Cloudflare Workers Fetch API.
- **Build:** Node.js and esbuild.
- **Database:** Cloudflare D1 (SQLite), with Drizzle ORM/Drizzle Kit schema and migration tooling. Runtime queries use D1 prepared SQL statements.
- **File storage:** Cloudflare R2.
- **Sign-in:** Google OAuth and the ChatGPT identity header provided by the hosted environment.
- **Session security:** Signed-in users are returned to the sign-in screen after four minutes without activity. Google sessions also expire server-side after four idle minutes; ChatGPT-hosted sessions use an NFD app sign-out marker until the person signs in again.
- **Optional story review:** Google Gemini API.
- **Source/deploy:** GitHub plus OpenAI Sites.

## Project map

- `worker/index.js` — Worker entry point, HTTP routing, Google sign-in, sessions, and Ghost mode.
- `worker/routes/admin.js` — administrator operations and audit/member lists.
- `worker/routes/social.js` — friends, requests, and messages.
- `worker/routes/experiences.js` — feed, profiles, comments, reactions, attachments, and post submission.
- `worker/routes/agreements.js` — Gemini agreement drafts, in-app approvals, version changes, and participant outcome/disagreement tracking.
- `worker/lib/` — shared Worker utilities.
- `web/index.html` — shared page markup and route-specific page sections.
- `web/assets/app.css` and `web/assets/app.js` — shared styles and browser behavior.
- `web/privacy.html`, `web/guidelines.html`, and `web/nfd-icon.png` — static pages and image.
- `db/schema.ts` — Drizzle reference for all application tables.
- `db/migrations/` — current D1 migration baseline and future forward migrations.
- `drizzle/` — hosted Sites migration bundle; keep its applied history immutable and append forward migrations for production releases.
- `scripts/build-worker.mjs` — bundles the Worker and its web assets into `dist/`.
- `wrangler.jsonc` — local-only Worker, D1, and R2 configuration. Production publishing is handled by Sites.

## Run locally

Prerequisites: Node.js 22.13 or newer, npm, and a local Google OAuth client if you want to test sign-in. Local D1 and R2 are isolated emulators; they do not access production data.

1. Install locked dependencies: `npm ci`.
2. Copy `.dev.vars.example` to `.dev.vars` and enter a **local-only** Google OAuth client and secret. Add `http://localhost:8787/auth/google/callback` to that client's allowed redirect URLs. Never copy production secrets into this file.
3. Initialize the local database: `npm run db:local:init`.
4. Build and start the local Worker: `npm run dev`.
5. Open `http://localhost:8787`.

The ChatGPT identity header is supplied by the hosted environment and is not available in ordinary local browser sessions. Google OAuth is the local sign-in path. Wrangler keeps local D1/R2 state under `.wrangler/`; delete that directory only when you want to reset your local test data.

## Database changes

Update `db/schema.ts`, generate a migration with `npm run db:generate -- --name=short_description`, inspect the SQL, then test it against local D1. Keep the generated SQL in `db/migrations/` and run `npm run db:local:migrate` locally. `db/migrations/` is the local D1 history and baseline; `drizzle/` is the separate hosted Sites migration bundle included in release archives. For a production schema change, append a reviewed forward migration and matching journal/snapshot metadata to `drizzle/`; never apply the local baseline to the existing live database or rewrite already applied migrations. Sites applies the hosted migrations before uploading the Worker.

The Worker still has idempotent schema checks for compatibility with older installations. Treat those as a transition aid; new schema changes belong in the Drizzle schema and reviewed migration files.

## Quality checks

- `npm run check` — lint, formatting check, unit tests, and production build.
- `npm run format` — format project source.
- `npm test` — run the Node built-in test suite.
- `npm run build` — create the deployable Worker at `dist/server/index.js`.

Run `npm run check` before handing off or publishing a change.

## Responsive UI baseline

The responsive layout is a project-wide requirement. Keep essential content and actions consistent across desktop and mobile, reflowing only as needed to fit. Check every route and major UI state at narrow mobile, standard mobile, tablet, and desktop widths. Prevent page-level horizontal overflow and keep compact labels, badges, controls, and navigation from wrapping unexpectedly. Horizontal scrolling is reserved for intentional content such as media galleries; narrative text should remain readable and naturally wrapped. See [AGENTS.md](AGENTS.md) for the contributor instruction.

## Production publishing

NFD production is published through OpenAI Sites. Commit and push the exact source to GitHub first, build/package that commit, save a Sites version, then deploy the saved version. Do not use `wrangler deploy`; the Wrangler config is for local development only. Keep the production audience, secrets, D1, and R2 bindings unchanged unless a task specifically requires changing them.

## Admin pages

- `/admin` — overview
- `/admin/ghost-access` — Ghost mode access
- `/admin/restricted-emails` — sign-in and account-creation restrictions
- `/admin/posts` — shared post search and moderation
- `/admin/members` — member directory and account status (owner only)
- `/admin/activity` — account activity (owner only)
- `/admin/moderation` — automatic post review
- `/admin/admins` — administrator access (owner only)

Admin permissions are checked by the Worker APIs as well as by page navigation.
