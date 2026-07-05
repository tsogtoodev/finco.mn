# Strapi Headless CMS Replacement Plan (Strapi Cloud)

Replacing the git-based `@nuxt/content` + Nuxt Studio setup with **Strapi Cloud**
(managed Strapi v5), driven by one hard requirement the current stack cannot meet:
**role-based permissions for CMS users** (per-collection editor/publisher roles inside
the CMS UI).

Hosting decision: **Strapi Cloud** (managed) — chosen over self-hosting because (a)
there is no dedicated ops owner, and (b) custom admin roles are a paid Strapi feature
anyway: self-hosted community edition only ships the 3 fixed default roles, so
self-hosting would still require an Enterprise license to meet the RBAC requirement.

Status: PROPOSED · Owner: — · Last updated: 2026-07-05

---

## 1. Why (and why not)

| Requirement | @nuxt/content + Studio (today) | Strapi |
|---|---|---|
| Role-based permissions per collection | ❌ GitHub repo write access = edit everything | ✅ Core RBAC: roles × content types × actions (create/read/update/delete/publish) |
| Draft → review → publish workflow | ⚠️ Only via git branch + PR (raw YAML diffs) | ✅ Draft & Publish built in, per-role publish rights |
| Non-technical editor UX | ⚠️ Studio is decent but git-bound | ✅ Full admin UI, media library, relations pickers |
| Live publishing (no redeploy) | ❌ Every edit = commit → build → deploy (~minutes) | ✅ Publish = instant (subject to cache TTL) |
| Content versioned with code in git | ✅ | ❌ (DB; mitigated by managed backups + nightly export) |
| Zero extra infrastructure | ✅ (D1 binding, no servers) | ⚠️ Managed SaaS (Strapi Cloud) — no servers to run, but a paid subscription + second vendor |
| Locale fallback control | ❌ missing translation silently 404s | ⚠️ Same per-locale query model, but centralizable in one adapter |

Decision this plan assumes: RBAC is a hard requirement ⇒ full replacement, executed in
two waves (news/jobs first, everything else second) so there is always a working site.

> **Gate 0 — verify before anything else:** the Strapi Cloud plan tier MUST include
> **custom admin roles** and enough **seats** for the editor team (§5 needs 4–5 roles
> across several users). Custom roles are plan-gated on Cloud (and Enterprise-only
> when self-hosting). If the qualifying tier is out of budget, evaluate Directus
> Cloud / Payload Cloud before compromising the requirement — this plan's structure
> (adapter layer, seeding, waves) transfers to either with minor changes.

---

## 2. Current state (what is being replaced)

Six collections defined in `content.config.ts`, all locale-as-field (`mn`/`en`), files
under `content/<collection>/<locale>/`:

| Collection | Type | Docs (per locale) | Consumed by |
|---|---|---|---|
| `products` | data | 14 | `useProductList()` → mega menu, footer, /products + /business grids, home carousel, product detail pages, sitemap |
| `pages` | data | 6 (home, about, products, business, branches, careers) | `usePageContent()` → SEO, HomeHero/Beep/FincoBiz/Stats/Features, listing heroes + FAQ, About page (entire), careers timeline/perks, branches hero |
| `news` | page (md body) | 6 | /news list, /news/[slug], HomeNews carousel, sitemap |
| `jobs` | data | 2 | /careers list + detail (incl. `applicationSections` form schema) |
| `branches` | data | 4 | /branches explorer |
| `services` | data | 1 | /services redirect + /services/[slug] |

Frontend access is already funneled through a **small adapter surface** (deliberate,
from the 2026-07 CMS migration):

- `app/composables/useProducts.ts` — `useProductList(audience?)`
- `app/composables/usePageContent.ts` — `usePageContent(key)`
- `app/composables/useAboutContent.ts` — wraps `usePageContent('about')`
- Direct `queryCollection` calls: news (3 sites), jobs (2), branches (1), services (2),
  products detail/related (2), `server/api/__sitemap__/urls.ts`

Everything else in the repo (components) consumes these — **components do not change**
in this migration; only the adapter internals and the query call sites do.

Guard rails to preserve: `scripts/check-content.mjs` invariants (locale parity, slug
integrity, products need audience+order, news needs summary + string publishedAt).

---

## 3. Target architecture

