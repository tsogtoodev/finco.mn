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
        // No Spline CDN hints: every `.splinecode` is vendored into
        // `public/spline` (see scripts/sync-spline.mjs) and served same-origin,
        // so the connection is already open by the time a scene loads.
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

  runtimeConfig: {
    cmsUrl: '', // NUXT_CMS_URL
    cmsToken: '', // NUXT_CMS_TOKEN
    cmsMediaUrl: '', // NUXT_CMS_MEDIA_URL
    cmsPreviewToken: '', // NUXT_CMS_PREVIEW_TOKEN
    cmsPreviewSecret: '', // NUXT_CMS_PREVIEW_SECRET
    cmsWebhookSecret: '', // NUXT_CMS_WEBHOOK_SECRET
    public: {
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

  css: ['lenis/dist/lenis.css', '~/assets/css/main.css'],

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

  icon: {
    customCollections: [{ prefix: 'f', dir: './app/assets/svg' }],
  },

  site: {
    url: 'https://finco.design',
    name: 'finco.design',
    defaultLocale: 'mn',
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/**/careers/exam'],
  },

  image: {
    providers: {
      cloudflareAuto: {
        provider: '~/providers/cloudflare-auto.ts',
        options: {
          baseURL: 'https://finco.design',
        },
      },
    },
    quality: 100,
    domains: ['cms.finco.design', 'media.finco.design'],
  },
  $development: { image: { provider: 'ipx' } },
  $production: { image: { provider: 'cloudflareAuto' } },

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'mn',
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
    optimizeDeps: {
      include: ['@splinetool/runtime'],
    },
  },

  experimental: {
    prefetchPreloadTags: true,
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-01-01',

  nitro: {
    preset: 'cloudflare-module',
  },

  routeRules: {
    '/mn': PAGE_CACHE,
    '/en': PAGE_CACHE,
    '/mn/**': PAGE_CACHE,
    '/en/**': PAGE_CACHE,
    '/mn/careers/exam': { cache: false },
    '/en/careers/exam': { cache: false },
    '/videos/**': {
      headers: { 'cache-control': 'public, max-age=2592000' },
    },
  },

  hub: {
    database: true,
    cache: true,
  },

  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
  },

  // Editors write prose in Directus' plain markdown box and expect a single
  // Enter to break the line — but CommonMark collapses a lone newline into a
  // space, so those breaks silently vanished (e.g. the sub-headings in the
  // beep-terms article merged into the paragraph below them). remark-breaks
  // turns every soft break into a real <br>. @nuxt/content merges these
  // remarkPlugins into its own build-time markdown pipeline, so this covers
  // both the /content files and the parseMarkdown() calls in
  // server/utils/cms-normalizers.ts.
  mdc: {
    remarkPlugins: {
      'remark-breaks': {},
    },
  },
})
