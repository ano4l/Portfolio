# On My Table — Anotida Dzinotyiwei

A statically generated personal portfolio with a Three.js office scene. Project records live in `src/content.mjs`; page templates in `src/build.mjs`; assets and styles in `public/`. The room and physical objects are constructed in `src/office.js`; `scripts/bundle.mjs` bundles them locally with esbuild.

## Run

- `npm ci` installs the locked dependencies.
- `npm run build` bundles the 3D scene and generates `dist/`.
- `npm run dev` builds once and serves http://localhost:4173.
- After source edits run `npm run build`, then refresh the browser.

Requires Node.js 22.x. No API keys required. Serve only `dist/`, never the workspace root: audit notes contain private local paths.

## Authored studio prototype

Open `http://localhost:4173/?studio=1` for the Blender-authored room. The standard homepage remains available for comparison. The prototype includes curved paper, custom electronics, genuine screen/CV textures, a CC0 articulated lamp and walnut material, denoised Cycles diffuse bakes, and live reflections and object shadows. It retains native mobile panning and accessible object previews.

The checked-in GLB and poster are sufficient for ordinary builds. Blender is an optional offline authoring tool. To regenerate assets, run `npm run studio:fetch`, `npm run studio:prepare`, `npm run studio:render`, then `npm run studio:pack`. The rendering step needs Blender; the fetch step verifies CC0 source-file checksums. See [the prototype notes](docs/STUDIO-PROTOTYPE.md) for setup, rendering details, asset credits and verification limits.

## Deploy

The repository includes `vercel.json`. In Vercel, import `ano4l/Portfolio`, select the `main` branch and keep the Root Directory at `./`. The configuration selects the **Other** framework, installs with `npm ci --include=dev`, builds with `npm run build` and publishes only `dist/`. `package.json` pins Node.js 22.x. No API keys, Blender installation, database or serverless functions are required.

Each route has its own `index.html`. Trailing slashes match the existing links; direct case-study URLs work without a single-page-app rewrite. Vercel serves the generated `404.html` for unknown paths. Unversioned files revalidate on repeat visits, so new scenes and CV updates are not trapped in a long browser cache. Baseline response headers retain same-origin PDF previews.

The canonical origin is selected in this order: optional `SITE_URL`, Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`. An explicit `SITE_URL` must be a complete origin such as `https://your-domain.com`, without a path. Normally no manual environment variable is needed when Vercel exposes its system environment variables. Update `SITE_URL` if you use it and later change domains.

Production builds with an origin generate absolute canonical/social URLs, `robots.txt` and a sitemap containing all portfolio pages. Preview builds use `noindex,nofollow`, disallow crawling and omit the sitemap. Local builds without an origin omit canonical/social-image URLs and the sitemap.

The ordinary homepage remains the constructed room; the Blender-authored prototype is available at `/?studio=1`, including after deployment.

Before importing, run `npm ci`, `npm run test:deployment`, `npm run build`, and `python docs/check-links.py` locally. After Vercel deploys, verify the homepage and `/?studio=1`, a direct case-study link such as `/work/novalens/`, mobile panning, CV preview/download, `/sitemap.xml`, and an unknown URL returning the custom 404 with HTTP status 404. No Vercel deployment has been performed as part of this preparation.

## Content

The user confirmed primary ownership of the selected projects and sole implementation of Folio. Blendd is intentionally omitted. Digital Twin intentionally contains only broad introductory text. TradeOS, Forma, Atlas and Dala are associated with VirtuKey as requested.

The first page of the actual supplied CV is rendered onto the desk. The sketchbook and file folder have modelled covers, pages, tabs and depth. A generated walnut albedo texture, procedural plaster/leather bump textures, environment reflections and cached soft shadows give the room material depth. Sunset lighting responds to the cursor. Pointer movement adjusts the camera subtly; object focus/hover lifts the physical item; tapping opens an accessible preview. The scene renders on demand and stops when settled, offscreen, hidden or behind a preview. Static meshes are batched, the keyboard is instanced, and pointer picking uses cached object bounds. Sustained slow frames lower interaction resolution automatically; full resolution returns once settled. Mobile uses native horizontal scrolling across a continuous 1200px office canvas without scene redraws. Keyboard focus scrolls the corresponding item into view. Reduced motion disables camera drift, light tracking and lifting. If the renderer is unavailable, ordinary project links remain accessible.

Project screenshots are genuine local captures, with sample/historical/illustrative captions. A real existing CV is supplied unchanged. Private source-discovery notes are kept outside the repository; public claims and image captions preserve the evidence limits.

## Before publication

- Confirm rights to reproduce the Laas broadcast-footage frame, or replace it with an owned clip's annotated frame.
- Review the August 2026 CV for current roles and contact details.
- Supply genuine Dala iPhone and sanitized AceTech screenshots to deepen those presentations.
- Confirm public project/source destinations before adding links to private repositories.
- VK Command Centre currently has a descriptive sketchbook entry; its source/visual evidence was not located.

No live provider, physical-device, venue accuracy or production readiness claim follows from the portfolio build. Image captions and case-study status text preserve those boundaries.

## Project stories and pickup motion

Project context, contribution, journey detail, gallery metadata and engineering notes live in `src/content.mjs`. `src/project-sections.mjs` renders the extended story sections and native engineering disclosures. The homepage generates preview facts from the same records.

`public/scene.js` handles object previews with compositor-only pickup/return animation, perspective tilt, native modal focus and reduced motion. `src/office.js` provides projected object bounds and a single cached scene handoff on pickup/return; rendering remains paused while the preview is visible. See [docs/PICKUP-AND-CONTENT.md](docs/PICKUP-AND-CONTENT.md) for interaction and content notes, and [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for local performance measurements.
