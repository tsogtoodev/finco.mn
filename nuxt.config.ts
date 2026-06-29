import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    'nuxt-auth-utils',
    'nuxt-studio',
    'motion-v/nuxt',
  ],

  // Nuxt Studio v2 (self-hosted CMS). Editors visit /_studio on the deployed
  // site and sign in via a GitHub OAuth app (STUDIO_GITHUB_CLIENT_ID/SECRET);
  // edits commit to this repo's `main`, which triggers a redeploy.
  studio: {
    repository: {
      provider: 'github',
      owner: 'tsogtoodev',
      repo: 'finco.mn',
      branch: 'main',
    },
  },

  // Firebase = identity provider (client SDK). The server verifies its ID
  // tokens with `jose` and mints a sealed-cookie session via nuxt-auth-utils
  // (session secret = NUXT_SESSION_PASSWORD, a Cloudflare secret in prod).
  // Firebase web config is public; values come from NUXT_PUBLIC_FIREBASE_*.
  runtimeConfig: {
    public: {
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

  css: ['~/assets/css/main.css'],

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

  // NuxtHub — enables the raw Cloudflare D1 binding (`DB`) that @nuxt/content
  // queries. (Not hub.db, which is NuxtHub's Drizzle ORM layer we don't use.)
  // The remote D1 binding/id is declared in wrangler.jsonc for direct deploys.
  hub: {
    database: true,
  },

  // @nuxt/content runs on the Cloudflare D1 binding provided by NuxtHub.
  // (Studio v2 is configured above via the `studio` key — not content.preview,
  // which was the deprecated v1 hosted approach.)
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
  },
})
