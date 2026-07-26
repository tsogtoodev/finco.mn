<script setup lang="ts">
import type { NuxtError } from '#app'
import { ParticleStatus } from '@tsogtoodev/particle-glock';

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
      <ParticleStatus :code="error?.statusCode" preset="snap" color="#28303f" sound />

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
