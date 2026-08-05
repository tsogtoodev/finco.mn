# finco.design — render performance research

Measured against the live site (https://finco.design) on 2026-08-04. Nothing in the
repo was modified.

## How these numbers were obtained

The in-app browser pane runs with `document.visibilityState === 'hidden'` and
`innerWidth === 0`, so `requestAnimationFrame` never fires and no Spline scene ever
loads or renders there. Workaround: shim `requestAnimationFrame` with `setTimeout`,
import `@splinetool/runtime@1.12.98` directly, instantiate each production scene at
its production canvas size, then drive `app.render(t)` manually while instrumenting
`gl.drawElements` / `gl.drawArrays` / `gl.viewport`.

This gives **true per-frame GL work** (passes, pixels, draw calls, triangles) but
excludes browser compositing, Lenis and layout. No real Chrome was connected to the
session, so end-to-end FPS was not measured.

**The frame-time figures come from an Apple GPU and are sub-millisecond. Do not read
them as "this is fine."** The durable, hardware-independent numbers are the
*fullscreen passes, megapixels and draw calls* below.

## Measured per-scene cost (DPR 2)

| Scene | Where | Canvas CSS | Buffer | Fullscreen post passes | Post-proc fill / frame | Draw calls / frame | Triangles / frame | Objects | Payload | `load()` |
|---|---|---|---|---|---|---|---|---|---|---|
| AboutMission | `/about` (lg+) | **1920×1080** (hard-coded) | 3840×2160 = 8.29 MP | 13 | **62.2 MP** | 19 | 388,069 | 4 | **1.51 MB** | 2.3–3.8 s |
| AboutValues cluster | `/about` (lg+) | **1024×1024** (hard-coded) | 2048×2048 = 4.19 MP | 11 | 30.4 MP | **503** | 352,283 | **189** | 947 KB | **4.5 s** |
| HomeStats wave | `/` (**sm+**) | ~viewport | 2560×1470 = 3.76 MP¹ | 8 | 24.6 MP | 16 | **431,180** | 5 | 300 KB | 1.9 s |
| ContactCta card | `/` + every `/products/*` | 1040×350 | 2080×700 = 1.46 MP | **24** | 24.3 MP | **413** | 43,299 | 26 | 74 KB | 0.2 s |
| MapEmbed pin | `/branches`, `/contact` (**incl. mobile**) | ~400×400 | 800×800 = 0.64 MP | — | — | 6 | 82,179 | — | 100 KB | 1.3 s |

¹ measured at a 1280-wide viewport; the real box is `w-full min-h-[51vw] scale-120`,
so at 1440 it is closer to 2880×1800 = 5.2 MP.

Pass viewports (raw): AboutMission `{1920×1080: 6, 3840×2160: 6}` ·
AboutValues `{1024²: 5, 2048²: 6}` · HomeStats `{1024²: 1, 1280×735: 1, 2560×1470: 6}` ·
ContactCta `{1024²: 4, 1024×350: 8, 2048×700: 12}`.

## Per-page totals, per frame

| Page | WebGL contexts | Fullscreen passes | Post-proc fill | Draw calls | Triangles |
|---|---|---|---|---|---|
| `/about` (lg+) | 2 | 24 | **92.6 MP** | **522** | 740,352 |
| `/` (sm+) | 2 | 32 | 48.9 MP | **429** | 474,479 |

At 60 fps `/about` is **5.6 gigapixels/s** of post-processing fill plus **31,300 draw
calls/s**, on the same main thread as Lenis, the scroll handlers and Vue.

Two separate bottlenecks:
* **Fill-rate bound** — AboutMission, HomeStats (few objects, huge blurred passes).
* **CPU/driver bound** — AboutValues (503 calls), ContactCta (413 calls): many tiny
  meshes, no instancing.

## `renderMode: 'auto'` does not help

`renderMode` already defaults to `'auto'` in the runtime, and the render function
skips when `_skipRender` is set. Measured: **60 of 60 frames rendered at full cost**
for all four scenes. Every scene has continuous baked animation, so the skip never
engages. While a scene is on screen it costs full price every frame.

## Levers, ordered by impact ÷ effort

### A. Pixel ratio — biggest single win, one line

Verified in the runtime: `_getPixelRatio(t) { case 0: return window.devicePixelRatio;
case 1: return 1; case 2: return 2 }`, fed from
`scene.publish.settings.web.pixelRatioDesktop/Mobile`, which **default to `0`**. So
every scene renders at 2× on retina and 1.25–1.5× on scaled Windows laptops.

These are soft, out-of-focus decorative scenes; DPR 1 (or 0.75) is visually
indistinguishable. Measured on AboutMission: **1.32 → 0.23 ms/frame (5.7×)**.

Mechanism note: `setPixelRatio()` alone left the canvas backbuffer at 8.29 MP —
Spline's `setSize` override early-returns when the CSS size is unchanged — yet the
frame time still dropped 5.7×, because the *internal post-processing render targets*
shrank to ¼. That is itself evidence post-processing dominates. To shrink the final
backbuffer too, the canvas size must change in the same call. Re-confirm when
implementing.

Two routes: set `pixelRatioDesktop = 1` in the Spline editor's publish settings, or
add a `maxPixelRatio` prop to `SplineScene` that calls `setPixelRatio` + `setSize`
after load and re-applies on resize.

### B. AboutMission renders ~2× the pixels it shows

`app/components/AboutMission.vue:169` — `<div class="h-[1080px] w-[1920px]">`. Fixed
1920×1080 regardless of viewport, then **clipped** by the parent
(`width: var(--scene-w)`, `h-[100dvh]`, `overflow-hidden`). At a 1440-wide viewport
the visible box is ~1143×900, so roughly half the rendered pixels are discarded.
With DPR 2 that is 8.29 MP rendered to show ~2 MP. Sizing the canvas to the visible
box is a further 2–4× on top of A.

### C. Draw-call count (editor work, biggest remaining win)

AboutValues: 189 objects → **503 draw calls** (~2.7 per object: base + shadow +
variant), 11 shader programs. ContactCta: 26 objects → **413 draw calls**, 16
programs. Fixable only in the Spline editor: join the cube cluster into fewer meshes,
drop per-object shadow casters, collapse duplicate materials.

### D. Never render two scenes at once

Both `/about` and `/` keep two contexts alive and render both whenever both are
within `SplineScene`'s 200 px IntersectionObserver margin. Worse: on `/`, HomeStats
is inside `lg:motion-safe:sticky lg:motion-safe:top-0` (`app/pages/index.vue`), so it
stays pinned and on-screen for the **entire HomeProducts scroll** — it renders
continuously through the longest scroll stretch on the site while HomeProducts
composites over it. Options: drop the 200 px margin to 0; add a coordinator so only
the most-visible scene renders.

### E. Cap the decorative scenes to 30 fps

None of these are interactive 3D. Halves everything above, invisible on slow ambient
loops. `SplineScene`'s `syncRender` already owns `_renderer.setAnimationLoop`, so the
throttle is a few lines in code that already exists.

### F. Give weak devices the static fallback

Fallbacks already exist (`torus`, `cluster`, `stats-wave.png`, `contact-cards.png`).
Current gates are viewport width and saveData/2G only. Missing:
* **`prefers-reduced-motion: reduce`** — Lenis is disabled for these users, Spline is not.
* `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory <= 4`.
* `WEBGL_debug_renderer_info` unmasked-renderer check for known-slow integrated GPUs.
* A measured bail-out: if the first ~2 s averages under ~40 fps, dispose and swap in
  the fallback image.

Note phones are already spared everywhere except `MapEmbed`, which has no responsive
gate at all — the pin scene loads on mobile on `/branches` and `/contact`. So the
10 fps reports are **desktop/laptop**, which points squarely at integrated graphics.

### G. Load-time stall (separate from frame cost)

AboutMission is **1.51 MB / 2.3–3.8 s in `load()`** — parse + GPU upload, on the main
thread. AboutValues is 947 KB / 4.5 s. That is a multi-second freeze on `/about`.
Self-hosting (`move-spline-scenes-public.md`) fixes network latency but not this;
only poly/texture reduction in the editor does.

## Non-Spline findings

### H. HomeStats' 95 px blur stack — highest-value non-Spline fix

`app/components/HomeStats.vue:27–41`. One element carries **both**
`backdrop-filter: blur(95.55px)` **and** an SVG `feGaussianBlur stdDeviation="95.55"`
over a 1894×601 region. Plus two full-height masked `backdrop-blur-[4px]` overlays.
All of it inside the sticky section, over a live WebGL canvas.

A 95 px blur is roughly 4× the cost of a 24 px one; `backdrop-filter` forces a
backdrop snapshot and re-blur on every composite; `mask-image` on the two 4 px
overlays forces separate layers. The blurred shape is a **static soft gradient
wedge** — it should be a pre-baked PNG/WebP. Worst location on the site.

### I. FloatingActions' liquid-glass filter — every page, every frame

`app/components/GlassSurface.vue` + `FloatingActions.vue` (mounted in
`app/layouts/default.vue`). `position: fixed` with
`backdrop-filter: url(#glass-filter-…)` — a chain of 3 `feDisplacementMap` +
3 `feColorMatrix` + 2 `feBlend` + `feGaussianBlur` fed by an `feImage`. Confirmed
live: `backdrop-filter: url("#glass-filter-cb5k53qix0c") saturate(1)`.

SVG filters in `backdrop-filter` have no GPU fast path in Chrome, and a fixed
element's backdrop changes every scroll frame, so the chain re-runs on the CPU per
frame site-wide. The area is small (~7k px², 64×124) so this may be moderate rather
than dominant — but it is on every page and the fix is cheap (plain `backdrop-blur` +
`saturate`, or disable the filter while scrolling).

### J. Spline's own scroll listener forces layout every frame

Verified in the runtime: each `Application` registers
`document.addEventListener("scroll", this._onScroll)` — **not passive** — and
`_onScroll` runs `this.canvas.getBoundingClientRect()`. With Lenis driving real
scroll every frame, each live scene forces a layout flush per frame; two scenes = two,
on top of `AboutMission`'s own rect read in `syncOffset`, `SiteHeader` and
`AutoNextNews`.

Scenes with baked scroll/wheel interactions add their own `window` `scroll` / `wheel`
listeners, and **every** scene adds a `pointermove` listener that raycasts against the
scene graph (189 objects on AboutValues) on every mouse move.

### K. `beep-lifestyle.png` bypasses the image CDN

2208×2208 RGBA PNG, **1.9 MB** — the largest resource on the home page by 3.5× —
referenced with a plain `<img>` at `app/components/HomeBeep.vue:128` and `:143`, so it
skips Cloudflare Image Transformations entirely (confirmed: no `/cdn-cgi/image/`
prefix in the live resource timing). Decoded that is ~19.5 MB of bitmap.

`beep-halftone.svg` (372 KB of path soup) is likewise a plain `<img>`, rasterised at
layout size. Both should be `NuxtImg`. `features-card-{1,2,3}.png` and
`beep-pills.png` also bypass the CDN but are small.

Home page total: 4.0 MB / 133 requests, `domContentLoaded` 4.24 s.

### L. 79 elements with a CSS `filter` on the home page

Measured live, including three `blur(48.2px)` surfaces. Every `filter` creates a
compositing layer. **Caveat:** this count is inflated — BlurText's word spans sit at
their initial `filter: blur(10px)` in this environment because animations never ran;
in a real browser they clear on completion. Re-count in a real profile.

### M. Fonts (low priority)

`nuxt.config.ts` requests Geologica at 9 discrete weights (100–900). Geologica is a
variable font; if `@nuxt/fonts` materialises static instances per weight × subset
(latin, latin-ext, cyrillic, cyrillic-ext) that is up to 36 files. Only 73 KB of
woff2 actually loaded on the home page, so it appears lazy/subset in practice —
but worth confirming the variable axis is used rather than 9 static cuts.

## Suggested next step

A real-Chrome profile on `/about` and `/` — ideally on a mid Windows laptop with
integrated graphics — using the existing `FpsMeter` (already mounted in
`app/layouts/default.vue` in dev) plus DevTools Performance, captured before and
after each fix. Order to try: A → H → B → E → D → F, then C in the Spline editor.

---

# Implementation status

All of the above that is reachable from code was implemented in a single commit.
Everything is centralised in `app/utils/splineQuality.ts` so the intervention can be
tuned or reverted from one file.

| # | Measure | Status |
|---|---|---|
| A | Cap the drawing-buffer pixel ratio | **Done** — `maxPixelRatio` prop, default 1, `0.75` on the three blurred/upscaled scenes |
| B | Reclaim AboutMission's clipped pixels | **Done via A**, not by resizing the canvas — see the note below |
| C | Reduce draw calls (503 / 413 per frame) | **Not possible from code** — Spline editor work |
| D | Only one scene renders at a time | **Done** — module-level coordinator ranks scenes by intersection ratio |
| E | Frame-rate cap | **Done** — 30fps, verified: 120 rAF ticks → 60 renders |
| F | Give weak devices the static image | **Done** — `useSplineEnabled()`; reduced-motion, ≤4 cores, ≤4GB, slow/absent GPU |
| G | Multi-second `load()` stall | **Not possible from code** — needs poly/texture reduction in the editor |
| H | HomeStats' 95px blur stack | **Done** — replaced with a gradient; both masked `backdrop-blur` overlays removed |
| I | FloatingActions' liquid-glass SVG filter | **Done** — `svgFilter` prop, defaults off; plain `backdrop-blur` instead |
| J | Spline's non-passive scroll listeners | **Done** — re-registered passive; hover raycast dropped via `no-hover` |
| K | `beep-lifestyle.png` bypassing the image CDN | **Done** — now `NuxtImg` with a `sizes` ladder |
| L | 79 elements with a CSS filter | **No action** — the count was inflated by un-run BlurText spans |
| M | Nine discrete font weights | **Done** — single variable range `'100 900'` |

## Why B was not done as described

The report proposed sizing AboutMission's canvas to its visible box. That turns out to
be unsafe: resizing a Spline canvas re-frames the scene camera, which is exactly why
the box was hard-coded to 1920x1080 in the first place. The public `setSize()` is worse
still — it flips `_viewportMode` to manual and stops the frame view tracking the
viewport.

Capping the pixel ratio achieves the same saving without touching framing, so that is
what shipped.

## Verified after the change

Measured in-browser against the dev server, same harness as the research above:

* **AboutMission drawing buffer: 3840x2160 (8.29 MP) → 1440x810 (1.17 MP)** — a 7.1x
  reduction, with `_viewportMode` still `1` (framing untouched).
* `setPixelRatio()` alone left the buffer at 8.29 MP, confirming the `_resize(true)`
  force path is load-bearing. This is documented at the call site.
* Frame throttle: 120 rAF ticks → 60 renders → 30fps effective.
* Home page: no `backdrop-filter: url(...)` anywhere, zero `feDisplacementMap` /
  `feGaussianBlur` elements in the DOM, largest remaining backdrop blur is 20px
  (was 95.55px).
* SSR now emits the poster images and **zero** `<canvas>` elements, so these sections
  are complete in the first paint. No hydration mismatches.

## Still worth doing

1. **The Spline editor work (C and G).** With A–F in place this is the largest
   remaining lever: 503 and 413 draw calls per frame are CPU/driver bound and no
   amount of code changes them, and the 1.51 MB / 2.3–3.8 s `load()` stall on
   `/about` needs lower poly counts and smaller textures.
2. **A real-Chrome profile on a mid Windows laptop.** Everything above is measured
   GL/DOM work, not end-to-end frame rate; the `FpsMeter` in the default layout is
   already there for it.
3. **Re-tune the dials if the motion reads badly.** `SPLINE_MAX_FPS` first, then the
   per-scene `maxPixelRatio` values.
