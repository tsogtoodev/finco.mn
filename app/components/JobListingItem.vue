<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ job: Collections['jobs'] }>()
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/careers/${job.slug}`)"
    class="group flex items-center justify-between gap-4 border-b border-input py-5 transition-colors hover:border-primary"
  >
    <div>
      <div v-if="job.department" class="text-xs font-medium text-muted-foreground">{{ job.department }}</div>
      <h3 class="mt-0.5 font-display font-semibold text-foreground transition-colors group-hover:text-primary">
        {{ job.title }}
      </h3>
      <div class="mt-1 text-sm text-muted-foreground">
        {{ [job.location, job.type].filter(Boolean).join(' · ') }}
      </div>
    </div>
    <span class="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
      {{ t('careers.apply') }}
      <Icon name="lucide:arrow-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
    </span>
  </NuxtLink>
</template>
