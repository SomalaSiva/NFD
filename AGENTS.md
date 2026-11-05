# Core project instructions

## Fast, focused execution

- Use this project root and its `main` Git checkout as the single source of truth. Do not build or publish from nested release or Sites checkout folders.
- Take the fastest reliable path to a complete result. Inspect and change only the code and project guidance needed for the request; avoid unrelated refactors and repeated checks that do not add useful confidence.
- Keep verification proportional to the change. Run the targeted checks and exercise the changed behavior plus directly affected flows. Expand regression coverage when the change touches shared infrastructure, authentication, permissions, data integrity, or when a targeted check exposes a wider risk.
- Preserve the app’s established visual style, navigation, responsive behavior, and feature conventions. Make the smallest coherent change that fits the existing product.
- For a visual change, verify the affected view at mobile size and any other viewport or shared component directly affected. Do not check unrelated routes unless the change could affect them.
- For a release, verify the tested commit was pushed and deployment succeeded before calling it live.

## Responsive UI is a default requirement

- Keep the same essential content, navigation, and interaction order across desktop and mobile. Reflow layouts only when it helps them fit; do not hide important actions or let them drift beyond the viewport.
- Check the affected route and important UI states at the widths relevant to the change. Include narrow mobile, standard mobile, tablet, and desktop when the responsive layout or shared navigation is changed.
- Prevent page-level horizontal overflow. Keep cards, fields, buttons, badges, navigation, and admin lists within the viewport. Use horizontal scrolling only for intentional media galleries or similar content that benefits from it.
- Keep compact navigation labels, badges, chips, and short controls on one line when practical. Adjust spacing, fluid sizing, or layout distribution before allowing accidental wrapping or overflow. Keep narrative text readable and naturally wrapped.
- Verify the shared header, account menu, forms, dialogs, tabs, lists, and media layouts—not only the main page body—at mobile sizes.

## ChatGPT app preview defaults to mobile

- Whenever opening or sharing the NFD app in a ChatGPT browser or preview, use a portrait phone-sized viewport only (about 390 × 844 CSS pixels). Do not open it in a desktop-sized viewport.
- Keep the ChatGPT preview in mobile view for future app links and review sessions. If the available browser tool cannot control its viewport, say so plainly and keep the app UI itself in the requested mobile responsive state where supported.

## Verify changes before calling them done

- Before reporting an app change as complete or sharing its preview/live link, run only the automated checks relevant to the change and exercise the changed behavior in the app.
- Run regression smoke checks for existing flows directly affected by the change. For releases, include the relevant core flows; check the full core-flow set only when the change is broad enough to affect it.
- Check the changed UI in the portrait mobile ChatGPT preview when the UI is affected, and confirm related controls still work. Do not claim a flow or feature is intact unless it was actually checked.
- Verify that a live release succeeded and that its exact source commit was pushed to Git before saying it is live or sharing the live link.
- If browser access, test accounts, or environment constraints prevent a check, state exactly what was and was not verified before handing off the link.

## Local app testing

- Local app preview and UI testing should not require the user to sign in. The local development launch command enables the explicit test identity; do not ask the user to complete OAuth just to test local changes.
- The local test identity must only activate for loopback hosts (`localhost`, `127.0.0.1`, or `::1`); never enable or rely on it for a deployed hostname or a production database.
- Keep real authentication protections covered by automated tests, including checks that the local test identity is rejected on non-loopback hosts.

## Test and release commands

- Use `npm run check:fast` to lint and format changed files, run mapped tests for the affected feature, and build once. It runs the full test suite for database/schema changes.
- Run the relevant tests directly with `npm run test:focused -- test/<relevant-file>.test.js`.
- Use `npm run check:full` for broad or cross-cutting changes; it runs all tests and the build.
- Before publishing, use `npm run release:prepare` to confirm the source tree is clean, the current `main` commit is pushed, and a fresh fast check/build passes. Publish that exact SHA through OpenAI Sites; never use `wrangler deploy`.
- After publishing, use `npm run release:smoke` to check the live app routes return successfully. This is a route availability check, not a substitute for checking the changed behavior in the app.

## Data access and performance

- Keep list reads bounded: select only fields the screen needs and paginate with a stable order. Do not load an entire growing table into memory for a list view.
- Design indexes alongside new filters and sort orders. Update the Drizzle schema and add a migration; use compatibility setup only when older local databases need the same index.
- Avoid per-row database requests. Combine related reads where practical, and run independent reads concurrently when doing so does not change their consistency requirements.
- Keep user searches parameterized, cap search text and page sizes, and escape wildcard characters when using `LIKE`.
- Do not return private fields such as email addresses unless the feature explicitly needs them. Search should not require exposing them in API responses.
- For meaningful list/search changes, test authorization, bounds, paging, sensitive-field exclusion, failure behavior, and—when possible—SQLite query plans to confirm the intended index is used.
- Avoid promising zero latency or capacity without load measurements. Record what was measured and what remains untested.