```
┌────────────────┐   REST (+token)   ┌──────────────────────────────┐
│ Cloudflare      │ ────────────────▶ │ Strapi Cloud (managed v5)    │
│ Worker (Nuxt    │ ◀──── JSON ────── │ · managed Postgres + backups │
│ SSR, finco.mn)  │                   │ · built-in asset CDN         │
│ · Cache API/KV  │ ◀── webhook ───── │ · i18n plugin (mn, en)       │
│   SWR cache     │    (purge)        │ · custom RBAC roles          │
└────────────────┘                   └──────────────────────────────┘
```

- **Strapi Cloud project** built from a git repo we own (new repo, or `cms/` folder
  here): a standard Strapi v5 TypeScript app holding the content-type schemas,
  components, and config. Cloud deploys on push — schema changes go through git even
  though content lives in the managed DB.
- **Region**: pick the closest available (AWS EU or US). Site visitors are unaffected
  (the Worker serves from edge cache); editors in Ulaanbaatar will feel admin-panel
  round trips — acceptable, noted as a known trade-off.
- **Database & backups**: managed by Strapi Cloud (tier-dependent backup cadence —
  confirm on the chosen plan). Belt-and-braces: a nightly scheduled job exports all
  entries via the REST API to a JSON artifact (R2 or repo) for audit/rollback.
- **Media**: Strapi Cloud's built-in CDN-backed asset storage — no separate bucket to
  run. (Optional later: swap to the S3 provider + Cloudflare R2 behind
  `media.finco.design` if egress cost or CDN control becomes a concern; entry URLs are
  resolved through the adapter, so the swap is contained.) Existing `public/images/**`
  that are *content-referenced* migrate into the media library; images that are
  *component chrome* (blobs, halftones, mockup crops, partner SVGs) stay in the repo.
- **Custom domain** `cms.finco.design` on the Cloud project (plan-dependent feature —
  cosmetic; the default `*.strapiapp.com` URL works identically).
- **The Worker fetches Strapi at SSR time** with a read-only API token. Every response
  cached in Cloudflare Cache/KV with `stale-while-revalidate` (TTL ~60s, SWR ~24h) so
  a Strapi Cloud incident degrades to stale content, not a down site. Strapi webhooks
  → a Worker route purges affected cache keys on publish (instant publishing).

---

## 4. Content modeling in Strapi

Locale handling: enable the **i18n plugin** with `mn` (default) and `en`. The current
`locale:` frontmatter field and `mn/`/`en/` folders disappear — Strapi localizations
replace them (fixes the "one file per locale can drift" class of bugs; parity is
visible in the admin UI per entry).

### 4.1 Collection types

**`product`** (from `products` zod schema — localized unless noted)

| Field | Type | Notes |
|---|---|---|
| slug | UID (not localized) | shared across locales, keeps `/products/[slug]` URLs |
| audience | enum individual/business (not localized) | |
| title, menuTitle, menuDesc, summary, category | string / text | menuTitle carries the 🍀 prefix |
| heroImage, cardImage | media | migrated from `/images/products/*`, `/images/home/product-*` |
| featured (not localized), order (not localized) | boolean, integer | |
| loanTerms | component `product.loan-terms` { amount, rate, period — strings } | display strings stay localized (mn "сая₮", en "₮…M") |
| tabs | component `product.tabs` { info: text, requirements: repeatable string, other: text } | |
| related | relation → product (many, not localized) | replaces slug arrays |
| faq | repeatable component `shared.faq-item` { question, answer } | |
| body | markdown (text) | the one-line md body |

**`news-article`** — slug UID, title, summary, image (media), publishedAt (date),
to (string, optional override), body (**markdown text field**, see §6 rendering).
Draft & Publish ON (this is the collection that most wants it).

**`job`** — slug UID, title, department, location, type, postedAt, summary,
requirements/responsibilities (repeatable strings), applicationSections (repeatable
component `job.application-section` { id, title, fields: repeatable
`job.form-field` { name, label, type enum, required, options } }).

**`branch`** — slug UID, name, address, phone, hours, caption, photo/mapImage (media),
pin (component {x,y}), coords (component {lat,lng}), order.

**`service`** — mirrors the services schema (slug, title, breadcrumb, summary,
heroImage, cta component, order, related → product relation, faq, body).

### 4.2 Single types (replacing `pages/*`)

One single type per page so RBAC can gate them individually:

- **`home-page`** — hero (component), heroSlides (repeatable {key, tab, headline,
  subtext}), valueProps, statsHeading + stats (repeatable {value, prefix, suffix,
  label}), beep group, fincobiz group (incl. cards {request, receivables,
  eligibility}), showcases, cta.
