# Directus CMS Replacement Plan

Status: Proposed  
Prepared: 2026-07-07  
Target: Replace Nuxt Studio and `@nuxt/content` with Directus while keeping the Nuxt 4 frontend on Cloudflare Workers.

## 1. Decision and non-negotiable gates

Directus is the selected CMS because the editorial team needs ordinary CMS accounts, simple Admin/Publisher/Editor separation, and a live preview of unpublished content. Pages CMS is not the target because it remains Git-backed, does not provide the required publishing permissions, and would continue exposing non-technical editors to repository concepts indirectly.

Implementation starts only after these gates pass:

1. **Seat gate:** confirm that all people who require Directus Studio access, including the technical administrator, fit within Directus Core's three-seat limit. Do not share accounts. If four or more accounts are required, stop and reassess Strapi Growth before accepting the Directus Team price.
2. **Collection gate:** confirm in the selected Directus plan that the proposed 17 custom collections count against, and fit within, the Core limit of 25. Keep at least five spare custom collections after implementation.
3. **Hosting gate:** choose either managed Directus Cloud or a supported Docker/PostgreSQL deployment. Directus does not run inside the existing Cloudflare Worker.
4. **Preview proof gate:** prove live preview, version access, and Editor-versus-Publisher permissions against a small `news` proof of concept before migrating the remaining content.
5. **Budget gate:** record the approved monthly hosting and backup budget before production provisioning.

