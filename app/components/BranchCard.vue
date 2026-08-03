<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{ branch: Collections['branches'] }>()

const { t } = useI18n()

const mapsUrl = computed(
  () => `https://www.google.com/maps?q=${props.branch.coords.lat},${props.branch.coords.lng}`,
)
</script>

<template>
  <a
    :href="mapsUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="t('branchesPage.openInMaps') + ' — ' + branch.name"
    class="group flex flex-col gap-[10px] overflow-hidden rounded-[24px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)] transition-shadow duration-300 hover:shadow-[0_0_28px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
  >
    <div class="aspect-[600/360] w-full shrink-0 overflow-hidden bg-muted">
      <NuxtImg
        v-if="branch.photo"
        :src="branch.photo"
        :alt="t('branchesPage.photoAlt', { name: branch.name })"
        width="600"
        height="360"
        loading="lazy"
        sizes="90vw sm:600px"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
      <div v-else class="size-full bg-gradient-to-br from-primary/20 via-accent/15 to-teal/20" />
    </div>

    <div class="flex flex-1 flex-col justify-center gap-6 p-6">
      <div class="flex flex-col gap-4">
        <h3 class="line-clamp-2 text-[24px] font-semibold leading-[28px] tracking-[0.24px] text-accent">
          {{ branch.name }}
        </h3>
        <div class="flex flex-col gap-2 text-[16px] leading-[22px] tracking-[0.16px] text-black/60">
          <p v-if="branch.hours" class="truncate">{{ branch.hours }}</p>
          <p class="line-clamp-2">{{ branch.address }}</p>
        </div>
      </div>

      <div class="pointer-events-none flex">
        <span
          class="inline-flex items-center rounded-full bg-black/[0.03] px-4 py-2 transition-colors duration-200 group-hover:bg-black/[0.06] motion-reduce:transition-none"
        >
          <span class="px-1 text-sm leading-[18px] decoration-solid underline-offset-2 text-black/64">
            {{ t('branchesPage.findOnMap') }}
          </span>
        </span>
      </div>
    </div>
  </a>
</template>
