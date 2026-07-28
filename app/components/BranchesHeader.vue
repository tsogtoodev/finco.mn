<script setup lang="ts">
// Light, centered page header for /branches (Figma 1:12836):
// a "Буцах" back pill top-left, a centered two-tone title + subtitle,
// over a faint, blurred map texture. Pairs with the nav's SOLID/light mode.
const props = defineProps<{
  title?: string
  /** Substring of `title` rendered in the accent colour. */
  accent?: string
  subtitle?: string
  mapTexture?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()

// Split the title so the accent substring can be coloured without retyping copy.
const parts = computed(() => {
  const title = props.title ?? ''
  const accent = props.accent
  if (!accent || !title.includes(accent)) return { lead: title, accent: '', tail: '' }
  const i = title.indexOf(accent)
  return { lead: title.slice(0, i), accent, tail: title.slice(i + accent.length) }
})

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfc]">
    <!-- faint blurred map texture -->
    <div
      v-if="mapTexture"
      class="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-cover bg-center opacity-[0.12] blur-[5px]"
      :style="{ backgroundImage: `url(${mapTexture})` }"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:pb-16">
      <!-- Back pill, secondary variant: filled, for this light surface. The dark
           photo heroes use `ghost` instead. -->
      <AppButton variant="secondary" class="h-10 w-fit" @click="goBack">
        <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
        {{ t('common.back') }}
      </AppButton>

      <div class="mx-auto mt-12 flex max-w-[760px] flex-col items-center gap-5 text-center">
        <h1 class="text-3xl font-medium tracking-tight text-[#141414] sm:text-[36px] sm:leading-[44px]">
          {{ parts.lead }}<span class="text-accent">{{ parts.accent }}</span>{{ parts.tail }}
        </h1>
        <p v-if="subtitle" class="text-base font-light tracking-[0.18px] text-black/60 sm:text-lg">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </section>
</template>