Pricing and plan limits must be checked again at purchase time. As of 2026-07-07, Directus lists Core with three seats, 25 collections, five Flows, and Advanced RBAC; managed Cloud is a $99/month add-on. See [Directus pricing](https://directus.com/pricing).

## 2. Requirements summary

### Editorial requirements

- Two or three total CMS users, subject to the seat gate above.
- Directus-native login; editors must not need GitHub access or Git knowledge.
- Three simple roles:
  - **Administrator:** configure the CMS and manage all content.
  - **Publisher:** review, publish, unpublish, archive, and restore content.
  - **Editor:** create drafts, edit drafts or content versions, upload approved media, and preview changes; cannot publish or alter CMS configuration.
- Mongolian and English content managed together with visible translation state.
- Side-by-side live preview of saved unpublished changes.
- Publishing may take up to 60 seconds to appear publicly; deployment must not be required.
- Existing URLs, UI, SEO metadata, sitemap behavior, and locale switching must remain stable.

### Engineering requirements

- Keep Nuxt 4, Vue, Cloudflare Workers, `@nuxtjs/i18n`, and the current components/routes.
- Keep private Directus credentials on the server; the browser must never receive an administrative or static API token.
- Preserve the locale-aware `useAsyncData` behavior currently implemented in `app/composables/usePageContent.ts:6-19` and `app/composables/useProducts.ts:11-26`.
- Preserve current content invariants enforced by `scripts/check-content.mjs:30-99`: locale parity, locale correctness, slug integrity, product audience/order, and news summary/date validity.
- Make the migration reversible until production acceptance is complete.
- Add no runtime dependency merely for API access; use Nuxt/Nitro `$fetch` unless a separately approved SDK provides a demonstrated benefit.

## 3. Current-state inventory

The site currently loads seven typed collections from Markdown/YAML via `@nuxt/content` and D1. The schemas are defined in `content.config.ts:19-354`. Nuxt Studio authenticates through GitHub and commits directly to `main` (`nuxt.config.ts:19-42`). Production content storage is attached through NuxtHub/D1 (`nuxt.config.ts:171-186`, `wrangler.jsonc:36-43`).

Current source counts:

| Content type | Mongolian | English | Total source files |
|---|---:|---:|---:|
| Products | 14 | 14 | 28 |
| News | 6 | 6 | 12 |
| Pages | 6 | 6 | 12 |
| Branches | 4 | 4 | 8 |
| Jobs | 2 | 2 | 4 |
| Legal | 2 | 2 | 4 |
| Services | 1 | 1 | 2 |
| **Total** | **35** | **35** | **70** |

The frontend already has a useful partial adapter boundary:

- `app/composables/usePageContent.ts:6-19`
- `app/composables/useProducts.ts:11-26`
- `app/composables/useAboutContent.ts:13-15`

The remaining direct `queryCollection()` calls are in news, products, services, jobs, branches, legal, the home-news component, and `server/api/__sitemap__/urls.ts:4-23`. These call sites must move behind one CMS access layer; components should not be redesigned during the migration.

## 4. Target architecture

```text
Directus Studio
  - email/password accounts
  - Admin/Publisher/Editor policies
  - content versions and live preview
  - PostgreSQL + managed/object media storage
             |
             | REST, server token only
             v
Nuxt/Nitro CMS boundary on Cloudflare Workers
  - allowlisted public content endpoints
  - draft/version preview endpoint
  - response normalization
  - 60-second cache + stale-on-error behavior
             |
             v
Existing Nuxt composables, pages, components, sitemap, and i18n
```

Public pages query only published content through the Nuxt server. Directus is never queried directly by browser components. Preview requests pass through a secured Nuxt preview session and may request a specific Directus content version. Decorative application assets remain in `public/`; editor-controlled media moves into Directus.

### Hosting profiles

Choose one profile at Gate 3:

| Profile | Components | Use when | Trade-off |
|---|---|---|---|
| Managed | Directus Cloud + managed database/media | Lowest operational load is preferred | Current Cloud add-on cost; plan and region constraints |
| Self-hosted | Pinned Directus Docker image + PostgreSQL + S3-compatible storage such as R2 | Cost/control justify owning operations | Team owns upgrades, backups, monitoring, and incident response |

For self-hosting, do not use ephemeral container storage for production media or PostgreSQL. Pin an exact Directus version, test upgrades in staging, and store media in persistent object storage. Directus documents Docker/PostgreSQL deployment and S3-compatible storage in its [Docker guide](https://docs.directus.io/self-hosted/docker-guide) and [configuration reference](https://docs.directus.io/self-hosted/config-options).

## 5. Collection budget and content model

The model intentionally avoids turning every nested object into a relation. Deep page structures in `content.config.ts:167-349` become typed JSON/object/repeater fields so the project remains below the Core collection limit.

### Proposed collection budget

| Collection group | Count | Notes |
|---|---:|---|
| `languages` | 1 | `mn` default and `en` |
| Seven base collections | 7 | products, services, branches, jobs, news, legal, pages |
| Seven translation collections | 7 | one translation table per base collection |
| Product-to-product relation junction | 1 | related products |
| Service-to-product relation junction | 1 | related products/services |
| **Planned custom collections** | **17** | leaves eight against the advertised limit of 25 |

System collections and any hosting-created collections must be confirmed against actual plan metering during Gate 2. Do not expand the model beyond 20 custom collections without revisiting the budget.

### Shared base fields

Every base content collection receives:

- UUID primary key.
- Stable, unique `slug` or `key` shared across languages.
- `status`: `draft`, `published`, or `archived`.
- `sort`/`order` where the current UI depends on ordering.
- `date_created`, `date_updated`, `user_created`, and `user_updated` accountability fields.
- Directus content versioning enabled.
- Preview URL configured when the type has a public route.

Public API queries must include `status = published`. The translation relation must require `mn` before publication; `en` is also required for initial cutover because all current content has parity.

### `products` and `products_translations`

Base fields: `slug`, `audience`, `featured`, `order`, `hero_image`, `card_image`, `status`, translations, and related-products relation.

Translated fields: `title`, `menu_title`, `menu_desc`, `summary`, `category`, `body`, `loan_terms` object, `tabs` object/repeaters, and `faq` repeater. This maps the existing schema at `content.config.ts:19-56` without creating tables for every FAQ or requirement item.

### `services` and `services_translations`

Base fields: `slug`, `order`, `hero_image`, `status`, translations, and related-products relation.

Translated fields: `title`, `breadcrumb`, `summary`, `body`, `cta` object, and `faq` repeater. Source schema: `content.config.ts:58-74`.

### `branches` and `branches_translations`

Base fields: `slug`, `order`, `photo`, `map_image`, `pin` object, `latitude`, `longitude`, `status`, and translations.

Translated fields: `name`, `address`, `phone`, `hours`, and `caption`. Source schema: `content.config.ts:76-94`.

### `jobs` and `jobs_translations`

Base fields: `slug`, `posted_at`, `status`, and translations.

Translated fields: `title`, `department`, `location`, `employment_type`, `summary`, `requirements`, `responsibilities`, and `application_sections`. Keep `application_sections` as nested JSON repeaters matching `content.config.ts:96-130`.

### `news` and `news_translations`

Base fields: `slug`, `published_at`, `image`, `external_url`, `status`, and translations.

Translated fields: `title`, `summary`, and Markdown `body`. Source schema: `content.config.ts:132-150`. The public API and sitemap include only published records.

### `legal` and `legal_translations`

Base fields: `slug`, `updated_at`, `status`, and translations.

Translated fields: `title`, `summary`, and Markdown `body`. Source schema: `content.config.ts:152-165`.

### `pages` and `pages_translations`

Base fields: `key` constrained to `home`, `about`, `products`, `business`, `branches`, or `careers`; `status`; translations.

Translated fields mirror the current page schema: hero, stats, value propositions, hero slides, Beep/FincoBiz groups, showcases, CTA, timeline, perks, leadership, team, sections, FAQ, and the About page structure (`content.config.ts:167-349`). Use Directus field groups, collapsible repeaters, field descriptions, and conditional visibility based on `key` so editors do not see irrelevant fields. Do not introduce a free-form page builder in this migration.

## 6. Roles and publishing workflow

Directus permissions are policy-based and support collection, item, and field restrictions. See the official [permissions reference](https://docs.directus.io/reference/system/permissions).

| Capability | Administrator | Publisher | Editor |
|---|---:|---:|---:|
| Configure schema/settings/users | Yes | No | No |
| Read all drafts and versions | Yes | Yes | Yes |
| Create draft content | Yes | Yes | Yes |
| Edit draft content | Yes | Yes | Yes |
| Create/edit a version of published content | Yes | Yes | Yes |
| Promote a content version | Yes | Yes | No |
| Change `status` to published/archived | Yes | Yes | No |
| Delete content permanently | Yes | No by default | No |
| Upload/select media | Yes | Yes | Yes, restricted folder |
| Delete media | Yes | Yes | No |

Workflow rules:

1. New content starts as `draft`; Editor cannot modify the `status` field.
2. Editor previews a new draft, then asks Publisher to publish it.
3. Changes to already published content are made in a named Directus content version so the public main version remains unchanged.
4. Publisher compares the version, previews it, and promotes it. The published item remains public and receives the promoted changes.
5. Publisher may archive content; permanent deletion is reserved for Administrator.

The proof-of-concept must verify that an Editor can create and update versions without acquiring the underlying permission that would allow direct modification of published main content. If Directus authorization cannot enforce this exact workflow cleanly, stop before migration and redesign the policy/workflow rather than weakening the publishing boundary.

## 7. Secure live preview design

Directus supports split-screen live preview for Nuxt; see [Directus Live Preview](https://directus.com/features/live-preview) and the [Nuxt guide](https://docs.directus.io/guides/headless-cms/live-preview/nuxt-3).

The production implementation must not follow examples that grant public read access to drafts. Use this flow:

1. Directus opens an allowlisted Nuxt preview URL for the collection/item/version/locale.
2. The initial request includes a rotatable preview bootstrap secret known only to Directus and the Nuxt Worker.
3. Nuxt validates the secret, establishes a short-lived sealed `HttpOnly`, `Secure`, `SameSite=Lax` preview cookie, and redirects to a clean URL without the secret.
4. The preview page fetches the requested draft/version server-side using a private, read-only Directus preview token.
5. Preview responses use `Cache-Control: private, no-store`, emit `X-Robots-Tag: noindex, nofollow`, and are excluded from sitemap/canonical output.
6. The preview session expires after 30 minutes and cannot access arbitrary collections, IDs, or fields outside a strict allowlist.
7. Save events refresh the relevant Nuxt data without publishing. Target preview refresh is three seconds or less after a Directus save.

The preview bootstrap secret is acceptable for this public-marketing content only if it is stripped immediately, excluded from logs, rate-limited, and rotated on suspected disclosure. If future CMS content contains customer, applicant, or regulated data, replace this mechanism with identity-bound preview authorization before storing that data.

## 8. Nuxt integration design

### New server boundary

Add:

- `server/utils/directus.ts`: server-only REST client, authentication headers, timeouts, error classification, and allowlisted query construction.
- `server/utils/cms-normalizers.ts`: converts Directus relations/translations/files into the flat shapes existing components expect.
- `server/utils/cms-cache.ts`: locale/collection cache keys, 60-second freshness, and stale-on-fetch-error handling.
- `server/api/cms/[collection].get.ts`: allowlisted published-content endpoint used by universal Nuxt composables; reject arbitrary Directus filters.
- `server/api/cms/preview.get.ts`: validates the preview bootstrap, creates the sealed preview session, and redirects.
- `server/api/cms/revalidate.post.ts`: optional signed Directus webhook that invalidates affected collection/locale keys.

Private runtime values:

- `NUXT_CMS_URL`
- `NUXT_CMS_READ_TOKEN`
- `NUXT_CMS_PREVIEW_TOKEN`
- `NUXT_CMS_PREVIEW_SECRET`
- `NUXT_CMS_WEBHOOK_SECRET`

Only the CMS URL may be public if needed for asset URLs. All tokens and secrets are Worker secrets, never committed to `wrangler.jsonc` or exposed through `runtimeConfig.public`.

### Frontend adapter

Add:

- `app/types/cms.ts`: explicit interfaces replacing `Collections[...]` types from `@nuxt/content`.
- `app/composables/useCms.ts`: typed calls to the Nuxt CMS endpoint with locale-aware `useAsyncData` keys.

Rewrite the internals of `usePageContent`, `useProductList`, and `useAboutContent` without changing their component-facing return shapes. Then replace every remaining direct `queryCollection()` call. Locale switches must retain the `watch: [locale]` behavior already present in `app/composables/usePageContent.ts:9-16` and `app/composables/useProducts.ts:14-23`.

For Markdown bodies, first test whether the existing renderer can accept normalized Markdown without retaining all of `@nuxt/content`. If it cannot, choose and explicitly approve a renderer before decommissioning `@nuxt/content`; do not silently render untrusted HTML with `v-html`.

### Caching and publication latency

- Cache published collection responses by collection, locale, slug/key, and relevant list filters.
- Fresh TTL: 60 seconds.
- On Directus timeout/5xx, serve an available stale response and emit an observable warning.
- Apply a strict upstream timeout rather than letting Directus latency consume the entire Worker request budget.
- A signed publish webhook may purge affected keys, but correctness must not depend on webhook delivery; TTL remains the fallback.
- Preview responses bypass all public caches.

## 9. Schema, migration, and backup artifacts

Create and version:

- `directus/schema.yaml`: Directus schema snapshot, display configuration, field interfaces, and relations.
- `directus/README.md`: supported Directus version, applying a snapshot, role setup, secrets, backup/restore, and upgrade procedure.
- `scripts/directus-seed.mjs`: idempotent one-time importer for content and media.
- `scripts/check-directus-content.mjs`: read-only validation of counts, parity, slugs, status, required fields, and relations.
- `scripts/export-directus-content.mjs`: portable JSON export used for backup/audit and migration rollback.

The seed process must:

1. Run the existing `npm run check:content` first.
2. Parse all 70 source files and Markdown bodies.
3. Create `mn` and `en` language records.
4. Create base records once per shared slug/key, then attach both translations.
5. Upload only content-controlled images, deduplicated by checksum; keep decorative UI assets in the repository.
6. Resolve image paths to Directus file IDs.
7. Resolve product/service relations in a second pass after all base records exist.
8. Import all records as drafts into staging.
9. Compare normalized Directus output against normalized source fixtures.
10. Publish only after count, relation, locale, route, and visual checks pass.

The importer must be idempotent by stable slug/key plus locale and support `--dry-run`. It must not duplicate media or content when rerun.

## 10. Execution phases

### Phase 0 — Baseline and go/no-go gates (0.5 day)

- Confirm total Studio users, collection accounting, hosting profile, region, monthly budget, backup retention, and owner.
- Run `npm run check:content` and `npm run build` on the current implementation.
- Record the 70-file inventory, current sitemap URLs, page titles/meta, and representative screenshots for both locales.
- Tag or otherwise record the last known-good Nuxt Studio deployment.

Exit criteria: all five gates in Section 1 pass and baseline evidence is stored.

### Phase 1 — Directus staging foundation and proof of concept (1 day)

- Provision staging Directus and persistent database/media storage.
- Pin the Directus version and capture `directus/schema.yaml`.
- Create languages and only the `news`/`news_translations` model initially.
- Configure Administrator, Publisher, and Editor policies.
- Implement a minimal Nuxt server fetch path and secure live preview for one news article.
- Verify editor draft/version behavior, publisher promotion, draft confidentiality, bilingual preview, and preview refresh latency.

Exit criteria: the preview proof gate succeeds without granting public draft access or Editor publish access.

### Phase 2 — Complete schema and migration tooling (1–1.5 days)

- Build the remaining collections, translations, repeaters, conditional fields, relations, validation, and preview URLs.
- Keep the measured custom-collection count at or below 20.
- Implement dry-run/idempotent seed, export, and validation scripts.
- Seed all content and controlled media into staging as drafts.
- Validate 35 base records, 70 translations, all relations, media references, and required fields.

Exit criteria: staging validation reports zero parity, relation, slug, or required-field failures.

### Phase 3 — Hybrid Nuxt integration (1–1.5 days)

- Implement the server-only Directus client, normalizers, public CMS API, cache, and preview session.
- Switch news and jobs first while the remaining collections continue using `@nuxt/content`.
- Verify routes, sitemap entries, Markdown rendering, locale switching, cache behavior, and Directus failure behavior.
- Switch products, services, branches, legal, and pages after the first wave is stable.
- Keep return shapes stable so components do not require unrelated rewrites.

Exit criteria: no production route has a direct `queryCollection()` dependency except the still-explicit rollback path.

### Phase 4 — Role UAT and production cutover (1 day)

- Have each actual role perform its acceptance scenario in staging.
- Freeze Nuxt Studio edits for the cutover window.
- Rerun source validation, reseed/upsert final changes, validate counts, then publish Directus content.
- Deploy the Nuxt Directus integration with a feature flag allowing a rapid switch back to Nuxt Content.
- Prewarm major routes and observe Directus errors, Worker errors, latency, cache hits, and missing assets.
- Keep Nuxt Studio/content available but read-only during the stabilization window.

Exit criteria: all acceptance criteria in Section 12 pass in production for at least two business days.

### Phase 5 — Decommission and simplify (0.5 day)

After the stabilization window:

- Remove `nuxt-studio` configuration and GitHub OAuth variables (`nuxt.config.ts:28-42`, `wrangler.jsonc:33`).
- Remove all `queryCollection()` calls and `Collections[...]` types.
- Remove `@nuxt/content`, `nuxt-studio`, `better-sqlite3`, and—if no other use remains—`@nuxthub/core`.
- Remove the D1 content configuration/binding (`nuxt.config.ts:171-186`, `wrangler.jsonc:36-43`).
- Archive the original `content/` tree and migration export in the release artifact before removing it from the runtime repository.
- Replace `scripts/check-content.mjs` with `scripts/check-directus-content.mjs` in the build/CI path.
- Update `.env.example`, `README.md`, deployment documentation, and editor instructions.
- Run dependency pruning, lint/static checks available in the repository, content validation, and the production build.

Exit criteria: the application builds and runs without Nuxt Studio, `@nuxt/content`, NuxtHub database support, or D1 content storage.

Estimated engineering effort: **5–6 developer-days**, excluding vendor procurement, DNS, editor scheduling, and any custom Directus extension required by the preview proof.

## 11. Rollback plan

- Do not delete or mutate the original `content/` files during migration.
- Keep each frontend wave behind `NUXT_CMS_PROVIDER=directus|nuxt-content` until stabilization completes.
- Use idempotent imports so staging can be rebuilt without manual repair.
- Before production cutover, export Directus schema, content JSON, PostgreSQL backup, and media manifest.
- If production correctness, authorization, or availability fails, switch the provider flag back to `nuxt-content` and redeploy the last known-good Worker.
- Do not decommission D1, Studio OAuth, packages, or content files until the two-business-day production stabilization window passes.
- After decommissioning, rollback requires restoring the tagged pre-cutover release; document this in the release notes.

## 12. Testable acceptance criteria

### Content and rendering

- Directus contains exactly 35 base records with 70 translations: 14 products, 6 news, 6 pages, 4 branches, 2 jobs, 2 legal pages, and 1 service, each with `mn` and `en`.
- Every pre-migration public route returns the same status code, canonical path, locale, title, core copy, and content-controlled media after cutover.
- Product audience/order, related products, service relations, branch coordinates, job application schemas, news dates, and page repeaters match their source values.
- Locale switching refreshes content without stale cross-locale data.
- Sitemap includes every published product, service, job, and news route in both locales and excludes drafts/archives.
- Public API responses never include draft, archived, or unpublished version data.

### Roles and workflow

- Administrator can configure schema, accounts, and all content.
- Publisher can publish, archive, restore, compare, and promote versions but cannot configure schema or accounts.
- Editor can create/edit/preview drafts and versions but receives a denied response when attempting to publish, archive, promote, delete permanently, or change role/schema settings.
- An Editor change to a published item remains invisible on the public site until Publisher promotion.
- Audit information identifies the account that created, edited, promoted, published, or archived content.

### Preview and security

- Directus displays the correct Nuxt page beside the editing form for every public content type.
- A saved draft/version change appears in preview within three seconds without becoming public.
- Preview works for both `mn` and `en` and for desktop/mobile viewport modes.
- Invalid, expired, replayed after expiry, or missing preview credentials return 401/403.
- Preview URLs are noindex, private/no-store, absent from sitemap, and contain no Directus API token.
- Direct unauthenticated Directus requests cannot read drafts or versions.

### Performance and resilience

- Published changes become public within 60 seconds even if the webhook is not delivered.
- Cached CMS endpoint p95 latency remains below 150 ms at the Worker in the agreed test region; uncached upstream latency is recorded separately rather than hidden.
- A Directus timeout or 5xx returns an available stale cached response instead of a 500; if no cached response exists, the endpoint fails closed and emits an actionable error.
- Directus tokens and preview/webhook secrets are absent from client bundles, HTML payloads, repository files, logs, and error responses.

### Build and operations

- `npm run check:content` and `npm run build` pass before migration; the replacement Directus validation and `npm run build` pass after decommissioning.
- The final repository has zero `queryCollection(` references and no runtime imports from `@nuxt/content`.
- Schema snapshot restore, content export, database restore, and media restore procedures are documented and tested in staging.
- Production monitoring identifies Directus availability, upstream error rate, Worker CMS endpoint error rate, cache status, and preview authorization failures.

## 13. Verification sequence

Run dependent checks in this order:

1. Source content validation and baseline build.
2. Directus schema count and snapshot reproducibility.
3. Seed dry-run, staging import, second idempotent import, and count/parity validation.
4. Role tests using three separate accounts.
5. Preview authorization and live-refresh tests.
6. Adapter contract comparison against source fixtures.
7. Route/sitemap/SEO checks for both locales.
8. Representative visual comparisons: home, about, product listing/detail, news listing/detail, careers listing/detail, branches, service, and legal.
9. Cache TTL, invalidation, Directus timeout, and stale-response tests.
10. Production build and Cloudflare staging deployment.
11. Editor UAT.
12. Production cutover, prewarming, smoke tests, and two-business-day observation.
13. Only then remove the old CMS path and rerun the complete verification set.

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Core seat limit is exceeded by the administrator plus editors | Gate the project before provisioning; do not share accounts; compare Strapi Growth before buying Directus Team |
| Deep relational modeling exceeds 25 collections | Keep nested leaf structures in typed JSON repeaters; enforce a 20-collection internal ceiling |
| JSON repeaters provide poor editor UX | Prototype Home/About/Product editing in Phase 1–2; use groups, summaries, descriptions, and conditional fields; do not proceed without editor UAT |
| Editor can accidentally modify published main content | Require content versions for changes to published records and prove permissions before bulk migration |
| Draft preview leaks unpublished content | Server-side preview token, short sealed session, allowlist, no-store/noindex, rate limiting, secret rotation |
| Directus outage affects SSR | 60-second edge cache, stale-on-error response, upstream timeout, monitoring; optionally add a durable last-known-good snapshot after launch |
| Directus region is slow from Ulaanbaatar or Cloudflare | Measure editor and uncached API latency before purchase; choose the nearest viable region; public traffic remains cached at Cloudflare |
| Translation parity drifts | Publish validation/Flow plus `check-directus-content` parity check; block initial cutover until both translations exist |
| Media URLs or transforms break existing layouts | Upload/deduplicate with manifest, normalize all file URLs in one adapter, visually verify crops/aspect ratios |
| Schema is changed manually without source control | Treat `directus/schema.yaml` as authoritative; snapshot every approved schema change and review the diff |
| Migration changes component behavior | Preserve adapter return shapes and migrate in waves; component redesign is explicitly out of scope |
| Cloudflare cache invalidation is unreliable | TTL is the correctness fallback; webhook only accelerates visibility |

## 15. Deliverables

- Approved Directus hosting/plan decision record.
- Staging and production Directus projects.
- Version-controlled Directus schema snapshot and operational README.
- Admin/Publisher/Editor roles and accounts.
- Secure bilingual live preview.
- Migration, validation, export, and restore tooling.
- Nuxt server CMS boundary, normalizers, cache, and webhook endpoint.
- All frontend and sitemap queries migrated.
- Editor guide covering draft, preview, review, publish, archive, translation, and media workflows.
- Production verification report and rollback record.
- Removal of Nuxt Studio, `@nuxt/content`, D1 content storage, and obsolete configuration after stabilization.

## 16. Open decisions to close at Phase 0

1. Do the stated two to three users include the technical Administrator account?
2. Managed Directus Cloud or self-hosted Docker/PostgreSQL?
3. Required backup frequency and retention.
4. CMS/asset region and custom CMS domain.
5. Whether English must block every future publication or may temporarily fall back to Mongolian.
6. Whether Publisher may permanently delete content/media or only archive it; this plan defaults to archive-only.
7. Whether a durable last-known-good snapshot is required beyond edge stale-cache behavior.

## 17. External references

- [Directus pricing](https://directus.com/pricing)
- [Directus roles, policies, and permissions](https://docs.directus.io/user-guide/user-management/users-roles-permissions)
- [Directus permissions API model](https://docs.directus.io/reference/system/permissions)
- [Directus content translations](https://docs.directus.io/guides/headless-cms/content-translations)
- [Directus content versioning](https://docs.directus.io/guides/headless-cms/content-versioning)
- [Directus live preview](https://directus.com/features/live-preview)
- [Directus live preview with Nuxt](https://docs.directus.io/guides/headless-cms/live-preview/nuxt-3)
- [Directus Docker deployment](https://docs.directus.io/self-hosted/docker-guide)
- [Directus storage and self-hosted configuration](https://docs.directus.io/self-hosted/config-options)

