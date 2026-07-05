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

const isDev = import.meta.dev
const is404 = computed(() => props.error?.statusCode === 404)
const copy = computed(() => (is404.value ? 'errorPage.notFound' : 'errorPage.error'))

useSeoMeta({
  title: () => `${props.error?.statusCode ?? 500} — ${t(`${copy.value}.title`)}`,
})
</script>

<template>
  <NuxtLayout>
    <section class="mx-auto flex min-h-[calc(100svh-320px)] max-w-[696px] flex-col items-center justify-center px-4 py-20">
      <img
        v-if="is404"
        src="/images/error-404.svg"
        alt=""
        width="379"
        height="375"
        class="h-auto w-[min(379px,80vw)]"
        aria-hidden="true"
      />

      <div
        class="flex w-full flex-col items-center text-center"
        :class="is404 ? 'mt-12 gap-8' : 'gap-8'"
      >
        <div class="flex flex-col gap-6">
          <h1 class="font-display text-2xl font-bold text-dark/80">
            {{ t(`${copy}.title`) }}
          </h1>
          <p class="font-display text-base font-light leading-6 text-dark/80">
            {{ t(`${copy}.subtitle`) }}
          </p>
        </div>

        <!-- Dev aid only: surface the underlying message for non-404 crashes. -->
        <pre
          v-if="isDev && !is404 && error?.message"
          class="max-w-full overflow-x-auto rounded-[var(--radius)] bg-secondary px-4 py-3 text-left text-xs text-secondary-foreground"
        >{{ error.message }}</pre>

        <AppButton to="/" variant="outline" size="lg" class="h-12 bg-white px-6 text-dark">
          {{ t('errorPage.backHome') }}
        </AppButton>
      </div>
    </section>
  </NuxtLayout>
</template>
