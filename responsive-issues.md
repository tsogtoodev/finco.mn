# Mobile & tablet responsiveness audit

**Date:** 2026-07-26
**Commit:** `8ff9925`
**Target viewports:** mobile 375×812 / 390×844, tablet portrait 768×1024 / 820×1180
**Design origin:** 1440px

## Method

Two passes, cross-checked against each other:

1. **Live measurement** — every route rendered in the dev server at 375 and 768 in both locales (`/en` and `/mn`), instrumented in-page to report document overflow, elements escaping their clipping ancestor, computed font sizes, and touch-target boxes.
2. **Static analysis** — five parallel readers over `app/pages/**`, `app/components/**`, `app/layouts/**` and `app/assets/css/main.css`.

Findings marked **[measured]** were reproduced in the browser with numbers quoted from the live DOM. The rest are code-level findings that were not directly triggered at the two widths tested.

### Breakpoints

No `tailwind.config.*` and no `--breakpoint-*` override in the `@theme` block (`app/assets/css/main.css:7`), so stock Tailwind v4 applies: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.

Consequence: **both tablet widths (768, 820) sit in the `md` band and get the mobile drawer**, since the desktop nav is gated on `lg:`. Every `lg:` layout in the codebase is desktop-only.

### Environment note

The dev server would not boot at the start of this audit: stale npm-era `@unhead/vue@2.1.15`, `@unhead/bundler` and `unhead@3.1.4` directories were sitting at the root of `node_modules`, shadowing the correct pnpm-linked 3.2.3 and breaking the Nitro build (`"legacyPlugins" is not exported`). Fixed with a clean `rm -rf node_modules .nuxt && pnpm install`. No source files were changed. This is the same class of failure recorded previously for the npm→pnpm switch — worth a `pnpm dedupe`/CI guard.

---

## Summary

| Severity | Count | Open |
|---|---|---|
| Critical | 6 | **0 — all fixed** |
| Major | 24 | **0 — all fixed** |
| Minor | 40 | **36** — MapEmbed pin, both hover-only product card reveals, ApplicationForm file field |

**Every Critical and Major finding is now fixed** (C1–C6, M1–M28), plus a z-index defect on the error page found after the audit and three Minors. What remains is 37 Minor items — cosmetic cramping, sub-40px targets on secondary controls, and `sizes` hints — none of which lose content or break a flow. Two follow-ups were deliberately left and are flagged in place: the **1024–1280 band** in HomeBeep (still 13.6px type) and the **short-laptop edge case** in the stats sticky gate.

**Not a responsiveness issue, but the most consequential thing found in scope:** the careers application form is a stub end-to-end. `ApplicationForm.vue:76` puts `v-model` on `<input type="file">`, which Vue does not support, so the required CV never binds; and `server/api/careers/apply.post.ts` logs the payload and returns `{ ok: true }` with a `TODO(P8)` for multipart + blob storage. An applicant attaches a CV, submits, and sees a success screen while nothing is persisted. Known incomplete work rather than a regression — but it currently reads as finished to a user.

**The good news first, and it is substantial:** there is **no document-level horizontal scroll on any real page** at 375 or 768, in either locale. Every full-bleed section clips itself. Layout grids are consistently mobile-first. The mobile drawer reaches every destination including product sub-links. Layouts correctly use `dvh`/`svh`. Both carousels have real touch-drag.

The failures cluster into four recurring patterns rather than scattered one-offs:

1. **Container-query (`cqw`) stages with no floor** — sections built as a scaled 1440px canvas. Below `lg` the type shrinks with the container and becomes microscopic. (HomeBeep and HomeFincoBiz — both *fixed*.)
2. ~~**Hover-only content with no touch path**~~ — *resolved*. All four sites (ProductGrid, ProductCard, BoardMemberRow, mega-menu) now have a touch path; the shared `touch:` variant in `main.css` is the pattern to reuse for any new hover reveal.
3. **Fixed pixel geometry surviving into mobile** — hardcoded card widths, fixed section heights, desktop-sized overlays. (HomeNewsCarousel, HomeFincoBiz, AboutCeoMessage, ParticleStatus)
4. **Sub-40px touch targets**, systemic rather than local — the default `AppButton` size is 36px tall.

---

# Critical

### C1 — 404 page scrolls horizontally on mobile — ✅ **FIXED**
- **File:** [app/error.vue:23](app/error.vue:23) — `<ParticleStatus>` from `@tsogtoodev/particle-glock`
- **Viewport:** mobile 375 (any viewport < 402px + gutters)
- **Measured:** the component renders `<span style="display:inline-block;width:402px;height:200px">`. At 375 the document `scrollWidth` is **388px** — the span sits at `left:-13 → right:389` and nothing in the ancestor chain clips it. The package's `position:fixed` canvas and SVG overlay then track the widened document (388–401px wide), compounding it.
- **Problem:** the width is a hardcoded inline style from the third-party package, so no Tailwind class can override it. This is the only real page on the site with horizontal scroll, and it is the page users land on when something has already gone wrong.
- **Fix applied:** `ParticleStatus` does expose a `height` prop ("width follows the digit count"), and the package exports `statusCodeSize()` for the intrinsic ratio (`386×192` → width = height × 2.0104). `error.vue` now measures its container with a `ResizeObserver` and passes `height = min(200, availW × 192/386)`. The wrapper is `w-full overflow-hidden` so the pre-hydration render (still at the 200 default) is clipped rather than scrolling.
  A CSS `scale()` would **not** have worked: the package draws particles on a full-viewport fixed overlay positioned from the host's box, so transforming the host desyncs the particles from the mark.
- **Verified:** at 375 the host is now 344×171 and document overflow is **0** (was 402×200 / 13px). At 768 and 1440 it is unchanged at 402×200. No console errors.
- **Updated for particle-glock 0.2.0** (the package now also draws a `text` headline beneath the code): the block's width is the *wider* of the code and the headline, and the headline wins by up to 7× — `SOMETHING WENT WRONG` is 1964 grid units against the code's 274. Sizing off `statusCodeSize` alone, which is all 0.1 needed, would have re-broken this. `error.vue` now scales off `max(codeWidth, glyphTextBox(title))` and **floors** the derived cap heights, since rounding up scales the width back over budget (`ХУУДАС ОЛДСОНГҮЙ` at 375 wanted cap 21.58 — rounding to 22 pushed the block to 350px inside a 343px column). Re-verified: 320 → 286/288, 375 → 334/343, 768 → 445/664 at full size, overflow 0 throughout, in both locales.

### C2 — Contact page map renders as a 0px-tall box — ✅ **FIXED**
- **File:** [app/pages/contact.vue:44](app/pages/contact.vue:44), [app/components/MapEmbed.vue:48](app/components/MapEmbed.vue:48)
- **Viewport:** all
- **Measured:** at 375 the only thing the map region contains is a `.map-pin` div (132×168). There is no map surface at all.
- **Problem:** `MapEmbed` is called with **no `map-image` and no height class**. The root `<a>` has auto height; its only in-flow child is the `v-else` fallback `<div class="size-full">`, whose `h-full` against an auto-height parent resolves to 0. `.map-pin` is `position:absolute` so it contributes no height — and because the root is `overflow-hidden`, the pin (anchored `translate(-50%,-100%)` from `top:50%` of a zero-height box) is clipped out of existence. The `:label` prop is declared but never rendered either.
- **Fix applied**, three parts:
  1. `contact.vue` now mirrors the working `BranchExplorer` call site — passes `class="h-64 sm:h-80 lg:h-[420px]"`, the shared `map-base.jpg` raster and the `hq` pin coords, and `aria-label` (it was passing the dead `label` prop, so the link had no accessible name).
  2. `MapEmbed`'s root gained `min-h-64` so it can never silently collapse again — the failure mode was a component that vanished entirely rather than degrading.
  3. The pin is now `width: clamp(72px, 28%, 132px)` with `aspect-ratio: 132/168` instead of a fixed 132×168. At the mobile height chosen above, the tip-anchored fixed pin reached 30px above the map and had its head cut off by `overflow-hidden`. This also resolves the MapEmbed pin item under Minor.
