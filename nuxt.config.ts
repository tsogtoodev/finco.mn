import tailwindcss from '@tailwindcss/vite'

const PAGE_CACHE = process.env.NODE_ENV === 'production'
  ? {
      cache: {
        maxAge: 300,
        swr: false,
        varies: ['cookie'],
      },
    }
  : {}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'preconnect', href: 'https://prod.spline.design', crossorigin: 'anonymous' },
        { rel: 'dns-prefetch', href: 'https://prod.spline.design' },
      ],
    },
    // Cross-page fade+rise (classes in main.css). `out-in` so the old page
    // finishes leaving before the new one enters — no layout overlap. The
    // layout transition covers default ↔ minimal switches, which would
    // otherwise swap with no animation at all.
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  modules: [
    '@nuxthub/core',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    'nuxt-auth-utils',
    'motion-v/nuxt',
    '@tsogtoodev/prelo/nuxt',
  ],

  // Firebase = identity provider (client SDK). The server verifies its ID
  // tokens with `jose` and mints a sealed-cookie session via nuxt-auth-utils
  // (session secret = NUXT_SESSION_PASSWORD, a Cloudflare secret in prod).
  // Firebase web config is public; values come from NUXT_PUBLIC_FIREBASE_*.
  runtimeConfig: {
    // Directus CMS boundary (server-only; see server/utils/directus.ts).
    // NUXT_CMS_TOKEN is the read-only api-reader token — published content only.
    // NUXT_CMS_MEDIA_URL (optional) = public R2 hostname; when set, media bytes
    // are served by Cloudflare instead of the Directus VPS.
    cmsUrl: '', // NUXT_CMS_URL
    cmsToken: '', // NUXT_CMS_TOKEN
    cmsMediaUrl: '', // NUXT_CMS_MEDIA_URL
    // Live preview (plan §7): PREVIEW_TOKEN reads drafts/versions (server-only);
    // PREVIEW_SECRET validates Directus's bootstrap request AND seals the
    // 30-minute preview session cookie. Rotate together via setup-preview.mjs.
    cmsPreviewToken: '', // NUXT_CMS_PREVIEW_TOKEN
    cmsPreviewSecret: '', // NUXT_CMS_PREVIEW_SECRET
    // Signed by the Directus "Purge site cache" Flow; lets publishes invalidate
    // the Worker CMS cache instantly instead of waiting out the TTL.
    cmsWebhookSecret: '', // NUXT_CMS_WEBHOOK_SECRET
    public: {
      // '' = @nuxt/content (current), 'directus' = the /api/cms boundary.
      // Flip per-environment via NUXT_PUBLIC_CMS_PROVIDER; rollback = unset.
      cmsProvider: '', // NUXT_PUBLIC_CMS_PROVIDER
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      },
    },
  },

  // lenis.css first — it only relaxes html/body height and marks nested
  // `data-lenis-prevent` scrollers, so main.css still wins on anything shared.
  css: ['lenis/dist/lenis.css', '~/assets/css/main.css'],

  // Geologica is a variable font (Thin 100 → Black 900). @nuxt/fonts otherwise
  // auto-fetches only weight 400, so font-light/medium/semibold/bold rendered as
  // faux-bolded 400 and looked off vs Figma. Subsets are left to the module
  // defaults (latin + cyrillic etc.) — cyrillic matters for the Mongolian
  // (default) locale.
  //
  // A RANGE ('100 900'), not nine discrete weights: the discrete list asks for
  // nine separate @font-face cuts per subset — up to 36 files across latin,
  // latin-ext, cyrillic and cyrillic-ext — where one variable file per subset
  // covers the whole axis. Same rendering, a fraction of the requests.
  fonts: {
    families: [
      {
        name: 'Geologica',
        provider: 'google',
        weights: ['100 900'],
        styles: ['normal'],
      },
    ],
  },

  // Local SVG icon set exported from Figma (cleaned, currentColor). Use as
  // <Icon name="f:fast-time" />. Bundled server-side by @nuxt/icon.
  icon: {
    customCollections: [{ prefix: 'f', dir: './app/assets/svg' }],
  },

  // Canonical site identity — drives @nuxtjs/seo (sitemap, canonical, og,
  // hreflang) and i18n baseUrl. URL is overridable via NUXT_PUBLIC_SITE_URL.
  site: {
    url: 'https://finco.design',
    name: 'finco.design',
    defaultLocale: 'mn',
  },

  // Feed content-driven detail routes (products/services/jobs) to the sitemap;
  // keep the noindex exam login out of it.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/**/careers/exam'],
  },

  // Image CDN — Cloudflare Image Transformations optimise the images served from
  // public/ at the edge (URLs become `{baseURL}/cdn-cgi/image/{mods}/{src}`), then
  // cache the resized/reformatted variants on Cloudflare. No upload step: public/
  // images ride along with the normal Workers deploy. baseURL tracks the site URL.
  // Requires "Transformations" enabled on the zone (dashboard → Images →
  // Transformations). The provider is set per-environment below.
  image: {
    // Custom provider = built-in Cloudflare Transformations + a default
    // `format=auto` (AVIF/WebP negotiation) that also bypasses SVGs.
    // See app/providers/cloudflare-auto.ts.
    providers: {
      cloudflareAuto: {
        provider: '~/providers/cloudflare-auto.ts',
        options: {
          // HARDCODED on purpose: this is baked into the client bundle at BUILD
          // time. Reading NUXT_PUBLIC_SITE_URL here once shipped a production
          // build with http://localhost:3000 image URLs (built on a dev machine
          // whose .env sets it for local SEO). The provider only runs in
          // $production, so the dev value is never legitimately needed.
          baseURL: 'https://finco.design',
        },
      },
    },
    quality: 80,
    // CMS media originates from these hosts (Directus assets / public R2 bind);
    // required for IPX (dev) to proxy remote images.
    domains: ['cms.finco.design', 'media.finco.design'],
  },
  // The /cdn-cgi/image endpoint only exists on the deployed Cloudflare zone, so
  // use IPX during local dev and the Cloudflare provider in production builds.
  $development: { image: { provider: 'ipx' } },
  $production: { image: { provider: 'cloudflareAuto' } },

  // Both locales prefixed (/mn, /en); root path resolves via detection.
  i18n: {
    strategy: 'prefix',
    defaultLocale: 'mn',
    // Absolute base for hreflang/canonical alternates (mirrors site.url).
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://finco.design',
    locales: [
      { code: 'mn', language: 'mn-MN', name: 'Монгол', file: 'mn.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'finco_locale',
      redirectOn: 'root',
      fallbackLocale: 'mn',
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle the Spline WebGL runtime so its first lazy import doesn't
    // trigger a dev-server dep re-optimization + full reload mid-session.
    optimizeDeps: {
      include: ['@splinetool/runtime'],
    },
  },

  // Forward destination-page preload hints (hero images via NuxtImg, etc.) when
  // a link is prefetched — pairs with nav hover prefetch in SiteHeader.
  experimental: {
    prefetchPreloadTags: true,
  },

  devtools: { enabled: true },
  // ≥ 2024-09-19 makes the cloudflare-module preset use modern Workers Static
  // Assets (ASSETS binding) instead of the legacy Workers Sites/KV approach.
  compatibilityDate: '2025-01-01',

  // Pin the modern Cloudflare Workers preset (Static Assets, ASSETS binding) so
  // `npm run build` in CI produces .output/server/index.mjs + .output/public for
  // `wrangler deploy`. NB: must be 'cloudflare-module' (hyphen) — the underscore
  // form 'cloudflare_module' aliases to the legacy Workers Sites/KV preset.
  nitro: {
    preset: 'cloudflare-module',
  },

  // Every public page is locale-prefixed (i18n `strategy: 'prefix'`), so these
  // four patterns cover the whole site. The bare `/` is deliberately absent:
  // server/middleware/geo-locale.ts turns it into a per-visitor 302 (cookie,
  // then CF-IPCountry), and caching that would pin one visitor's locale onto
  // everyone. It is a redirect, not a render, so it was never the expensive path.
  //
  // Publishing does not wait out the 300s: the Directus revalidate webhook
  // purges these entries alongside the CMS ones (server/api/cms/revalidate.post.ts).
  routeRules: {
    '/mn': PAGE_CACHE,
    '/en': PAGE_CACHE,
    // `/xx/**` does not match the bare `/xx` in the radix matcher, hence both.
    '/mn/**': PAGE_CACHE,
    '/en/**': PAGE_CACHE,
    // The exam login is a credential form behind its own auth flow, and noindex
    // besides. More specific rules win, so this overrides the globs above.
    '/mn/careers/exam': { cache: false },
    '/en/careers/exam': { cache: false },

    // Background video. Workers Static Assets already serves these from the edge
    // (verified in production: cf-cache-status HIT), but with no rule here they
    // fall back to its `max-age=0, must-revalidate` default, so every page view
    // spends a round trip revalidating an 11.9MB file that has not changed.
    //
    // No `immutable`, and not a year: these filenames are NOT content-hashed, so
    // a re-export under the same name would be invisible to anyone holding a
    // cached copy. 30 days covers repeat visits while a hard reload still
    // revalidates (and gets a cheap 304). If this ever needs a year + immutable,
    // hash the filename first.
    '/videos/**': {
      headers: { 'cache-control': 'public, max-age=2592000' },
    },
  },

  // NuxtHub — enables the raw Cloudflare D1 binding (`DB`) that @nuxt/content
  // queries. (Not hub.db, which is NuxtHub's Drizzle ORM layer we don't use.)
  // The remote D1 binding/id is declared in wrangler.jsonc for direct deploys.
  hub: {
    database: true,
    // KV-backed nitro cache storage, shared across Worker isolates. Without it
    // the CMS cache is per-isolate memory: SWR refreshes die when the isolate
    // suspends (stale-forever) and the revalidate webhook can't purge globally.
    cache: true,
  },

  // @nuxt/content runs on the Cloudflare D1 binding provided by NuxtHub.
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
  },
})
