<script setup lang="ts">
import type { Collections } from '@nuxt/content'

type Showcase = NonNullable<Collections['pages']['showcases']>[number]
const props = defineProps<{ showcase: Showcase }>()

const isDark = computed(() => props.showcase.theme === 'dark')
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-10">
    <MotionReveal
      class="relative overflow-hidden rounded-[1.5rem] px-8 py-14 ring-1 sm:px-14"
      :class="isDark ? 'bg-dark text-white ring-white/10' : 'bg-secondary text-foreground ring-black/5'"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full blur-[100px]"
        :class="isDark ? 'bg-teal/25' : 'bg-accent/20'"
      />
      <div class="relative grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span
            v-if="showcase.eyebrow"
            class="text-sm font-semibold"
            :class="isDark ? 'text-teal' : 'text-accent'"
          >
            {{ showcase.eyebrow }}
          </span>
          <h2 class="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {{ showcase.title }}
          </h2>
          <p
            v-if="showcase.body"
            class="mt-4 max-w-lg text-lg"
            :class="isDark ? 'text-white/70' : 'text-muted-foreground'"
          >
            {{ showcase.body }}
          </p>
          <AppButton
            v-if="showcase.cta"
            :to="showcase.cta.to"
            :variant="isDark ? 'accent' : 'primary'"
            size="lg"
            arrow
            class="mt-8"
          >
            {{ showcase.cta.label }}
          </AppButton>
        </div>
        <div class="relative hidden lg:block">
          <img
            v-if="showcase.image"
            :src="showcase.image"
            :alt="showcase.title"
            loading="lazy"
            class="ml-auto w-full max-w-md rounded-[1.25rem] object-cover"
          >
          <div
            v-else
            class="ml-auto aspect-video w-full rounded-[1.25rem] bg-gradient-to-br from-primary/30 via-accent/20 to-teal/30 ring-1"
            :class="isDark ? 'ring-white/10' : 'ring-black/5'"
          />
        </div>
      </div>
    </MotionReveal>
  </section>
</template>
