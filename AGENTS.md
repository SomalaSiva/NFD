# Core project instructions

## Responsive UI is a default requirement

- Keep the same essential content, navigation, and interaction order across desktop and mobile. Reflow layouts only when it helps them fit; do not hide important actions or let them drift beyond the viewport.
- Check every route and its important UI states at narrow mobile, standard mobile, tablet, and desktop widths before publishing.
- Prevent page-level horizontal overflow. Keep cards, fields, buttons, badges, navigation, and admin lists within the viewport. Use horizontal scrolling only for intentional media galleries or similar content that benefits from it.
- Keep compact navigation labels, badges, chips, and short controls on one line when practical. Adjust spacing, fluid sizing, or layout distribution before allowing accidental wrapping or overflow. Keep narrative text readable and naturally wrapped.
- Verify the shared header, account menu, forms, dialogs, tabs, lists, and media layouts—not only the main page body—at mobile sizes.

## ChatGPT app preview defaults to mobile

- Whenever opening or sharing the NFD app in a ChatGPT browser or preview, use a portrait phone-sized viewport only (about 390 × 844 CSS pixels). Do not open it in a desktop-sized viewport.
- Keep the ChatGPT preview in mobile view for future app links and review sessions. If the available browser tool cannot control its viewport, say so plainly and keep the app UI itself in the requested mobile responsive state where supported.

## Verify changes before calling them done

- Before reporting an app change as complete or sharing its preview/live link, run the relevant automated checks and exercise the changed behavior in the app.
- Run a regression smoke check of existing core flows affected by the change. For releases, cover sign-in and sign-out, feed browsing and engagement, post creation/editing/deletion and media, profiles and friendships, messages/stories, and administrator access as applicable.
- Check the changed UI in the portrait mobile ChatGPT preview and confirm existing related controls still work. Do not claim a flow or feature is intact unless it was actually checked.
- Verify that a live release succeeded and that its exact source commit was pushed to Git before saying it is live or sharing the live link.
- If browser access, test accounts, or environment constraints prevent a check, state exactly what was and was not verified before handing off the link.
