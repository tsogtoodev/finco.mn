<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{ branches: Collections['branches'][] }>()

const activeSlug = ref(props.branches[0]?.slug)
const active = computed(() => props.branches.find(b => b.slug === activeSlug.value) ?? props.branches[0])
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Branch list -->
    <ul class="space-y-3">
      <li v-for="b in branches" :key="b.slug">
        <button
          type="button"
          class="w-full rounded-[var(--radius)] border p-5 text-left transition-colors"
          :class="b.slug === activeSlug ? 'border-primary bg-secondary' : 'border-input hover:border-primary/50'"
          @click="activeSlug = b.slug"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-display font-semibold text-foreground">{{ b.name }}</span>
            <Icon name="lucide:arrow-right" class="size-4 shrink-0 text-muted-foreground" />
          </div>
          <div
            v-if="b.slug === activeSlug"
            class="mt-3 space-y-1 text-sm text-muted-foreground"
          >
            <p v-if="b.hours">{{ b.hours }}</p>
            <p v-if="b.phone">{{ b.phone }}</p>
            <p>{{ b.address }}</p>
          </div>
        </button>
      </li>
    </ul>

    <!-- Photo + map -->
    <div v-if="active" class="space-y-4">
      <div class="relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-muted">
        <img
          v-if="active.photo"
          :src="active.photo"
          :alt="active.name"
          class="size-full object-cover"
          loading="lazy"
        >
        <div v-else class="size-full bg-gradient-to-br from-primary/20 via-accent/15 to-teal/20" />
        <span class="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {{ active.name }}
        </span>
      </div>
      <MapEmbed :lat="active.coords.lat" :lng="active.coords.lng" :label="active.name" />
    </div>
  </div>
</template>
