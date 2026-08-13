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

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
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
    cmsUrl: '',
    cmsToken: '',
    cmsMediaUrl: '',
    cmsPreviewToken: '',
    cmsPreviewSecret: '',
    cmsWebhookSecret: '',
    public: {
      cmsProvider: '',
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

  mdc: {
    remarkPlugins: {
      'remark-breaks': {},
    },
  },
})
