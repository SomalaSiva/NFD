# Browser application source

The classic browser application is organized into ordered source parts in `parts/manifest.json`.
Each file covers shared setup or a screen area. The build concatenates these parts in manifest order
into `web/assets/app.js`, preserving one shared JavaScript scope and the existing load behavior.

Keep cross-screen utilities and DOM bindings in `00-shared-bindings.js`. Keep route-specific
initialization near its screen's part, and update the manifest only when adding or moving a part.
The app source bundle test checks that the generated bundle matches the ordered source parts.
