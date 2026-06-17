<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ members?: NonNullable<Collections['pages']['team']> }>()
</script>

<template>
  <ul v-if="members?.length" class="divide-y divide-input">
    <MotionReveal v-for="(m, i) in members" :key="i" :delay="i * 0.05" as="li">
      <div class="grid gap-4 py-6 sm:grid-cols-[16rem_1fr] sm:items-center">
        <div class="flex items-center gap-4">
          <img
            v-if="m.avatar"
            :src="m.avatar"
            :alt="m.name"
            class="size-14 shrink-0 rounded-full object-cover"
            loading="lazy"
          >
          <div>
            <div class="font-display font-semibold text-foreground">{{ m.name }}</div>
            <div class="text-sm text-primary">{{ m.role }}</div>
          </div>
        </div>
        <p v-if="m.bio" class="text-muted-foreground">{{ m.bio }}</p>
      </div>
    </MotionReveal>
  </ul>
</template>
