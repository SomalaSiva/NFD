# NFD — No Face Docs

NFD is a Cloudflare Worker application backed by D1 and R2. Source stays organized by responsibility and is bundled for deployment.

## Project layout

- `worker/index.js` is the Worker entry point and HTTP route table.
- `worker/routes/admin.js` contains administrator authorization and admin operations.
- `worker/routes/social.js` contains friend discovery, requests, and direct messages.
- `worker/routes/experiences.js` contains feed, profile posts, comments, reactions, attachments, and submission workflows.
- `web/` contains the shared page shell, privacy and community-guideline pages, and static assets.
- `db/schema.ts` is the Drizzle schema; sequential SQL migrations and snapshots are in `drizzle/`.
- `scripts/build-worker.mjs` bundles Worker modules with esbuild and packages the web shell into `dist/`.

## Admin pages

- `/admin` — administration overview
- `/admin/ghost-access` — Ghost mode access
- `/admin/restricted-emails` — sign-in and account-creation restrictions
- `/admin/posts` — shared post search and moderation
- `/admin/members` — member directory and account status (site owner)
- `/admin/activity` — account activity (site owner)
- `/admin/moderation` — automatic post review
- `/admin/admins` — administrator access (site owner)

Every admin page is protected at the Worker route and again at its API endpoint. Owner-only pages are not available to other admins.

## Build

Install the locked dependencies with `npm ci`, then build with `npm run build` (or `node scripts/build-worker.mjs`). The deployable Worker entry is `dist/server/index.js`.
