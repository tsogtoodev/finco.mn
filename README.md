# finco.mn

## Stack

- **Nuxt 4** (Vue 3, SSR) deployed to **Cloudflare Workers** (modern Static Assets via the `cloudflare-module` nitro preset)
- **@nuxt/content** — typed collections (products / services / branches / jobs / news / pages) backed by **Cloudflare D1** in production (`better-sqlite3` is local-dev only)
- **@nuxtjs/i18n** — `mn` (default) + `en`, both prefixed (`/mn`, `/en`), root redirects via cookie/browser detection
- **Tailwind CSS v4** (`@tailwindcss/vite`), **motion-v** for animation, **@number-flow/vue** for counters, Spline runtime for 3D scenes
- **Auth**: Firebase (client SDK) as identity provider; the server verifies ID tokens with `jose` and mints a sealed-cookie session via `nuxt-auth-utils`
- **@nuxtjs/seo** — sitemap (content-driven via `server/api/__sitemap__/urls`), canonical, og-image, hreflang

## Project layout

```
app/            pages, components, layouts, composables, data (nav/product config)
content/        @nuxt/content collections (md/yml) — the editable copy & catalog
i18n/locales/   mn.json / en.json UI strings
server/         API routes (auth session, sitemap, careers/exam stubs)
public/images/  optimized static assets
content.config.ts   collection schemas
wrangler.jsonc      Cloudflare Workers deploy config (D1 binding, public vars)
```

## Setup

```bash
npm install
cp .env.example .env   # fill in values — see comments in the file
```

Required env: `NUXT_SESSION_PASSWORD` (session sealing secret), `NUXT_PUBLIC_FIREBASE_*` (public web config), `STUDIO_GITHUB_*` (Studio OAuth), `NUXT_PUBLIC_SITE_URL`.

## Development

```bash
npm run dev    # http://localhost:3000
```

Content is served from a local SQLite database in dev; a floating Studio edit button is available (the `/_studio` route itself is production-only).

## Build & deploy

```bash
npm run build      # nitro cloudflare-module preset → .output/server + .output/public
npx wrangler deploy
```

Production deploys run through **Cloudflare Workers Builds** connected to the GitHub repo (build `npm run build`, deploy `npx wrangler deploy`). [wrangler.jsonc](wrangler.jsonc) declares the worker entry, `ASSETS` binding, public vars, and the D1 database binding (`DB`) that @nuxt/content queries.

Secrets are **not** committed — set them on the worker:

```bash
npx wrangler secret put NUXT_SESSION_PASSWORD
npx wrangler secret put STUDIO_GITHUB_CLIENT_SECRET
```