- **Verified:** map is 343×256 at 375 with the raster loaded and the pin fully inside (top +33, bottom +138, not clipped); document overflow 0. Branches at 1440 is **pixel-identical** to before (pin back to exactly 132×168) — 28% reaches the cap by ~470px.
- **Still open (pre-existing, unchanged):** on `/branches` at tablet 768 the map is 736px wide so the pin hits its 132px cap, and the `y: 0.4` branch's tip sits at 128px — the head still clips by ~40px. Fixing that needs the pin height bounded by the space above the tip, which is a JS calc rather than a CSS clamp.

### C3 + C4 — HomeBeep text at 3.6–4.5px and buttons at 38×11px — ✅ **FIXED**
- **File:** [app/components/HomeBeep.vue](app/components/HomeBeep.vue) — new `@media (max-width: 1023.98px)` block
- **Viewport:** mobile *and* tablet
- **Was, measured at 375:** `.beep-card` 327×**160**px; `.beep-title` **4.5px**, `.beep-subtext` **3.6px**, `.beep-bar-text` **4.1px**, `.beep-btn` **38×11px**. At 768: ~10px / 8px / 9px.
- **Problem:** `.beep-card` is `aspect-ratio: 1440/704; container-type: inline-size` and every size inside is a `cqw` fraction of the card's own width, with no floor and no breakpoint. These were one defect, not two: the aspect lock capped the card at 160px tall, so no amount of type tuning alone could fit legible copy — the stage itself had to go on small screens.
- **Fix applied:** below `lg` the card stops being a fixed-aspect coordinate stage and becomes an ordinary stacked flow — `aspect-ratio: auto`, `.beep-clip` goes `relative` + column flex, and `order` gives heading → wordmark → photo → info bar. Type moves to rem, buttons get `min-height: 2.75rem`, and the `gap: 16.6667cqw` (240px at 1440) becomes `1rem`.
  - The three layers whose geometry only means something on the stage are dropped: the head-bleed photo copy, the halftone (its `rotate`/`hypot` math needs `container-type: size` with a definite height) and the bottom fade (it existed to blend the docked bar, now in flow).
  - The photo becomes a 220px banner with `object-position: 50% 12%` to keep the face in frame.
  - The bar is forced visible — the `@media (hover: hover)` reveal would otherwise leave it `translateY(93.81%)` and transparent on a narrow hover-capable window.
  - Two things the measurements caught: the pills raster is absolutely positioned, so it painted *above* the now-in-flow copy until given `z-index: 0` (and dropped to `opacity: .22`, since its own pill labels competed with the heading); and the wordmark needed an explicit height, because a replaced flex item with `height: auto` falls back to the source's intrinsic 150px rather than the aspect-derived one.
- **Verified at 375 (mn):** title **22px**, subtext **15px**, bar text **15px**, buttons **154×45** and **155×44**, bar opacity 1, card 327×810, document overflow 0. At 768: same type, card 720×616. English locale equivalent (buttons 185×45 / 143×44). No console errors.
- **Desktop unchanged:** at 1440 the card keeps its 2.045 aspect ratio, `.beep-clip` is still `absolute`, and the halftone, fade, absolute wordmark and bleed photo all still render.
- **Still open — the 1024–1280 band.** At exactly 1024 the stage resumes with a 976px card, so the title is **13.6px**, the subtext **10.8px** and the buttons **108×29**. Far better than 4.5px, but still under a sane minimum. Closing it properly means either a font-size floor (risky — the title is `nowrap` at a `%` offset and would start colliding with the pills raster) or extending the stacked layout to `xl`, which would give 13" laptops a mobile-style card and is a design call rather than a tweak. Flagged for a decision.

### C5 + C6 — Stats panel taller than the viewport, with 320px of dead black — ✅ **FIXED**
- **File:** [app/pages/index.vue:19](app/pages/index.vue:19), [app/components/HomeStats.vue](app/components/HomeStats.vue)
- **Viewport:** mobile 375 / 390
- **Was, measured at 375×812:** sticky wrapper **934px tall against an 812px viewport**.
- **Problem:** one root cause, two symptoms. `mt-80` (320px) is unconditional — it exists to clear the Spline wave, but the Spline wrapper is `hidden … sm:block` and the mobile fallback poster was **commented out**. So phones got a heading, 320px of flat `#0a0a1a`, then the numbers (C6) — and that dead space is exactly what pushed the section past the viewport. Combined with `motion-safe:sticky top-0`, a sticky box taller than the viewport pins its *top* and never scrolls its own bottom into view, while `HomeProducts` (`z-10`) slides over it, so the third stat was unreachable (C5).
  The file's own header comment documents the intended behaviour — "a static poster image on mobile … they keep the lightweight stats-wave.png poster" — so the commented-out poster was the anomaly, not the design.
- **Fix applied:** re-enabled the mobile poster, scaled the spacer to `mt-24 sm:mt-80`, and gated the pin to `lg:motion-safe:sticky lg:motion-safe:top-0`. Both changes are needed: the spacer alone still leaves the section too tall for a 375×667 phone, and the sticky reveal is a desktop flourish that adds nothing on a phone.
- **Verified at 375:** wrapper `static`, section **710px** (fits the 812 viewport), spacer 96px, poster loaded and displayed, all three stats visible in one screen. At 768: `static`, 577px, spacer back to 320px, 3 columns. At 1440: `sticky` / `top: 0` preserved, 733px, spacer 320px, poster `display: none`. No console errors, no overflow.
- **Note:** the `lg` gate leaves one edge case — a short laptop window (e.g. 1024×600) would again have a sticky box taller than the viewport. Guarding that properly needs a height-aware media query rather than a width breakpoint.

### Error page — mega menu rendered behind the particle overlay — ✅ **FIXED**
- **File:** [app/error.vue](app/error.vue)
- **Viewport:** all (desktop, where the mega menu exists)
- **Problem:** `@tsogtoodev/particle-glock` draws on a full-viewport `position: fixed` canvas appended to `<body>`, and defaults it to **`z-index: 2147483000`** — above the sticky header (`z-50`), so the nav's mega-menu panel painted *underneath* it. Because the canvas is `pointer-events: none` this was a paint-order bug only; clicks always reached the menu.
- **Fix applied:** `ParticleStatus` exposes a `zIndex` prop, now set to **20** — above the page content, below every piece of site chrome (AutoNextNews 40 · header/FAB 50 · Beep QR popover 70 · AppDialog 100).
- **Verified, three ways:**
  1. Canvas computed `z-index: 20`; no ancestor between `<header>` and the root creates a stacking context (all `position: static`, `z-index: auto`, no transform/filter/opacity/isolation), so the header's `z-50` competes directly with the canvas in the root stacking context and wins.
  2. The mega panel opens at 1248×504 spanning y 96–600, overlapping the particle host at y 182–382.
  3. **Occlusion confirmed at the pixel level:** on a load where the particles did assemble, the canvas holds **112,684 painted pixels inside the header's own band** (y 40–90) while the header still renders as clean white over them — the particle cloud's top edge is cut exactly at the header's bottom border. Those are the same pixels that previously painted over the nav.

---

# Major

## Navigation & global chrome

### M1 — Mega-menu is clipped rather than reflowed at 1024–1230px — ✅ **FIXED**
- **File:** [app/components/SiteHeader.vue:407](app/components/SiteHeader.vue:407), [app/components/NavMegaMenu.vue:39](app/components/NavMegaMenu.vue:39)
- **Viewport:** iPad Pro 12.9" portrait is exactly 1024, where `lg:` flips on
- **Problem:** the business menu's natural width is ~1197px. `measureMega()` (`SiteHeader.vue:155`) pins the width to the `w-max` inner element's `offsetWidth`, then the frame caps it with `max-w-[calc(100vw-2rem)] overflow-hidden`. Because the inner keeps `w-max`, the columns never reflow — the frame just crops ~200px off the right, hiding the entire second column of product links. The comment at `NavMegaMenu.vue:42` claims `min-w-0` lets columns shrink; the `w-max` parent defeats it.
- **Fix applied:** the inner is now `w-max max-w-full`, so it keeps its natural width while the frame tweens (which is what `w-max` was for) but reflows once the viewport is the binding constraint — the columns already carry `min-w-0`. The measurement clamps to `min(natural, innerWidth - 32)`, and a resize listener re-measures while the panel is open so a pinned px width can't go stale.
  The measurement itself needed care: with `max-w-full` in place, reading `offsetWidth` on an Иргэнд → Бизнесд switch would have measured the *previous* menu's pinned frame width, so the panel could never grow. It now lifts the cap, reads the natural width, and restores it — all inside one task, so nothing paints in between and the size tween is preserved.

