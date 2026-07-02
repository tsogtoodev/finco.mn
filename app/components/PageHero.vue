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
    class="relative overflow-hidden"
    :class="dark ? 'bg-dark text-white' : 'bg-secondary text-foreground'"
  >
    <div v-if="dark" class="pointer-events-none absolute inset-0 opacity-60">
      <div class="absolute -left-20 top-0 size-80 rounded-full bg-primary/40 blur-[100px]" />
      <div class="absolute -right-10 bottom-0 size-72 rounded-full bg-accent/30 blur-[100px]" />
    </div>

    <!-- dark heroes sit under the transparent overlay nav (60px); add top clearance -->
    <div
      class="relative mx-auto max-w-7xl px-4"
      :class="dark ? 'pb-16 pt-28 sm:pb-20 sm:pt-32' : 'py-16 sm:py-20'"
    >
      <nav
        v-if="breadcrumb?.length"
        class="mb-5 flex items-center gap-2 text-sm"
        :class="[dark ? 'text-white/60' : 'text-muted-foreground', centered && 'justify-center']"
      >
        <template v-for="(c, i) in breadcrumb" :key="i">
          <NuxtLink v-if="c.to" :to="localePath(c.to)" class="hover:text-primary">{{ c.label }}</NuxtLink>
          <span v-else>{{ c.label }}</span>
          <Icon v-if="i < breadcrumb.length - 1" name="lucide:chevron-right" class="size-4" />
        </template>
      </nav>

      <button
        v-if="back"
        type="button"
        class="mb-8 inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius)] bg-secondary px-4 text-sm font-medium text-[#171717] transition-colors hover:bg-white"
        :class="centered && 'mx-auto'"
        @click="goBack"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        {{ t('common.back') }}
      </button>

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
          class="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl"
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
    </div>
  </section>
</template>
