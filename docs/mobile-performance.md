# Mobile performance changes

Implemented 2026-11-06. Baseline source: 74f14d0.

## Changes

1. New photo previews: 960px longest edge, WebP quality 0.72, 256KiB ceiling. Photos below 64KiB and GIFs retain their existing path. Large legacy images without previews require a tap; originals remain available. Video files in feed and profile stay at preload=none until playback.
2. Evidence caches use private revalidation and object ETags. Authentication, visibility, friendship, and deletion checks run before a 304 can be returned. No public media cache was introduced.
3. Minified, hashed reader, messages, account, share, and full admin JavaScript bundles. Composer, messaging, agreement, and admin code are omitted from routes that do not need them. CSS is minified.
4. Initial conversations load 50 messages, with stable timestamp/ID cursors for older history. Conditional refreshes return 304 when unchanged. Loaded history is retained; expired messages are filtered. Visible chats poll at 15s, or 30s when the browser reports Data Saver/2G. Inbox summaries refresh at most once per minute during chat polling.
5. Inbox reads use one bounded, paginated query with ranked latest messages and unread counts, using existing sender/recipient indexes. Authenticated identity lookups are reused within a request only; unchanged identities no longer trigger an upsert. Deactivation/restriction checks remain per request.
6. Feed pages contain 10 posts rather than 20. Native content-visibility skips offscreen rendering and remembers measured card sizes; media remains lazy. The flat feed layout is preserved.

## Measurements

- Previous shared JavaScript: 304,032 raw bytes / 59,819 gzip bytes.
- Reader bundle: approximately 126KB raw / 31KB gzip (about 59% / 49% less). Exact hashed bundles and sizes are printed by the build.
- CSS: 118,956 raw bytes before, 96,358 minified bytes after.
- Browser test image: 5,641,224-byte PNG to 111,040-byte WebP, 640 x 960. This is a synthetic image result, not a guarantee for every upload.
- Unchanged message refresh: HTTP 304, no response body.
- Message pages: 50 initially instead of up to 300; older history loads on demand.

## Verification

- Full automated test suite, full-project lint, focused formatting/build.
- SQLite tests: stable paging at timestamp ties, permissions, expired messages, conditional reads, private-field exclusion, and use of existing sender/recipient indexes.
- Media tests: authorization/visibility/deletion checks cannot be bypassed with a cached ETag.
- Authentication tests: request-local reuse, no unchanged-user writes, deactivation on the next request, restricted-user denial.
- Local dummy-user browser checks at 390x844 and 320x740: feed, message paging, sending, profile, Trust Score, share steps, notifications, local dummy-owner admin, login.
- Local long-feed fixture: 60 cards; deferred legacy photo loads on tap; video remains readyState 0 before playback.
- No physical low-end Android, CPU throttling, weak-network end-to-end latency, or production load benchmark was performed. Gzip figures are local compression comparisons, not observed carrier-network transfer sizes.
- The existing check:full formatting stage reports pre-existing formatting issues in unrelated legacy files and the generated classic bundle. Full lint and tests are run separately, with formatting checked for changed source files.

Legacy media is not bulk rewritten; large originals are deferred instead. Smaller previews apply to new uploads. No production database migration is needed.