### M2 — Mega-menu is hover-only; tapping the trigger navigates away — ✅ **FIXED**
- **File:** [app/components/SiteHeader.vue:345](app/components/SiteHeader.vue:345)
- **Viewport:** any touch device ≥1024px
- **Problem:** the triggers open only via `@mouseenter` and `@keydown.down`. There is no click/touch path, and the element is a `<NuxtLink>` — so a tap routes straight to `/products` or `/business` and the panel never opens. Below 1024 the drawer covers this, so it is strictly a `lg`-and-up touch problem.
- **Fix applied:** an `@click.capture` handler on the trigger — on a non-hover pointer the first tap opens the panel instead of navigating, and a second tap on the same trigger follows the link. `.capture` is load-bearing: vue-router's own click handler bails when the event is already `defaultPrevented`, but only if we get there first; a bubble-phase listener races with RouterLink's and navigates anyway.
- **Verified** by stubbing `matchMedia` to report a non-hover pointer: first tap stayed on `/en/about` with the panel open (`aria-expanded="true"`), second tap navigated to `/en/products`. With a real hover-capable pointer the handler no-ops and the link navigates normally (`/en/about` → `/en/products`), so desktop is unchanged. Tap-outside-to-close is already handled by the existing `lg:block` scrim.

### M3 — Mobile drawer's last 36px are unreachable when the announcement bar is present — ✅ **FIXED**
- **File:** [app/components/SiteHeader.vue:441](app/components/SiteHeader.vue:441)
- **Viewport:** mobile 375 / tablet 768
- **Problem:** the drawer's scroll container is `max-h-[calc(100dvh-60px)]`, but it is anchored at `top-full` of a header that is **96px** tall while the announcement bar is up (36 + 60). The panel therefore ends at `100dvh + 36`. Because the header is `sticky top-0`, page scrolling cannot bring the remainder into view. With both accordions expanded the last link is unreachable.
- **Fix applied:** `max-h-[calc(100dvh-60px-var(--announcement-h,0px))]`. **Verified:** at 375×812 the panel's max-height is now 716px (was 752) so it ends exactly at the fold instead of 36px past it; at 375×667 it is 571px. The `,0px` fallback keeps it correct once the bar is dismissed and the variable eases to 0.

### M4 — Mobile drawer has no body-scroll lock and no tap-outside scrim — ✅ **FIXED**
- **File:** [app/components/SiteHeader.vue:229](app/components/SiteHeader.vue:229), `:435`
- **Viewport:** mobile 375 / tablet 768
- **Problem:** `mobileOpen` only toggles classes. Unlike `AppDialog`, nothing locks body overflow, and the mega-menu scrim at `:294` is `hidden … lg:block` (desktop-only). Scrolling while the drawer is open scrolls the content behind an opaque panel, and the only exit is the small ✕.
- **Fix applied:** a `lg:hidden` scrim at `z-30` with `@click="mobileOpen = false"` (the panel gained `z-40` — without an explicit z the positioned scrim would paint *over* it), plus a body scroll lock.
  The lock is **reference-counted** (`app/composables/useScrollLock.ts`) rather than a plain `overflow = 'hidden'` / `''` pair, because AppDialog also locks and the two can be open at once via the FAB — whichever closed first would otherwise unlock the page behind the other. AppDialog was migrated onto the same counter.
- **Verified:** opening the drawer sets `body.overflow: hidden`; tapping the scrim closes it and unlocks. The interaction was checked explicitly — drawer open → dialog open → **dialog closed (still locked)** → drawer closed (unlocked). Desktop unaffected: scrim not rendered, panel `display: none`, mega menu still opens at 1248×504.

### M5 — Announcement bar dismiss is a 24×24 target — ✅ **FIXED**
- **File:** [app/components/AnnouncementBar.vue:73](app/components/AnnouncementBar.vue:73)
- **Viewport:** both
- **Measured:** 24×24px on every page scanned.
- **Problem:** `size-6`. This is the only way to reclaim the 36px strip, and it is the smallest control in the global chrome.
- **Fix applied:** `size-10 -mr-2` around the unchanged `size-6` glyph — the negative margin keeps it on its original optical position. **Verified:** 40×40 at 375, right edge 367 inside a 375 viewport.

## Dialogs

### M6 — `max-h-[90vh]` overflows the visible viewport on mobile browsers — ✅ **FIXED**
- **File:** [app/components/AppDialog.vue:87](app/components/AppDialog.vue:87)
- **Viewport:** mobile 375×667
- **Problem:** on iOS/Android `vh` resolves to the *large* viewport. On a 375×667 iPhone SE the small viewport is ~667px while `100vh` is ~748px, so `90vh` ≈ 673px — taller than what is visible. The bottom of the card (in `FeedbackDialog`, the submit button) sits under the browser chrome. Everything else in the codebase already uses `svh`/`dvh`.
- **Fix applied:** `max-h-[90dvh]`. **Verified:** resolves to 730.8px at a 812px viewport — exactly 90% of the *small* viewport, where `90vh` would have exceeded it on a phone.

### M7 — Dialog close button scrolls out of view with the content — ✅ **FIXED**
- **File:** [app/components/AppDialog.vue:87](app/components/AppDialog.vue:87), `:91`
- **Viewport:** mobile 375 / tablet 768
- **Problem:** the card is both `overflow-y-auto` and `relative`, and the ✕ is `absolute right-4 top-4` **inside** that scroll container. Once the body scrolls — guaranteed with FeedbackDialog's 5-field form on mobile — the close button is gone. Esc is unavailable on touch, leaving only a backdrop tap, which is an undiscoverable affordance.
- **Fix applied:** the card is now a `flex flex-col` that does **not** scroll; only an inner `min-h-0 flex-1 overflow-y-auto` wrapper around the slot does, so the ✕ stays absolute against the non-scrolling card. `min-h-0` is load-bearing — a flex child defaults to `min-height: auto` and refuses to shrink below its content, so without it the scroller never engages and the card grows past `max-h`.
- **Verified** at 375×667 with the loan calculator, where the body genuinely overflows (588px of content in a 488px scroller): scrolled to the bottom, the ✕ stays at `top: 61` — unmoved. Card bottom 622 inside a 667 viewport.

### M8 — Loan calculator result rows overflow at 375 and again at 640–800 — ✅ **FIXED**
- **File:** [app/components/LoanCalculatorDialog.vue:48](app/components/LoanCalculatorDialog.vue:48)
- **Viewport:** both
- **Problem:** each row is `flex justify-between gap-4 … p-6` with no `min-w-0`. Nested padding (`AppDialog p-4` → card `p-6` → tray `p-6` → row `p-6`) leaves ≈199px of interior at 375. `AppNumberFlow` renders a fixed-width `tabular-nums` digit strip that cannot shrink or wrap; the input accepts up to 1,000,000,000₮. Because the card is `overflow-y-auto`, `overflow-x` computes to `auto` — so it becomes a horizontal scrollbar inside the modal. `sm:flex-row` puts the two rows side by side from 640px, halving the space and reproducing the same overflow at 640–800.
- **Fix applied:** the result cards stack label-above-value until **`lg`**, not `sm:` — the tray itself splits side-by-side at `sm`, so a row layout inside the card overflowed twice (once at 375, again at 640–800 once each card lost half its width). Added `min-w-0` throughout, dropped the value to `text-lg` below `sm`, and reduced the nested `p-6 p-6` to `p-4 sm:p-6`. `AppNumberFlow` renders a fixed-width tabular digit strip that can neither wrap nor shrink, so the room has to come from the layout.
- **Verified at 375** with the worst case the inputs allow (₮1,000,000,000 at 5% over 360 months): rows 252px wide, label 106 + value 149 both inside, no child escaping, no horizontal scroll in the dialog. **At 700:** `bodyOverflowPx: 0`. **At 1024 and 1440:** result rows back to label-beside-value, still 0.