- **`about-page`** — the `about` group as nested components (hero, mission.blocks,
  values.items, history.milestones, ceo, board.members with media photos, org).
- **`products-page`**, **`business-page`** — hero {eyebrow, headline, subheadline,
  image} + faq.
- **`careers-page`** — hero, timeline, perks.
- **`branches-page`** — hero.

(Components live under shared namespaces: `shared.link`, `shared.faq-item`,
`page.hero`, etc. — one definition, reused.)

---

## 5. RBAC design (the point of all this)

> Requires a Strapi Cloud plan with **custom admin roles** (see Gate 0 in §1). The
> free/default role set (Super Admin, Editor, Author) cannot express this matrix.

Admin roles (Strapi admin panel → Settings → Administration panel → Roles):

| Role | products / services | pages (singles) | news | jobs | branches | Media | Publish rights |
|---|---|---|---|---|---|---|---|
| **Super Admin** (dev/ops) | full | full | full | full | full | full | all |
| **Publisher** (marketing lead) | read | update | full + publish | read | update | full | news, pages |
| **Marketing Editor** | read | update (draft) | create/update drafts | — | — | upload | none |
| **Finance Editor** | update (incl. loanTerms) | — | — | — | update | upload | products, services, branches |
| **HR Editor** | — | careers-page only | — | full + publish | — | upload | jobs |

