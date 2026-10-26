# Authored studio prototype

26 October 2026.

Preview: `http://localhost:4173/?studio=1`. Profiling: add `&profile=1`. The ordinary homepage retains the constructed room while this visual direction is evaluated.

## What was built

The studio is authored by `scripts/create-studio.py` using Blender 4.5.9 LTS. It contains custom electronics, curved sketchbook pages and paper stacks, the actual supplied CV, genuine project screenshots, personal photographs, and a downloaded CC0 articulated desk lamp. The desk uses the CC0 Smoked Walnut Veneer material.

The architecture and desk receive full diffuse colour/lighting bakes from Cycles. Blender's bundled Open Image Denoise library denoises them offline. A bounded HDR gain, explicit sRGB encoding and fine dithering preserve gradients; lossless WebP avoids block artefacts when those gains are restored in the shader. The bakes are embedded in the GLB on the second UV set.

`src/studio-assets.js` loads the authored scene and preserves the existing interactive project IDs. Its material adjustment combines baked diffuse colour with live specular light. The cached direct shadow pass contains movable objects; fixed architectural shadows are already baked. Thin paper does not self-shadow through the low-resolution shadow map, avoiding sub-texel acne. Picking still uses cached bounds, with ordinary HTML links and native dialogs for access.

Scene loading is transactional: the original constructed objects remain available until the new asset loads and all nine project roots are validated. An aborted GLB download was checked: the constructed room still opens the sketchbook preview. The main fallback links remain available when the renderer cannot initialise. A lightweight matching image covers the authored room's loading period.

## Files and regeneration

- `scripts/fetch-studio-assets.mjs`: fetches the two Poly Haven source manifests and verifies downloaded files against their recorded MD5 checksums.
- `scripts/prepare-studio.mjs`: converts existing genuine portfolio media for Blender and renders the authored SVG paper artwork.
- `scripts/create-studio.py`: constructs, bakes, renders and exports the editable master.
- `scripts/studio-denoise.py`: offline denoising and deterministic output encoding. It can reprocess cached NPZ bakes without rerunning Cycles.
- `scripts/render-studio.mjs`: starts Blender in background mode, with a nonzero exit code on Python failure.
- `scripts/pack-studio.mjs`: prunes unused textures, compresses remaining images, embeds baked colour maps, rewrites buffer offsets and emits the public GLB, poster, reference render and asset manifest.
- `src/studio-assets.js`: imports the authored asset, connects its materials and registers interactive roots.
- `public/assets/studio/CREDITS.md`: asset authors, sources and licences.

Source artwork, `.blend`, intermediate images and raw bake arrays live in ignored `docs/studio-art/`. Blender and downloaded source assets live outside the repository in the user's `.cache/portfolio-tools/` directory. The normal website build consumes the checked-in model and does not need Blender, Sharp image generation, API credentials or a live asset service.

Regenerate in this order:

```powershell
npm run studio:fetch
npm run studio:prepare
npm run studio:render
npm run studio:pack
npm run build
```

The authoring tool uses a portable Blender distribution, rather than a system-wide installation. The verified Windows executable is under `.cache/portfolio-tools/blender-4.5.9-windows-x64/blender.exe`. `STUDIO_BLENDER` can point to another executable and `STUDIO_SOURCE_CACHE` can choose another source-cache directory. The current denoising helper was exercised with the Windows Blender distribution's `blender.shared/OpenImageDenoise.dll`.

The portable archive came from the Blender Foundation:

- Distribution: https://download.blender.org/release/Blender4.5/blender-4.5.9-windows-x64.zip
- Checksum list: https://download.blender.org/release/Blender4.5/blender-4.5.9.sha256
- Verified SHA256: `41da973b9bf95bb312cbeff4d1982feb13259b43c821686b9bafea4dfe5477cf`

## Local verification

The packed model contains 72,468 triangles and is approximately 5.67 MiB. The visible scene reported 40 draw calls, compared with 58 in the constructed-room snapshot. These counts do not establish performance across devices.

A local Chromium pointer-motion sample at 1440 × 900 and renderer pixel ratio 1 recorded 307 frame intervals: mean 8.48 ms, 95th percentile 15.3 ms. A 900 ms idle sample added zero scene frames, and the renderer returned to an unscheduled state after motion. This is a short automated local sample, not a physical-phone or field-performance guarantee.

Checked journeys included CV preview with the actual PDF iframe, Escape closing and focus restoration, Forma preview followed by its case-study URL, mobile horizontal panning with no scene redraw, keyboard focus of an item across the panorama, and reduced-motion previews with no active animations. The 390px mobile viewport retained a 1200px canvas with no document-width overflow.

Browser device emulation is not physical touch or Safari validation. Mobile network startup, heat, battery use and memory-pressure recovery remain unverified. The poster reduces the perceived wait; the model's transfer size is still a prototype optimisation target.

## Boundaries

The room is an illustrative composition, not a scan of the user's physical office. The app screens, CV and supplied personal photographs are genuine portfolio assets. The paper artwork is authored presentation material, not evidence of additional product capabilities. The CC0 lamp/material are credited even though their licences do not require attribution.

No new project functionality, device/venue validation, employment claim or production-readiness claim is implied by the graphics work.