### M9 — Loan-term steppers are 24×24, and the term cannot be typed — ✅ **FIXED**
- **File:** [app/components/NumberStepper.vue:34](app/components/NumberStepper.vue:34), used at [app/components/LoanCalculatorDialog.vue:41](app/components/LoanCalculatorDialog.vue:41)
- **Viewport:** both
- **Problem:** each chip is `p-1` around a `size-4` icon = 24×24px, and they are the *only* control for the term — the value is a plain `<span>`, not an input. Going from the default 3 months to 24 is 21 taps on a 24px target. The max is 360.
- **Fix applied:** the chips are `size-11` (44×44, `offsetWidth` confirmed) around the unchanged `size-4` glyph, and the value is now a real `<input type="number" inputmode="numeric">` with min/max/step, clamp-on-input and a resync on blur — so the 360-month maximum is one typed entry instead of 357 taps. Field padding dropped to `p-1.5 pl-4` so the taller chips keep the field near `AppInput`'s height (56 vs 52).
- **Regression I introduced and then fixed:** 44px chips raise the stepper's min-content width, and at 640–1023 all three input fields were already sitting on their min-content floors — the row overflowed its container by ~35px. The field row is now `lg:flex-row` (stacked below), which clears every floor; at `lg` the dialog is at its 840px cap and each field gets 227px.
- **Measurement note:** `getBoundingClientRect()` reads 4% small inside this dialog — the `.t-modal` enter transition strands at `scale(0.96)` under the preview pane's paused rAF. `offsetWidth` is the trustworthy metric here and reports the true 44×44.

## Home page

### M10 — News carousel cards are a hardcoded 408px; ~57px of every card is clipped — ✅ **FIXED**
- **File:** [app/components/HomeNewsCarousel.vue:13](app/components/HomeNewsCarousel.vue:13) (`CARD_W = 408`), applied at `:276`
- **Viewport:** mobile 375 / 390
- **Measured at 375:** card wrapper, image, body and `h3` all measure exactly 408px inside a 375px `overflow-hidden` root.
- **Problem:** `--carousel-edge` collapses to 24px on mobile, so the active card runs x = 24 → 432. Every card loses ~57px off its right edge permanently — the image is cropped and the `line-clamp-3` excerpt is cut mid-word. Unlike the products carousel there is no size ramp, so it never self-corrects.
- **Fix applied:** `CARD_W` became a `cardW` computed derived from the already-tracked `rootW` — `min(408, rootW - edgePad - 24)`, with the 24px floor keeping a sliver of the next card visible so the track still reads as scrollable. The travel math (`rightExtent`, `trackOffset`, the drag `step()`, `overflowsLeft`) all derives from it, so one reactive value flows through. Card **height** stays fixed at 420: the title is `truncate` and the excerpt `line-clamp-3`, so the text block is the same height at any width and nothing reflows. `NewsCard`'s `sizes="408px"` hint became `90vw sm:408px`, since the change made the old hint actively wrong on mobile.
- **Verified at 375:** card is 327×420 running x = 24 → 351 inside a 375 viewport — **0px clipped** (was ~57px) with a 24px peek. Document overflow 0.

### M11 — HomeFeatures has zero horizontal gutter below 1024px — ✅ **FIXED**
- **File:** [app/components/HomeFeatures.vue:32](app/components/HomeFeatures.vue:32) — `px-0 lg:px-6`
- **Viewport:** mobile 375 / 390, tablet 768 / 820
- **Problem:** mobile-first inverted. The `<section>` adds no padding either, so the heading and all three bento cards sit flush against the viewport edges from 320px to 1023px. Every other home section uses `px-6` unconditionally (`HomeProducts.vue:67`, `HomeNews.vue:37`, `HomeBeep.vue:120`, `HomeFincoBiz.vue:76`), which makes this look accidental rather than a deliberate full-bleed.
- **Fix applied:** `px-6` unconditionally. **Verified:** computed padding 24px both sides at 375, content spanning 24→351; desktop unchanged (it already had `px-6` from `lg`).

### M12 — HomeFincoBiz: fixed 450px card with an illegible baked-raster caption — ✅ **FIXED**
- **File:** [app/components/HomeFincoBiz.vue:101](app/components/HomeFincoBiz.vue:101) (`h-[450px]`), `:123`, `:132` (`hidden lg:block`)
- **Viewport:** mobile 375 / 390, tablet 768 / 820
- **Problem:** two coupled issues. (1) `h-[450px]` never scales — at 375 the container is 327px so the mockup renders 327×150px, leaving ~260px of blank white inside the card (~119px at 768). (2) The crisp, translatable callout is `hidden lg:block`, so below 1024 the only visible copy is the text **baked into the 2872px-wide raster** at ~11% scale on mobile — illegible, and untranslated.
- **Fix applied**, both halves:
  - **`h-auto lg:h-[450px]`.** The 450px is a desktop *crop* height — up there the mockup renders 530px tall and is deliberately clipped by the card. At a 327px container the same image is only ~150px tall, so the fixed height left ~256px of blank white. The two skeleton cards are `absolute inset-0` with `flex-1` bodies, so they follow whatever height the front card takes.
  - **Live callout in flow below `lg`.** The desktop callout is absolutely positioned in % against the mockup's baked text and masked with white rectangles — that only works while the raster is large enough to read. Below `lg` the same `calloutHeading` / `calloutSubtext` now render as a normal padded text block under the image, so the copy is legible *and* translated (the live strings come from the `pages` home doc; the raster is baked Mongolian artwork). `sizes="1200px"` also became `100vw lg:1200px`.
- **Verified at 375:** card 327×343 — header 45 + image 150 + callout 148, **0px unaccounted** (was ~256px of blank white). Mobile callout `display: block` with the live copy; desktop overlay `display: none`.
- **Verified at 1440:** unchanged — card exactly 450px, image 530px clipped by the card as designed, overlay `display: block` with its 28px heading, mobile block `display: none`.
- **Not visually confirmed:** the preview pane's stacking and stranded MotionReveal defeated every attempt to screenshot the deck, so this rests on measurements. Worth one look on a real phone.

### M13 — HomeContactCta 3D scene overlaps the text column by ~490px at tablet — ✅ **FIXED**
- **File:** [app/components/HomeContactCta.vue:15](app/components/HomeContactCta.vue:15)
- **Viewport:** tablet 768 / 820
- **Problem:** the scene wrapper turns on at `md` at `w-[80%]`. At 768 that is 614px anchored right (x = 154 → 768), while the text column occupies x = 24 → 644. The blend scrim is only fully opaque to 38% and fully transparent by 72%, so the artwork renders directly behind the heading and CTA across the 292–644px band. There is no `lg:` reduction.
- **Fix applied:** the scene is gated to `lg:block` instead of `md:block`. Narrowing it at `md` would not have been enough: the blend scrim is a gradient across the *section* width (opaque to 38%, clear by 72%), so how much artwork shows through the copy depends on the scene-to-section ratio — at 768 the scrim starts fading at 292px while the text column runs to 644px. Tablet is not a designed breakpoint here (Figma is 1440), so it gets the clean dark panel.
- **Verified at 768:** scene `display: none`, heading spans x 24→530, **0px overlap** (was ~490). At 1440 unchanged: scene `display: block`, laid out 1040×350 at x 400→1440.

### M14 — HomeContactCta subtext is larger on mobile than desktop, with leading equal to font-size — ✅ **FIXED**
- **File:** [app/components/HomeContactCta.vue:46](app/components/HomeContactCta.vue:46)
- **Viewport:** mobile 375 / 390
- **Problem:** `text-xl … leading-[20px] … sm:text-[16px]` — base is 20px with a 20px line-height, and `sm:` makes it *smaller* on larger screens while the leading stays. The Mongolian string wraps to ~4 lines at 327px, so Cyrillic ascenders and descenders collide between lines.
- **Fix applied:** `text-base leading-6 sm:text-[16px] sm:leading-[20px]`. **Verified:** 16px/24px at 375 (was 20px type on a 20px leading).

