<script setup lang="ts">
// Site-wide error page (404 + 5xx). Rendered INSTEAD of app.vue, so it carries
// its own <NuxtLayout> (full chrome: header + footer) and repeats the locale
// head wiring app.vue normally provides. Errors auto-clear on navigation in
// Nuxt 4, so plain links/buttons are enough to leave the page.
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const head = useLocaleHead({ dir: true, lang: true })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs }))

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

const isDev = import.meta.dev
const is404 = computed(() => props.error?.statusCode === 404)
const copy = computed(() => (is404.value ? 'errorPage.notFound' : 'errorPage.error'))

useSeoMeta({
  title: () => `${props.error?.statusCode ?? 500} — ${t(`${copy.value}.title`)}`,
})

// Same fallback pattern as PageHero's back pill.
function goBack() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo(localePath('/'))
}

const quickLinks = [
  { key: 'nav.products', to: '/products', icon: 'lucide:wallet' },
  { key: 'nav.branches', to: '/branches', icon: 'lucide:map-pin' },
  { key: 'nav.news', to: '/news', icon: 'lucide:newspaper' },
  { key: 'nav.about', to: '/about', icon: 'lucide:building-2' },
]
</script>

<template>
  <NuxtLayout>
    <section class="relative overflow-hidden">
      <!-- Soft brand glows, light-bg twin of PageHero's dark variant blobs. -->
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -top-24 left-1/2 size-[420px] -translate-x-[80%] rounded-full bg-accent/10 blur-[110px]" />
        <div class="absolute -bottom-32 left-1/2 size-[380px] translate-x-1/4 rounded-full bg-teal/15 blur-[110px]" />
      </div>

      <div class="relative mx-auto grid min-h-[calc(100svh-320px)] max-w-7xl place-items-center px-4 py-20 sm:py-24">
        <div class="flex max-w-2xl flex-col items-center text-center">
          <p
            class="hero-rise font-display text-[clamp(96px,22vw,180px)] font-bold leading-none tracking-tight"
            aria-hidden="true"
          >
            <span class="bg-gradient-to-r from-primary via-accent to-teal bg-clip-text text-transparent">
              {{ error?.statusCode ?? 500 }}
            </span>
          </p>

          <BlurText
            :text="t(`${copy}.title`)"
            as="h1"
            animate-by="words"
            :delay="60"
            :start-delay="0.08"
            class="mt-6 justify-center font-display text-3xl font-bold tracking-tight sm:text-4xl"
          />
          <BlurText
            :text="t(`${copy}.subtitle`)"
            as="p"
            animate-by="words"
            :delay="20"
            :start-delay="0.16"
            class="mt-4 justify-center text-lg text-muted-foreground"
          />

          <!-- Dev aid only: surface the underlying message for non-404 crashes. -->
          <pre
            v-if="isDev && !is404 && error?.message"
            class="mt-6 max-w-full overflow-x-auto rounded-[var(--radius)] bg-secondary px-4 py-3 text-left text-xs text-secondary-foreground"
          >{{ error.message }}</pre>

          <div class="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3" style="animation-delay: 0.25s">
            <AppButton to="/" arrow>{{ t('errorPage.backHome') }}</AppButton>
            <AppButton variant="outline" @click="goBack">
              <Icon name="lucide:arrow-left" class="size-4" />
              {{ t('common.back') }}
            </AppButton>
          </div>

          <div class="hero-rise mt-12" style="animation-delay: 0.4s">
            <p class="text-sm font-semibold text-muted-foreground">{{ t('errorPage.quickLinksLabel') }}</p>
            <nav class="mt-4 flex flex-wrap justify-center gap-2">
              <NuxtLink
                v-for="link in quickLinks"
                :key="link.to"
                :to="localePath(link.to)"
                class="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                <Icon :name="link.icon" class="size-4" />
                {{ t(link.key) }}
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
