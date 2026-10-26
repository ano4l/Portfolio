# Animated pickups and expanded stories — 26 October 2026

## Pickup interaction

The preview uses the selected 3D object's projected visible bounds. The physical object leaves the cached office scene in one frame; its presentation artifact animates into a two-column preview with a short perspective tilt and staggered copy. Closing reverses the artifact to the desk and restores the real object and keyboard focus.

The room darkens using opacity; no backdrop blur or post-processing pipeline is enabled. All preview motion uses compositor transform/opacity. The native dialog provides modal focus behaviour. Escape, close button, blank backdrop, interruption and reduced motion are handled. Reduced-motion opening/closing is immediate.

QA: desktop and390px mobile previews reviewed; normal opening/animated Escape return; rapid close while opening followed by a different project; reduced motion produced zero running animations and restored focus. Optional profile counters held steady while the preview was visible, with no scheduled WebGL frame. The source pickup/return each require a single scene handoff frame. No browser errors observed.

## Content

Eight project stories now include context, personal contribution, expanded journey descriptions, capabilities, three optional engineering notes and a reflection. Digital Twin remains deliberately broad and receives no private engineering detail. Folio credits sole design/development per the user's confirmation.

Additional current-source checks:
- NovaLens src/lib/vision.ts: provider interface, structured fields/evidence, normalization, missing-keys blank mock and error/timeout paths.
- Atlas apps/mobile/src/map/demo-routing.ts: schematic graph, split corridor crossings, inter-floor connections, step-free lift branch.
- TradeOS apps/web/src/lib/api.ts: explicit mock-data branch vs API requests and error propagation.
- Forma parser.js: integer currency minor units and default-currency warning; db.js quote/invoice status lists.
- Dala Services/APIClient.swift: typed URLSession requests and distinct user-facing error conditions; Views tree covers discovery, profiles and bookings.
- AceTech RequisitionPolicy.php: requester ownership plus draft-state editing/deletion rules.
- Folio study-quiz.ts and document-pages.ts: evidence-bearing quiz schema and page-preserving text validation; admin route explicit columns exclude private source material.
- Laas workers/video/real_analysis.py and README: decode/capability checks, unreviewed observations, persisted retry/restart scope and image-space limits.

No live provider, venue, payment or physical-device claims were added. Added gallery assets are genuine captures: earlier Atlas search/navigation studies are explicitly labelled illustrative, and Forma invoice editor uses seeded records. Each new capture was visually inspected before optimized WebP conversion. No real customer records were found in the selected images.

Preview facts are generated from src/content.mjs, so contribution and status do not drift independently between the desk and case pages. Long-form layout helpers live in src/project-sections.mjs.

## Checks

Build and JavaScript syntax checks pass.303 local references across17 HTML files (16 routes plus404) resolve. Atlas desktop and Forma mobile case audits reported zero automated accessibility violations. Preview audit reported zero violations with manual contrast review needed for animated/transformed content over the canvas. Engineering disclosures open natively without JavaScript. Mobile case page width remained390px at390px viewport.