Notes:
- Loan terms governance: only **Finance Editor**/**Super Admin** can touch `product`
  entries — the exact gate that was impossible with Studio. (Field-level permissions
  are Enterprise-only; if "editors may edit product copy but not rates" is needed,
  either split `loanTerms` into its own collection with a relation, or accept
  entry-level granularity.)
- Public **API role** gets `find/findOne` on all types, nothing else; the Worker uses
  a read-only API token anyway.
- Draft & Publish enabled on `news-article`, `job`, and the page singles; products can
  start publish-on-save if that matches how finance works today.

---

## 6. Frontend changes (kept deliberately small)

1. **New fetch adapter** `app/composables/useCms.ts`: a thin `$fetch` wrapper around
   the Strapi REST API (`/api/:type?locale=…&populate=…`), normalizing Strapi's
   `{data: [{id, attributes}]}` envelope into the flat shapes components already use
   (`title`, `slug`, `heroImage` → URL string, …). Reuse the `useAsyncData` keys and
   `watch: [locale]` pattern verbatim — the locale-reactivity contract stays.
2. **Rewrite the internals** of `useProductList`, `usePageContent`,
   `useAboutContent`, and the ~10 direct `queryCollection` call sites (news, jobs,
   branches, services, product detail/related, sitemap route) to go through the
   adapter. Return shapes are preserved → **no component edits** except:
3. **Markdown rendering**: `<ContentRenderer>` (news body, product body via
   DetailTabs if used) is @nuxt/content-specific. Add `@nuxtjs/mdc` and render the
   markdown string fields with `<MDC :value="article.body" />`. (Alternative — Strapi
   blocks/rich-text + a blocks renderer — rejected: markdown keeps migration lossless
   and the door open.)
4. **Types**: replace `Collections['products']` etc. with interfaces exported from the
   adapter (or generate from Strapi's OpenAPI). `useAboutContent` re-exports stay.
5. **Caching on the Worker**: wrap adapter fetches in `cachedFunction`/Cache API
   (60s TTL + SWR). Add `server/api/cms/revalidate.post.ts` receiving the Strapi
   webhook (shared secret) to purge keys on publish.
6. **Locale fallback policy** (fixing today's gap): adapter tries requested locale,
   falls back to `mn` when the localization is missing (log a warning). Detail pages
   keep 404 for truly nonexistent slugs.
7. **Removals** once wave 2 completes: `@nuxt/content`, `nuxt-studio` + `studio`
   config, `hub.database` + the D1 binding in `wrangler.jsonc`, `better-sqlite3`,
   `content/` directory, `content.config.ts`, `scripts/check-content.mjs` (its
   invariants become Strapi required-fields/validations + a small CI smoke test that
   hits the Strapi API and checks locale parity counts).
8. **Env**: `NUXT_CMS_URL`, `NUXT_CMS_TOKEN` (Worker secret), webhook secret.

---

## 7. Migration & seeding

Write `scripts/strapi-seed.mjs` (one-off, run locally):

1. Parse every file under `content/` (same frontmatter parsing as check-content.mjs).
2. Upload referenced images to the media library (dedupe by filename); map path → media id.
3. Create default-locale (`mn`) entries first, then attach `en` localizations to them
   (Strapi i18n API: `POST /api/:type` then `PUT …?locale=en` on the same document).
4. Resolve `related` slug arrays → relations in a second pass.
5. Publish everything (initial state mirrors the live site).
6. Verify: entry counts per type per locale == file counts (14/6/6/2/4/1), spot-check
   loanTerms strings and the about-page tree.

The clean, typed state of `/content` (post-migration, parity-checked) makes this
essentially mechanical — this plan is the payoff of that cleanup.

---

## 8. Execution phases

**Phase 0 — Foundations (0.5 day)**
Confirm the Cloud plan tier includes custom roles + seats (Gate 0) and purchase;
scaffold the Strapi v5 app repo and connect it to a Strapi Cloud project (region,
custom domain, admin accounts, read-only API token, webhook secret); set up the
nightly content-export job.

**Phase 1 — Wave 1: news + jobs (1–1.5 days)**
Model `news-article`, `job` (+ shared components); seed from `/content`; build the
`useCms` adapter + MDC rendering; switch the 5 news/jobs call sites + sitemap; RBAC
roles for Publisher/Marketing/HR; webhooks + cache purge. `/content` keeps serving
everything else (hybrid runs in production — this is the rollback-friendly proof).

**Phase 2 — Wave 2: catalog + pages (2–3 days)**
Model product/service/branch + the six single types; seed; switch `useProductList`,
`usePageContent`, `useAboutContent`, remaining call sites; Finance Editor role;
verify all 36 routes × 2 locales (reuse the verification checklist from the
2026-07 migration).

**Phase 3 — Decommission (0.5 day)**
Remove @nuxt/content/Studio/D1/`content/` (keep one tagged commit as archive);
replace check-content with the API smoke test; update README + memory docs.

Total: **4–5 dev-days** + the Gate 0 plan-tier decision + editor onboarding.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Strapi Cloud incident takes the site down | SWR cache on the Worker (serve stale up to 24h); the CMS is never in the request critical path for cached routes |
| SSR latency (Worker → Cloud origin round trip) | Cache-first adapter; sub-60s staleness is acceptable for marketing content |
| Custom-roles tier too expensive / plan changes | Gate 0 verification up front; Directus/Payload Cloud as evaluated fallbacks; adapter isolates the swap |
| Content no longer in git (audit/rollback) | Nightly API export to a JSON artifact + Cloud's managed backups |
| Admin-panel latency for editors in UB (US/EU regions) | Known trade-off; pick nearest region; no impact on site visitors |
| Vendor lock-in | Soft: stock Strapi — eject to self-hosted anytime with DB dump + media export (requires Enterprise license for custom roles, or revisit) |
| Field-level permissions (copy vs rates) needed later | Split loanTerms into a related collection, or Enterprise tier |
| Strapi major upgrades | Managed by Cloud; schema repo has its own CI; upgrades isolated from the site |
| Editor retraining | Wave 1 gives news/jobs editors the new UI early with low blast radius |
| i18n drift returns (entry exists in mn only) | Adapter mn-fallback + CI parity smoke test + admin UI makes gaps visible |

## 10. Open decisions (need answers before Phase 0)

1. **Cloud plan tier** (Gate 0): confirm on strapi.io/pricing that the tier includes
   **custom admin roles** + enough seats; confirm budget owner. This is the go/no-go.
2. **Region**: nearest available AWS region (EU vs US) — affects editor latency only.
3. **Roles**: confirm the §5 matrix names/permissions with the actual team structure.
4. **Draft & Publish on products**: does finance want drafts, or publish-on-save?
5. **Custom domain**: `cms.finco.design` (plan-dependent) or default `*.strapiapp.com`?
6. **Fallback policy**: missing `en` translation → show `mn` (recommended) or 404?

## 11. Acceptance criteria

- All 36 routes × 2 locales render identically to the pre-migration site (pixel/copy
  parity), sourced from Strapi.
- A Marketing Editor can draft a news article but cannot publish it or open products.
- A Finance Editor can change a loan rate; it appears on the live site ≤ 60s after
  publish without a deploy.
- Site serves (stale) content with Strapi stopped.
- Locale parity smoke test green in CI; sitemap includes all published entries.
