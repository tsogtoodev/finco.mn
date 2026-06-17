<script setup lang="ts">
// Shared page header: optional breadcrumb + eyebrow + title + subtitle.
// `dark` renders the dark image-bg variant.
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    dark?: boolean
    breadcrumb?: { label: string; to?: string }[]
  }>(),
  { dark: false },
)
const localePath = useLocalePath()
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
      <nav v-if="breadcrumb?.length" class="mb-5 flex items-center gap-2 text-sm" :class="dark ? 'text-white/60' : 'text-muted-foreground'">
        <template v-for="(c, i) in breadcrumb" :key="i">
          <NuxtLink v-if="c.to" :to="localePath(c.to)" class="hover:text-primary">{{ c.label }}</NuxtLink>
          <span v-else>{{ c.label }}</span>
          <Icon v-if="i < breadcrumb.length - 1" name="lucide:chevron-right" class="size-4" />
        </template>
      </nav>

      <p v-if="eyebrow" class="text-sm font-semibold" :class="dark ? 'text-teal' : 'text-accent'">
        {{ eyebrow }}
      </p>
      <h1 class="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-4 max-w-2xl text-lg" :class="dark ? 'text-white/70' : 'text-muted-foreground'">
        {{ subtitle }}
      </p>
      <slot />
    </div>
  </section>
</template>