### M15 — Spline runtime (~1MB) is prefetched on mobile for scenes that are `hidden` — ✅ **FIXED**
- **File:** [app/components/SplineScene.vue:275](app/components/SplineScene.vue:275), triggered from `HomeContactCta.vue:18` and `HomeStats.vue:37`
- **Viewport:** mobile 375 / 390
- **Problem:** `<ClientOnly>` mounts `SplineScene` regardless of the CSS `hidden` on the wrapper. `inView()` correctly returns false so nothing renders — but `schedulePrefetch()` still runs on idle and pulls both `@splinetool/runtime` and the `.splinecode` into cache. On phones that is two scenes' worth of bytes that can never be displayed, on the most bandwidth-constrained devices. The `scroll`/`resize` listeners for these hidden instances are also never torn down.
- **Fix applied:** guarded inside `SplineScene`'s own `warm()` rather than at each call site, so every hidden instance is covered at once — present and future. The check is `canvas.getBoundingClientRect().width === 0`, evaluated at the idle callback so it reflects settled layout: zero width means "not laid out" (a CSS-hidden wrapper), while a scene merely below the fold still has width, so genuine ahead-of-scroll prefetch is untouched.
- **Verified at 375:** **0 network requests matching `spline`** on the home page (was the runtime plus two scenes). Both `SplineScene` canvases still mount but measure 0×0, so the guard bails. At 1440 the guard passes (`guardWouldPass: [true, true]` with canvases at 1728 and 1040 wide).
- **Caveat:** the fetch itself could not be observed at 1440 — Spline never initialises in the preview pane at any width (canvas backing stores stay at the default 300×150, `visibilityState` is `hidden` and rAF is paused). What is verified is the guard's *decision*, which is correct in both directions; it is provably not what suppresses the desktop request.

## About page

### M16 + M17 + M18 — AboutMission: pin at every width, art behind the headline, 1920×1080 canvas on phones — ✅ **FIXED**
- **File:** [app/components/AboutMission.vue:128](app/components/AboutMission.vue:128), `:133`
- **Viewport:** mobile 375 / 390
- **Problem:** `enabled` is gated only on `prefers-reduced-motion` (`:95`), never on a breakpoint. The copy window is `100vh − 192px` of padding, and `100vh`/`h-screen` resolve to the *large* viewport on mobile — so with browser chrome visible the actual window is ~460px at 375×667. Block 1 fits today at ~334px, but the column is `overflow-hidden` and driven by `transform`, so any CMS copy that grows past the window is **silently cut off with no scroll escape**.
- **Fix applied**, one change resolving all three:
  - **Pin gated to `lg`** via `matchMedia('(min-width: 1024px)')`, combined with the existing reduced-motion check and kept reactive via a `change` listener. Below `lg` the component falls back to the static stacked flow it already renders for reduced-motion — no JS, nothing clipped. `measure()` and `onScroll()` now early-return when the pin is off, so the resize listener stops forcing layout reads for nothing.
  - **Spline slot `v-if="isDesktop"`** rather than `hidden lg:block`. CSS-hiding still mounts `SplineScene`, which prefetches the runtime and scene on idle even when it never renders (the same trap as M15) — hiding alone would have fixed the paint cost but not the download.
- **Verified at 375×667:** pin off (no inline track height, stage `static`, no transform, column `overflow: visible`), both blocks fully rendered at opacity 1 (362px + 268px) with nothing clipped, Spline slot absent, **0 canvases**, and **0 network requests matching `spline`** — the ~1MB runtime and the scene are genuinely not fetched on a phone.
- **Verified at 768:** pin off, 0 canvases, both blocks visible, no overflow.
- **Verified at 1440:** unchanged — track `height: calc(914px + 100vh)`, stage `sticky`, column `overflow: hidden`, 70vh block gap, Spline slot present at 1143×643.

### M17 — AboutMission Spline art is positioned in viewport-% and lands behind the headline — ✅ **FIXED** (see M16)
- **File:** [app/components/AboutMission.vue:192](app/components/AboutMission.vue:192)
- **Viewport:** mobile 375 / 390
- **Problem:** the slot is `left-[42.297%] top-[min(8.894vw,171px)] w-[min(79.373vw,1524px)]` — percentages of the **viewport**, not of the 1920 design frame. At 390 that places the art at x 165→390, y 35→209, directly behind block 1's badge and heading (y ≈ 96→266). Only `-z-10` stops it covering the text, leaving white-on-near-black over a saturated bright raster.
- **Fix applied:** the slot is no longer rendered below `lg` — see M16 above.

### M18 — AboutMission ships a 1920×1080 WebGL canvas to phones — ✅ **FIXED** (see M16)
- **File:** [app/components/AboutMission.vue:193](app/components/AboutMission.vue:193)
- **Viewport:** mobile 375 / 390, tablet
- **Problem:** `h-[1080px] w-[1920px]` with a CSS `scale()` is deliberate (the Spline camera crops on canvas resize), but the drawing buffer stays 1920×1080 × DPR. On a DPR-3 phone that is ~18.7M pixels per frame to paint a 309×174 decoration. Unlike `AboutValues`' Spline — which sits inside `hidden lg:block` and is skipped by `SplineScene`'s `r.width > 0` check — this one has no gate and *will* render on mobile.
- **Fix applied:** `v-if` on the slot, which also avoids the prefetch a CSS `hidden` would have left in place — see M16 above.

### M19 — AboutValues squeezes three cards into ~229px columns at tablet — ✅ **FIXED**
- **File:** [app/components/AboutValues.vue:88](app/components/AboutValues.vue:88), `:92`
- **Viewport:** tablet 768 / 820
- **Problem:** at 768 the container is 736px; `grid-cols-6 gap-6` gives ~103px columns, so the three `col-span-2` cards in row 2 are ~229px wide and `p-8` leaves **165px of text column** for a 20px title plus 16px body. `Ухаалаг шийдэл, бүтээлч сэтгэлгээ` runs to ~5 lines.
- **Fix applied:** deleted the tablet-only static `grid-cols-6` variant entirely and extended the interactive mobile cards to two columns (`grid-cols-1 md:grid-cols-2 lg:hidden`, `p-4 md:p-6`). That also resolves the related Minor below — tablet was the only one of the three viewport variants with no selection state, so the section's "pick a value" affordance vanished between 768 and 1023 — and removes a third copy of the same content.
- **Verified at 768:** two 356px columns with 24px padding, giving a **308px text column** (was ~165px inside a ~229px card). All five cards are `<button>`s and clicking the second sets it active. Desktop unaffected: the tablet grid is `display: none` at 1440 and the `lg` spine variant still renders its five cards at their original 16px padding.

### M20 — CEO letter collapses into a ~230px nested scroll box — ✅ **FIXED**
- **File:** [app/components/AboutCeoMessage.vue:83](app/components/AboutCeoMessage.vue:83), `:96`
- **Viewport:** both (mobile worst)
- **Problem:** the card height is pinned by `aspect-[210/272]` and the body is a flex child with `overflow-y-auto` — which sets its automatic minimum size to 0, so it is the only thing that shrinks. At 375 the card is 343×444; after padding, title, tagline and the 48px signature row, roughly **230px** remains for ~1370 characters that need ~1100px. The result is ~5 screens of text inside a 230px inner scroller nested inside page scroll, with no visible scroll affordance — the hardest possible gesture on touch. Tablet has the same failure mode.
- **Fix applied:** `lg:aspect-[210/272]` and `lg:overflow-y-auto` — the letter-sheet ratio and its inner scroller are now desktop-only, so below `lg` the card grows to its content. With the ratio pinning the height, the body was the only flex child that could give (its `overflow-y-auto` sets `min-height: 0`), which is why ~1370 characters collapsed into a ~230px scroller nested inside page scroll.
- **Verified at 375:** `aspect-ratio: auto`, card 343×1088, body `overflow-y: visible` with `scrollHeight === clientHeight` — **no nested scroller**, the letter simply reads in page flow. At 1440 unchanged: aspect back to `210 / 272`, body `overflow-y: auto`, card 764px.

### M21 — Board member career histories are hover-only and unreachable on touch — ✅ **FIXED**
- **File:** [app/components/BoardMemberRow.vue:29](app/components/BoardMemberRow.vue:29)
- **Viewport:** both
- **Problem:** all six board members in `content/pages/mn/about.yml` carry a six-line `bioHover` career history, rendered as an absolutely-positioned `opacity-0` sibling revealed solely by `group-hover/bio:opacity-100`. There is no click, tap or focus path. On touch the content is in the DOM — and read by screen readers, since it has no `aria-hidden` — but permanently invisible. The container is a plain `<div>` with no handler, so iOS' tap-to-hover heuristic does not apply.
- **Fix applied:** the cross-fade moved from `group-hover:` utilities into scoped CSS so the two states can be scoped to pointer capability explicitly. Hover devices keep the designed cross-fade under `@media (hover: hover)`; under `@media (hover: none)` the timeline drops out of absolute positioning into normal flow beneath the bio, so both simply read with no interaction required.
  Chose this over a tap-to-toggle button: it needs no new control or ARIA surface, and guarding on pointer capability rather than width also avoids iOS' sticky `:hover`-on-tap fading the bio out *underneath* the revealed timeline.
