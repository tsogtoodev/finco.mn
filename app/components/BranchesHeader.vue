<script setup lang="ts">
const props = defineProps<{
  title?: string
  accent?: string
  subtitle?: string
  mapTexture?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()

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
    <div
      v-if="mapTexture"
      class="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-cover bg-center opacity-[0.12] blur-[5px]"
      :style="{ backgroundImage: `url(${mapTexture})` }"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:pb-16">
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
