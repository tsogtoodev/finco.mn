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
    'motion-v/nuxt',
  ],

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

  // Canonical site identity — drives @nuxtjs/seo (sitemap, canonical, og,
  // hreflang) and i18n baseUrl. URL is overridable via NUXT_PUBLIC_SITE_URL.
  site: {
    url: 'https://finco.mn',
    name: 'finco.mn',
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
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://finco.mn',
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
  },

  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',

  // NuxtHub (Cloudflare) — D1 database backs @nuxt/content in production.
  hub: {
    database: true,
  },

  // @nuxt/content runs on the Cloudflare D1 binding provided by NuxtHub.
  // (@nuxthub/core sets the Cloudflare nitro preset automatically.)
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
    // Nuxt Studio: enables live editing/preview. Connect the GitHub repo at
    // https://nuxt.studio to manage content/ markdown + media via the CMS.
    preview: {
      api: 'https://api.nuxt.studio',
    },
  },
})
