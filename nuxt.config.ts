import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    'nuxt-auth-utils',
    'motion-v/nuxt',
  ],

  // nuxt-auth-utils reads OAuth creds from NUXT_OAUTH_GOOGLE_* and the session
  // secret from NUXT_SESSION_PASSWORD (set as Cloudflare secrets in prod).
  runtimeConfig: {
    oauth: {
      google: {
        clientId: '',
        clientSecret: '',
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