- **Verified** at 375: each bio column grows 96px → 348px with the 240px timeline below it, no overlap, across all 6 members. That adds roughly 1500px to the About page on touch — the deliberate trade for content that was previously unreachable. Generated CSS confirmed to contain the hover, touch and `prefers-reduced-motion` branches.

## Products & services

### M22 — Product detail stat boxes overflow and overlap in the 3-column grid — ✅ **FIXED**
- **File:** [app/components/ProductDetailHero.vue:120](app/components/ProductDetailHero.vue:120), `:126`
- **Viewport:** tablet 768 (worst 640–760)
- **Affects:** all 14 product slugs — **[measured]** every one of them renders the identical 343px `whitespace-nowrap` stat row.
- **Problem:** the grid flips to `sm:grid-cols-3` at 640px, but each box carries `whitespace-nowrap` with a 20px `dt` and a 24px bold `dd`. At 640px each track is ~181px with ~157px of interior, while the nowrap value needs ~185–210px. The text cannot wrap, so it spills: the middle box overlaps its neighbours and the outer boxes are clipped by the section's `overflow-hidden`. Still tight at 768 (~200px vs ~185px) with no headroom for longer CMS values. **[measured]** at 375 and 820 the row fits — this is specifically a 640–768 band failure, not a phone one.
- **Fix applied:** dropped `whitespace-nowrap`, moved the 3-column switch from `sm:` to `md:`, added `min-w-0 text-balance text-center`, and stepped the type down below `lg` (`dt` 18px, `dd` 20px).
- **Verified at 700** (inside the old 640–760 failure band): single column, `white-space: normal`, no text escaping its box. **At 768:** three 224px columns, no overlap, widest value 166px inside a 200px interior, no overflow. Applies to all 14 product slugs, which share this template.

### M23 — DetailTabs sliding underline is mis-positioned because tabs are not equal width — ✅ **FIXED**
- **File:** [app/components/DetailTabs.vue:51](app/components/DetailTabs.vue:51) vs `:41`
- **Viewport:** mobile 375 / 390
- **Problem:** the indicator hard-codes `width: 100/available.length %` and `translateX(activeIndex * 100%)`, which is only correct if the tabs are exactly equal width. `flex-1` is `flex: 1 1 0%` with default `min-width: auto`, so a tab can never shrink below its longest word. In a 343px column the three Mongolian labels get ~132 / 105 / 105px while the indicator renders 114px wide at offsets 0/114/229 — off by up to ~18px, sitting under the wrong tab's edge.
- **Fix applied:** `min-w-0` on the tabs, keeping the CSS-only indicator rather than porting `TabPills`' measurement. `flex-1` is `flex: 1 1 0%` but `min-width: auto` floored each tab at its longest word, so the three Mongolian labels rendered ~132/105/105 while the indicator drew equal 114px slots. Removing the floor makes them genuinely equal, which is the assumption the `100/n %` + `translateX(i * 100%)` math already made.
- **Verified at 1024** on a product with all three tabs: widths exactly **330.7 / 330.7 / 330.7**, indicator aligned to the active tab. Clicking the third sets `width: 33.3333%; transform: translateX(200%)` — correct; the rendered position lags only because the 300ms transition cannot progress with rAF paused in the preview pane.

### M24 — Related-products carousel arrows and blur peeks sit on top of the active card below 1280px — ✅ **FIXED**
- **File:** [app/components/RelatedProductsCarousel.vue:37](app/components/RelatedProductsCarousel.vue:37), consumed by `HomeProductsCarousel.vue:281,302,319`
- **Viewport:** tablet 768 / 820
- **Problem:** `--carousel-edge: max(1rem, calc((100vw - 1280px)/2 + 1rem))` collapses to a flat 16px under 1280px, so the active card starts at x=16. The 120px `backdrop-blur-[6px]` peeks and the frosted arrows at `left-[38px]`/`right-[38px]` (both `md:block`) are positioned for the 1440 layout where the edge is ~96px and they sit in the gutter. At 768 they land on the card: ~104px of it is blurred, and the `pointer-events-auto` arrow covers the card's left region — so a tap there steps the carousel instead of opening the product.
- **Fix applied:** gated on the **measured** gutter (`edgePad`, which the carousel already tracks) rather than a breakpoint — each consumer sets its own `--carousel-edge`, so no single breakpoint is right for both. Arrows need `56 + 44 = 100px`, peeks need their 120px width; below that they are not rendered. Drag and the 44px footer arrows still drive the carousel.
- **Verified at 1024** on a product page (edge collapses to its 16px floor): peeks and arrows both `display: none`, **0 elements overlapping the active card** — previously ~104px of it sat under a blur with the arrow's hit area stealing taps meant for the product link. **At 1440 on the home page** (edge 144px): peeks and arrows visible on both carousels, still 0 overlapping the card, so the desktop affordance is intact.

## News, careers, legal

### M25 — Legal pages render as an undifferentiated wall of text — ✅ **FIXED**
- **File:** [app/pages/legal/[slug].vue:56](app/pages/legal/[slug].vue:56)
- **Viewport:** both (worst on mobile — narrowest column, longest scroll)
- **Problem:** the `prose prose-neutral prose-headings:… prose-p:…` classes require `@tailwindcss/typography`, which is **not** in `package.json`, and there is no hand-rolled `.prose` rule in `main.css`. Tailwind v4 Preflight then actively strips the browser defaults: headings get `font-size: inherit; font-weight: inherit` and lists get `list-style: none; margin: 0; padding: 0`. So `## 1. Оршил` headings and `- …` bullets render as plain 16px body text with no hierarchy, no bullets and no paragraph spacing.
- **Fix applied:** installed `@tailwindcss/typography@0.5.20` and added `@plugin "@tailwindcss/typography";` to `main.css`. The existing `prose-headings:` / `prose-p:` / `prose-li:` modifiers on the page are that plugin's own API, so this is what the author intended — no markup changed. **Verified** on `/en/legal/privacy` and `/mn/legal/terms`: `h2` 24px/500 against 16px/28px body, `ul` back to `list-style: disc` with a 26px indent, no overflow at 375.

### M26 — News pagination squeezes to ~32px controls with zero gap — ✅ **FIXED**
- **File:** [app/pages/news/index.vue:195](app/pages/news/index.vue:195)
- **Viewport:** mobile 375 / 390
- **Problem:** the nav has **no `flex-wrap`**. The worst case from `pageNumbers` (`:87`) is 8 items plus 2 arrows = 10 × `size-10` = 400px against 327px of usable width. Flex shrink prevents literal overflow but collapses each control to ~32px with no separation between neighbours — under the touch minimum and adjacent, so mis-taps are near-certain.
- **Fix applied:** `flex-wrap gap-1` on the nav and `shrink-0` on every control.
- **Verified** against the worst case the window can produce — 8 page controls plus 2 arrows in 327px: every control keeps its full **40×40** (was squeezing to ~32 with zero gap), 4px gaps, wrapping to 2 rows, no overflow. Simulated with the production class strings, since the current content is only one page long.

