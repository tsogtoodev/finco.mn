<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ leader: NonNullable<Collections['pages']['leadership']> }>()
</script>

<template>
  <div class="grid items-stretch gap-6 lg:grid-cols-2">
    <div class="overflow-hidden rounded-[1.25rem] bg-secondary">
      <img
        v-if="leader.photo"
        :src="leader.photo"
        :alt="leader.name"
        class="size-full object-cover"
        loading="lazy"
      >
    </div>
    <div class="flex flex-col justify-center rounded-[1.25rem] bg-dark p-8 text-white sm:p-10">
      <Icon name="lucide:quote" class="size-8 text-teal" />
      <p v-if="leader.quote" class="mt-5 font-display text-xl font-medium leading-relaxed">
        {{ leader.quote }}
      </p>
      <div class="mt-8">
        <div class="font-display font-semibold">{{ leader.name }}</div>
        <div class="text-sm text-white/60">{{ leader.role }}</div>
      </div>
    </div>
  </div>
</template>
