# Performance fix — 26 October 2026

## Root causes

The previous scene ran a permanent40FPS render loop, full-screen SSAO/blur/output passes and a multisampled half-float render target. It also measured/wrote label layout nine times per frame, raycast individual object triangles on pointer events, and redrew while the view was idle. The64+ individual laptop keys added unnecessary meshes.

## Changes

- Removed the post-processing pipeline; native antialiasing and cached soft shadows preserve the office lighting in one scene pass.
- Render only during interaction transitions. Stop at rest, when offscreen/hidden, and behind open dialogs.
- Batch static meshes by material, instance keyboard keys, cache geometry/materials and simplify tiny geometry. Draw calls reduced from107 after the first optimization to58.
- Use nine cached object bounds for picking instead of per-triangle pointer raycasts.
- Measure label widths on resize, then batch transform writes. Remove full-screen SVG noise filtering on the office.
- Cap pixel density; adapt resolution during sustained slow interaction, then restore full resolution when settled.
- Retain native mobile canvas panning: it moves the existing rendered layer without scene redraws.

## Local evidence

Browser: Chromium on the host AMD Radeon integrated GPU;1440x1000 desktop and390x844 viewport. These are local measurements, not a physical-phone guarantee.

- Old idle page browser cadence sample:31FPS,95th percentile frame interval90.1ms.
- New idle sample:144.4FPS browser cadence,95th percentile7.1ms; zero scene renders during3 seconds.
- New sustained pointer-motion samples:65.5–84.5FPS after warm-up. Latest95th percentile20.9ms at adaptive0.7 interaction pixel ratio.
- Settled pixel ratio returned to1.0 (the test browser DPR), with no scheduled frames.
- Mobile scrollLeft280→500: scene render counter remained459, document width390.
- Shadows generated once; no shadow rerender on object hover.
- CV modal paused rendering and Escape restored focus. No browser runtime errors in checked sessions.
- Build/syntax checks and252 local references pass. Automated accessibility check reports zero violations; dynamic background contrast remains a manual visual check.

Optional `?profile=1` exposes read-only `window.officePerformance` counters for local verification. Normal visits do not create these counters on window.
