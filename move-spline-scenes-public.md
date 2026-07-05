# Plan — Self-host Spline scenes on our Cloudflare edge

Move the `.splinecode` scene files off `prod.spline.design` and into `public/spline/`,
so they're served same-origin from `finco.design` behind Cloudflare's edge cache
(the CDN). Combined with the idle-prefetch already in `SplineScene.vue`, this makes
scenes load as fast as possible: same-origin (no third-party DNS/TLS), edge-cached
near the visitor, cacheable so the prefetch response is reused by `app.load()`, and
no dependency on Spline's servers being up.

> Verified earlier: each `.splinecode` is a self-contained MessagePack blob — a
> `strings` scan found **no** external URLs or sub-asset references — so hosting the
> single file per scene is sufficient. Re-check per scene anyway (step 3).

## Trade-offs to accept before starting
- **No auto-update.** Re-publishing a scene in the Spline editor will *not* update a
  self-hosted file. Updating a scene = re-download + redeploy (see Maintenance).
- **Bundle size.** Each file (≈34 KB–300 KB) ships as a Workers static asset. Fine at
  this scale; keep an eye on the total if scenes grow.
- **`_tmp-` snapshot.** `public/_tmp-stats-scene.splinecode` is already self-hosted;
  fold it into the new convention and drop the temp name.

## Scene inventory

| Component | Line | Current source | New local path |
|---|---|---|---|
| `app/components/AboutMission.vue` | 50 | `prod.spline.design/5QI6kS8kPdn7j7Y3/scene.splinecode` | `/spline/about-mission.splinecode` |
| `app/components/HomeContactCta.vue` | 15 | `prod.spline.design/rAfqlL9pnx29yw5P/scene.splinecode` | `/spline/home-contact.splinecode` |
| `app/components/MapEmbed.vue` | 22 | `prod.spline.design/jz0xkk2dguy2XY4p/scene.splinecode` (default prop) | `/spline/branch-pin.splinecode` |
| `app/components/HomeStats.vue` | 34 | `/_tmp-stats-scene.splinecode` (already local) | `/spline/home-stats.splinecode` (rename) |
| `app/pages/test.vue` | 2 | `prod.spline.design/ctfpPmq7XLx77Ni2/scene.splinecode` | scratch page — migrate only if kept |

## Steps

### 1. Create the folder
```bash
mkdir -p public/spline
```

### 2. Download each remote scene
```bash
curl -fsSL "https://prod.spline.design/5QI6kS8kPdn7j7Y3/scene.splinecode" -o public/spline/about-mission.splinecode
curl -fsSL "https://prod.spline.design/rAfqlL9pnx29yw5P/scene.splinecode" -o public/spline/home-contact.splinecode
curl -fsSL "https://prod.spline.design/jz0xkk2dguy2XY4p/scene.splinecode" -o public/spline/branch-pin.splinecode
# optional (test page): curl -fsSL "https://prod.spline.design/ctfpPmq7XLx77Ni2/scene.splinecode" -o public/spline/test.splinecode
```

### 3. Sanity-check each file is self-contained
```bash
for f in public/spline/*.splinecode; do
  echo "== $f ($(wc -c < "$f") bytes) =="
  # Expect NO output: no external URLs / sibling asset files referenced.
  strings "$f" | grep -iE "https?://|prod\.spline\.design|\.(png|jpg|jpeg|hdr|ktx2|glb|draco)" | sort -u
done
```
If any file prints external refs, that scene pulls sub-assets — host those too (same
folder) or keep that one on Spline.

### 4. Rename the existing stats snapshot into the convention
```bash
git mv public/_tmp-stats-scene.splinecode public/spline/home-stats.splinecode
```

### 5. Point the components at the local paths
- `AboutMission.vue:50` → `scene="/spline/about-mission.splinecode"`
- `HomeContactCta.vue:15` → `scene="/spline/home-contact.splinecode"`
- `MapEmbed.vue:22` (default prop) → `pinScene: '/spline/branch-pin.splinecode'`
- `HomeStats.vue:34` → `scene="/spline/home-stats.splinecode"`
- `test.vue:2` (only if migrating) → `const SCENE = '/spline/test.splinecode'`

### 6. Long-cache the folder at the edge (maximise CDN caching)
Add to `nuxt.config.ts` so Cloudflare caches variants aggressively and the
`SplineScene` prefetch response is reused by `app.load()`:
```ts
nitro: {
  routeRules: {
    '/spline/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
},
```
Because scenes are `immutable`-cached, **bust the cache on update by changing the
filename** (e.g. `home-contact.v2.splinecode`) rather than overwriting in place —
otherwise CDNs/browsers serve the stale copy. (Alternative: overwrite + purge the
Cloudflare cache for that path.)

## Verification
**Dev** (`nuxt dev`): images/scenes come from IPX-style same-origin URLs — confirm
the `<SplineScene>` requests hit `http://localhost:3000/spline/…splinecode` (200) and
the scenes still render. No `prod.spline.design` requests should remain (except
`test.vue` if skipped).

**Prod** (deployed `finco.design`), in DevTools → Network:
- Scene request URL is `https://finco.design/spline/…splinecode`.
- Repeat load shows `cf-cache-status: HIT` and `server: cloudflare`.
- No requests to `prod.spline.design`.
- Scenes render identically.

## Maintenance (updating a scene)
1. In the Spline editor, publish; grab the new `…/scene.splinecode` URL (or export).
2. `curl` it to `public/spline/<name>.<newversion>.splinecode` (bump the version).
3. Update the component's `scene`/`pinScene` to the new filename.
4. Commit + deploy.

Optional: add an `npm run` script that re-downloads all scenes from a
`spline-sources.json` map so updates are one command.

## Rollback
Revert the component `scene`/`pinScene` values back to the `prod.spline.design` URLs
(and restore `HomeStats` to the temp file if needed). The `public/spline/` files can
stay or be deleted; nothing else depends on them.

## Out of scope (tracked separately)
- **Shrink the scenes in Spline** (poly count / texture resolution) — the biggest
  lever on raw payload, but editor work, not code.
- The idle-prefetch in `SplineScene.vue` is already in place and complements this.
