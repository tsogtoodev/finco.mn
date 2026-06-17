# Assets — exported from Figma

Pulled from the Figma `final` page (file `Jy6iCHGx9nTqqT9nnQ6cE9`, page node `1:11344`) via the Figma MCP `download_assets` tool. See [structure.md](../../structure.md) for the page/section map these belong to.

## Layout

| Dir | Contents | Count |
|-----|----------|-------|
| `images/` | Raster source images — photos, mockups, screenshots, gradient/decorative strips | 142 (139 PNG, 3 JPG) |
| `icons/` | UI icons exported as SVG (HugeIcons + Lucide sets) | 14 |
| `videos/` | — | 0 (see note) |

## Naming

- **Images** use content-hash names `fig-<md5>.<ext>`. This auto-dedupes: the same source image referenced on multiple pages resolves to one file. Figma's raw image fills carry no semantic names, so hashes are the stable identifier. Rename as you wire them into components.
- **Icons** keep their Figma layer names, normalized: `interface-globe.svg`, `social-facebook.svg`, `arrow-right-outline.svg`, etc.

## Notes

- **No videos.** The design contains no video fills. `download_assets` exports only PNG/JPG/GIF/WebP raster fills and SVG/PDF vectors — Figma has no video asset to export. The "mockup" visuals in the design are static screenshots (captured in `images/`).
- **Icons not exported:** `arrow-right (solid)` and `lucide arrow-right` rendered empty in Figma (their glyph lives outside the exportable node). Equivalent right-arrows are present: `arrow-right-outline.svg`, `arrow-right-bulk.svg`, and `lucide-arrow-left.svg` (mirror).
- Source images are exported at their native resolution (some are large — `images/` totals ~200 MB). Optimize / resize before shipping; `@nuxt/image` (already in the project) can handle this at build/runtime.
- Two very small images (`fig-1da2abdecf.png` 344×3, `fig-fbc1fadacc.png` 1373×9) are thin decorative gradient/divider strips, not errors.
