<script setup lang="ts">
// Shared page header: optional breadcrumb + eyebrow + title + subtitle.
// `dark` renders the dark image-bg variant. `back` adds a "Буцах" pill and
// `centered` centers the title/subtitle (Figma 1:13610 breadcrumb-hero pattern).
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    dark?: boolean
    breadcrumb?: { label: string; to?: string }[]
    /** Show a "Back" pill below the breadcrumb (router.back, falls to home). */
    back?: boolean
    /** Center the title/subtitle block (1:13610 centered-title pattern). */
    centered?: boolean
  }>(),
  { dark: false, back: false, centered: false },
)
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

function goBack() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section
    class="relative overflow-hidden bg-[#F6F5FD] text-foreground"
  >
    <div
      class="relative mx-auto max-w-7xl px-4 py-[80px] flex flex-row items-center justify-between"
    >
      <AppButton variant="ghost" class="h-10 w-fit" @click="goBack">
        <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
        {{ t('common.back') }}
      </AppButton>

      <div :class="centered && 'text-center'">
        <BlurText
          v-if="eyebrow"
          :text="eyebrow"
          as="p"
          animate-by="words"
          :delay="45"
          class="text-sm font-semibold"
          :class="[dark ? 'text-teal' : 'text-accent', centered && 'justify-center']"
        />
        <BlurText
          :text="title ?? ''"
          as="h1"
          animate-by="words"
          :delay="60"
          :start-delay="0.08"
          class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[32px]"
          :class="centered ? 'mx-auto max-w-[700px] justify-center' : 'max-w-3xl'"
        />
        <BlurText
          v-if="subtitle"
          :text="subtitle"
          as="p"
          animate-by="words"
          :delay="20"
          :start-delay="0.16"
          class="mt-4 text-lg"
          :class="[dark ? 'text-white/70' : 'text-muted-foreground', centered ? 'mx-auto max-w-2xl justify-center' : 'max-w-2xl']"
        />
        <slot />
      </div>

      <div></div>
    </div>
  </section>
</template>
