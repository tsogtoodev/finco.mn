<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ perks?: NonNullable<Collections['pages']['perks']> }>()
</script>

<template>
  <ul v-if="perks?.length" class="space-y-3">
    <li v-for="(p, i) in perks" :key="i" class="flex items-start gap-3">
      <Icon name="lucide:check" class="mt-0.5 size-5 shrink-0 text-teal" />
      <div>
        <span class="font-medium text-foreground">{{ p.title }}</span>
        <p v-if="p.body" class="text-sm text-muted-foreground">{{ p.body }}</p>
      </div>
    </li>
  </ul>
</template>