### M27 — AutoNextNews card is covered by the floating action button at tablet — ✅ **FIXED**
- **File:** [app/components/AutoNextNews.vue:184](app/components/AutoNextNews.vue:184) vs [app/components/FloatingActions.vue:14](app/components/FloatingActions.vue:14)
- **Viewport:** tablet 768 / 820
- **Problem:** both overlays are fixed and both are mounted from `layouts/default.vue:20`. The FAB is `bottom-6 right-6 z-50` over a 64×124 GlassSurface (x = vw−88 … vw−24, y = 24…148 from the bottom). AutoNextNews is `z-40` spanning nearly the full width at these viewports (y ≈ 32…141). They intersect, and the FAB wins on z-index — landing exactly on the "Close" and "Read next" buttons. At 1440 the `max-w-[1200px]` cap keeps them apart, which is why it only appears on tablet.
- **Fix applied:** the FAB yields the corner while the overlay is up, via `body:has(.anx-overlay) .fab-dock` in `main.css` — the same `:has()` idiom the announcement bar already uses. Reserving a gutter (`pr-24`) was the alternative but it shifts the overlay off-centre at *every* width: the two only clear each other above ~1376px viewport (the overlay's container caps at 1200px), so the padding could not be scoped to the colliding range without also moving it on desktop. The overlay is transient — 10s auto-advance — and the FAB returns when it leaves.
- **Verified at 768:** the collision is real (FAB occupies x 680–744, y 876–1000, inside the overlay's bottom band). With the hook element present the FAB's `pointer-events` flips `auto → none → auto`, so the selector matches. The paired opacity/transform fade could not be observed — it is a 250ms transition and the pane's rAF is paused — but `pointer-events` is untransitioned, which is why it reads immediately.

### M28 — `/test` is a stray dev page that overflows by 635px and is crawlable — ✅ **FIXED**
- **File:** [app/pages/test.vue:1](app/pages/test.vue:1), [nuxt.config.ts:114](nuxt.config.ts:114)
- **Viewport:** both
- **Measured at 375:** document `scrollWidth` 1010 vs 375 — **635px of horizontal overflow**, by far the worst on the site.
- **Problem:** a bare `<div>` wrapping `<SplineScene>` with no height, so the canvas' `size-full` resolves to 0 and the page renders header + footer with nothing between. It is also **not** sitemap-excluded — `nuxt.config.ts:116` excludes only `['/**/careers/exam']`, so `/test` and `/en/test` will be emitted and indexed.
- **Fix applied:** deleted `app/pages/test.vue`. Nothing in `app/` or `content/` linked to it, and removing the page drops the route entirely, so no sitemap `exclude` entry was needed. **Verified:** `/en/test` now renders the 404 page.

---

# Minor

## Global / CSS
- **No site-wide horizontal-overflow guard.** `app/assets/css/main.css:55` sets only `overscroll-behavior`. Neither `html` nor `body` carries `overflow-x`, and no layout wrapper does. Sections happen to clip individually today, but `AboutBoard` and `AboutOrgChart` have no clipping ancestor at all — one long CMS value there becomes a page-level scrollbar. Add `html { overflow-x: clip }` (`clip`, not `hidden`, so `position: sticky` keeps working).
- **`scroll-padding-top: 96px` hardcoded** (`main.css:64`) assumes the announcement bar is present. Once dismissed, anchor jumps leave a 36px gap. Use `calc(60px + var(--announcement-h))`.
- **`AppButton` default size is below the touch floor** (`AppButton.vue:29`): `sm` ≈ 28px, `md` (the default) ≈ 36px. Only `lg` clears 40px. Every default-size button in the app is a sub-40px target. Add `min-h-10` to the `md` entry.
- **`AppInput` uses `text-sm`** (`AppInput.vue:50`), and iOS Safari auto-zooms on focus for any control under 16px. **[measured]** the contact form is unaffected — `ContactForm.vue:72` sets an explicit `text-base` and its fields measure 16px/46px — but the loan-calculator fields inherit the 14px default. Use `text-base sm:text-sm`.
- **Fixed FAB covers 88px of a 375px viewport** (`FloatingActions.vue:14`), permanently, on every page. Full-width bottom controls (ContactForm submit, news "view all" CTA, ApplicationForm submit) can sit under it. Shrink it below `sm`.
- **`BlurText` sets inline `display:flex`** (`BlurText.vue:130`), making `text-align: center` inert — centring only works where the caller passes `justify-center`. The trailing space appended to each word is also preserved at line ends, so centred lines are off by up to a space width. Worst at 375 where headings wrap to 3–4 lines.
- **`Alert.vue`** is an unstyled leftover with a hover-only affordance and no responsive rules; no in-app usage found. Delete it.

## Header / footer
- **Locale dropdown is hover-only** (`LocaleSwitcher.vue:55` + `main.css:319`). Degrades acceptably — the trigger itself toggles between the two locales on click — but the list is unreachable on touch.
- **Locale trigger pill is 36px tall** **[measured: 59×33]** (`LocaleSwitcher.vue:32`), sitting right beside the correctly-sized 40×40 hamburger.
- **Announcement copy truncates to near-nothing at 375** (`AnnouncementBar.vue:43`): `px-12` plus a `shrink-0` CTA leaves ~150px for the message, which `truncate` clips to an ellipsis. Use `px-4 sm:px-12` and hide the CTA text below `sm`.
- **Footer `lg:px-0` leaves zero gutter at 1024–1200** (`SiteFooter.vue:60`) — the container only *reaches* `max-w-[1200px]` at 1200px. Use `px-6 xl:px-0`.
- **Footer link rows are ~18–20px tall** **[measured]** in the 2-column mobile grid (`SiteFooter.vue:62`). Add `inline-block py-1.5`.
- **Footer socials/contact pills are 34–36px** **[measured: 36×36 and 128×36]** (`SiteFooter.vue:104`).
- **`AuthButton` login is ~30px tall**; logout has no padding at all (`AuthButton.vue:47`).
- **`AppDialog`'s body scroll lock is ineffective on iOS** (`AppDialog.vue:37`) — `body { overflow: hidden }` alone does not stop rubber-band scroll behind a fixed overlay.

## Home
- **Products carousel active card is 377px in a 375px viewport** (`HomeProductsCarousel.vue:18`) — 24px edge + 353px card. No next-card peek, so the "there's more" affordance is gone. Not blocking: drag works and all cards stay reachable.
- **Carousel peeks and floating arrows are `hidden md:block`**, leaving no visual scroll signal on mobile beyond the 44px footer arrows. Add dots or a count below `md`.
- **HomeFeatures decorative gradients are fixed px** sized for a 722px desktop card (`HomeFeatures.vue:63` `w-[195px]`) — on a 375px card the fade covers 52% of the surface. Use percentages.
- **HomeFincoBiz skeleton internals are `cqw`-sized** (`:154`) — 3.6px bars and 4.9px dots at mobile width. Decorative only (`aria-hidden`).
- **Hero tab strip scrolls with a hidden scrollbar and truncates 2 of 4 labels** **[measured]** — at 375, "Зээлийн үйлчилгээ" and "Итгэлцэлийн үйлчилгээ" sit at x 536 and 712 inside a 375px `overflow-x-auto` (`HomeHero.vue:358`). All slides stay reachable via swipe and the 6s auto-advance, but there is no affordance. Use `w-[calc(50%-0.5rem)]` or dots below `lg`, and a 2-line clamp instead of `truncate`.
- **`₮70 тэрбум+` is tight in a 224px tablet column** (`HomeStats.vue:91`) — a 48px number plus a 24px suffix measures ~185px with no wrap guard.

## About / branches
- **AboutHero doesn't subtract `--announcement-h`** (`AboutHero.vue:11`) — `min-h-[100svh]` where the convention elsewhere is `calc(100svh - var(--announcement-h,0px))`, so the fold sits 36px into the hero.
- **AboutHero intro is 14px `font-thin` at `text-white/60` over a photo** (`:44`), ~18 lines on a 343px column — the smallest, lowest-contrast text on the page at the width where it is hardest to read.
- **AboutHero exceeds one screen on iPhone SE** (`:29`) — ~790px of content in a `min-h-[100svh]` box, losing the `justify-end` composition.
- **AboutMission spends ~1768px of scroll on ~570px of copy** on mobile (`:137` `gap-[70vh]`).
- **AboutValues' tablet band is the only non-interactive variant** (`:88` vs `:203`) — three separate renderings of the same five items, and the 768–1023 one has no selection state, so the "select a value" affordance vanishes there.
- **AboutCeoMessage's tilted decoy sheets** swing ~25px past the card at 343px and are clipped hard against the section edge (`:86`).
- **BoardMemberRow's text column lacks `min-w-0`** next to a fixed 120px portrait (`:11`), and `AboutBoard` has no `overflow-hidden` — so a longer CMS name would scroll the page sideways.
- **AboutOrgChart's mobile pills use `whitespace-nowrap`** on CMS labels (`:162`) with `px-7`. Current values fit; a longer `org.root`/`org.ceo` would overflow, and the section has no clipping ancestor.
- **BranchExplorer/MapEmbed `sizes="… md:50vw …"`** (`:47`) but the grid is single-column until `lg`, so both images are told to fetch a 384–410px candidate while rendering at ~100vw on tablet — upscaled and soft at exactly the widths under test.
- **Branch photo is a portrait source in a 288px letterbox** (`:36`) — a 415×606 image cropped to 736×288 at tablet discards ~85% of it.
- **Branch `tel:` link is ~22px tall** (`BranchListItem.vue:55`), 8px above the address, on top of the card's stretched select button.
- **Branch name is `truncate`d in a ~267px column** (`:30`); the longest current name is close to the cut with no tooltip.
- ~~**MapEmbed's 3D pin is a fixed 132×168** (`:70`) — 24% of the desktop map's width, but 38% wide and 53% tall in the mobile box, and a pin at `y ≤ 0.5` has its head clipped.~~ ✅ **FIXED** alongside C2 — now `clamp(72px, 28%, 132px)` with a fixed aspect ratio. The tablet edge case on `/branches` remains; see C2.

## Products / services
- **DetailTabs' three-up bar is cramped at 375** with no scroll or wrap fallback (`:34`) — min-content ~318px against 343px available. A fourth tab or a longer string tips it into overflow.
- **DetailTabs' CMS markdown has no `overflow-x-auto` wrapper** (`:65`) and its `prose` class is inert (same root cause as M25). No markdown tables exist in `content/products/**` today, but nothing prevents one.
- ~~**ProductGrid card summary and CTA are hover-only**~~ ✅ **FIXED** — a `touch:` custom variant (`@custom-variant touch (@media (hover: none))` in `main.css`) now pairs every hover reveal, plus `group-focus-visible:` for keyboard. Verified the variant compiles to real `@media (hover: none)` rules (`touch:opacity-100`, `touch:translate-y-0`, `touch:grid-rows-[1fr]`) applied to the 10 affected elements. Not rendered under an emulated touch pointer — the preview pane cannot emulate pointer capability — so worth one look on a real device.
- ~~**ProductCard has the same hover-only reveal**~~ ✅ **FIXED** — same `touch:` variant on both the `grid-rows-[0fr]→[1fr]` reveal and the label's opacity, plus `group-focus-visible:`.
- **ProductsIntro's 1920×159 backdrop lacks `object-cover`** (`:32`) so it stretches ~1.3× vertically once the tagline wraps to 4 lines at mobile width. The `min-h-[159px]` itself is a floor, not a fixed height — copy grows correctly, no clipping.

## News / careers / contact
- **Fixed `sizes` hints on fluid images** — `sizes="368px"` (`news/index.vue:183`) and `"408px"` (`NewsCard.vue:46`) on thumbnails that are `w-full` at base.
- **news/[slug] and legal/[slug] markdown lack `overflow-wrap` and table/pre overflow rules** — editor-authored content, so one pasted URL or fee table overflows the 327px column.
- **Careers timeline connector only aligns with row 1 at tablet** (`Timeline.vue:26`) — the bar is `md:block` but the grid is `md:grid-cols-3` with 6 steps, so row 2's dots float unconnected. Gate the bar to `lg:block`.
- **PageHero breadcrumb doesn't wrap** (`:44`) and the chevrons lack `shrink-0` — three crumbs plus two chevrons in 343px on `careers/[slug]`.
- **careers/exam has double horizontal padding** (`:34`) — the page wrapper's `px-4` plus PageHero's own `px-4` inset the breadcrumb 32px against the page's 16px. The credential fields also lack `inputmode` and `autocomplete` on the one screen that is purely credential entry.
- ~~**ApplicationForm's native file input** is styled as a text field~~ ✅ **FIXED** — the file field now has its own branch: `file:` styles the native button, `min-w-0 truncate` keep a long filename inside the box, `py-1` matches the sibling text fields' height, and `accept` filters the mobile picker to documents. **Verified at 375:** file field 42×301, identical height to the text/email fields, contained within its panel, no horizontal scroll, no page overflow. (A long filename can't be reproduced programmatically — a file input's value is not settable for security reasons — so the overflow guard is structural rather than measured.)

---

## Verified clean

Checked and found correct — recorded so they are not re-audited:

- **No document-level horizontal scroll** on any real page at 375, 390, 768 or 820, in `/en` or `/mn`. **[measured across 60 route×viewport combinations covering every route in the app]** The only offenders are `/test` (M28) and the 404 page (C1).
- **Layouts** (`default.vue:13`, `minimal.vue:6`) use `min-h-dvh`; `error.vue:23` uses `svh`.
- **Mobile drawer reachability** — every top-level destination *and* every product sub-link is present in the accordion with correct `tabindex="-1"` gating.
- **Hamburger is exactly 40×40** (`SiteHeader.vue:372`). **[measured]**
- **AboutTimeline** collapses correctly — base is one milestone per row, pairing starts at `sm:`.
- **AboutOrgChart's `cqw` diagram is `lg:`-only** with a real stacked semantic tree below it — no unreadable shrink at 375.
- **BranchExplorer / BranchListItem** — correct mobile-first grid, and a proper full-card stretched touch target.
- **news/[slug]'s sticky tick-ruler is `hidden lg:block`** and `pointer-events-none` — never touches mobile or tablet. The reading column is `max-w-[808px] px-6`, properly capped and fluid.
- **AutoNextNews is correctly suppressed below 640px**; its dismiss control is a 48px-tall button.
- **ContactForm** — single-column, correct `type="email"`/`type="tel"`, explicit `text-base` so iOS does not zoom. **[measured: 16px font, 46px tall fields]**
- **ContactInfo** — 44px icon circles; the long address sits in a `min-w-0` wrapper.
- **news/index featured grid and list rows** collapse correctly (`sm:grid-cols-2 lg:grid-cols-3`, `flex-col sm:flex-row`).
- **careers/index, careers/[slug], contact** — all single-column at base with `lg:` overrides.
- **FeedbackDialog** is correctly mobile-first; all fields are 40px.
- **ApplicationForm** is single-column with an always-reachable submit.
- **Both carousels have real pointer-drag** and 44px footer arrows, so every card stays reachable even where peeks are clipped.
- **HomeHero's scrub layout is gated behind `@media (min-width: 1024px)`** — mobile never runs the `--hero-p` calc.
- **HomeFincoBiz's click-to-promote is a plain `@click`**, and its peek is floored at 44px.
- **AboutValues' cards use `@click`**, not hover.
- **All product/service heroes use `min-h` floors** with `flex-1` centred content, so they grow rather than clip; `pt-24` correctly matches the 60px header + 36px announcement bar.

---

## Coverage

**Every route was rendered and measured** — all 17 page files under `app/pages/**`, all 14 product slugs, all 6 news slugs, both job postings, both locales, at all four target widths. 60 route×viewport combinations in total.

| Route | 375 | 390 | 768 | 820 |
|---|---|---|---|---|
| `/` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/about` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/branches` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/business` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/products` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/products/[slug]` — all 14 | ✅ ✅mn | — | — | ✅mn |
| `/services`, `/services/trust` | ✅ | ✅mn | — | — |
| `/news` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/news/[slug]` — all 6 | ✅ ✅mn | — | ✅ | — |
| `/careers`, `/careers/exam` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/careers/[slug]` — both | ✅ ✅mn | — | — | — |
| `/legal/privacy`, `/legal/terms` | ✅ | ✅mn | — | ✅mn |
| `/contact` | ✅ ✅mn | ✅mn | ✅ | ✅mn |
| `/test` | ✅ **635px overflow** | — | — | — |
| 404 | ✅ **13px overflow** | — | — | — |

**Results of the sweep:**
- **390px** behaves identically to 375 — zero overflow on all 10 routes, with the same two clipping issues (hero tab strip, 408px news card, which loses 18px instead of 57px).
- **820px** is completely clean — zero overflow and zero clipped content on all 10 routes.
- **All 14 product detail slugs** are clean at 375, and all 14 carry the same 343px `whitespace-nowrap` stat row — confirming M22 applies uniformly across the catalogue, not just the two slugs originally inspected. At 375 in Mongolian it fits; the failure is in the 640–768 band.
- **All 6 news slugs and both job postings** are clean.

**Genuinely not covered:**
- **Landscape orientation** on phones.
- **Real-device behaviour** — iOS `100vh` resolution, Safari zoom-on-focus, and touch ergonomics are reasoned from code, not measured; headless Chromium cannot reproduce them. C1's fixed-overlay interaction, M6, and the `AppInput` zoom note should be confirmed on hardware.
- **Motion and interaction states** — mega-menu open, drawer open, dialogs open. These were audited from code (M1–M4, M6–M9) but not driven in the browser, because the preview pane runs with `visibilityState: hidden`, which pauses `requestAnimationFrame` and strands transition-driven UI mid-animation.
