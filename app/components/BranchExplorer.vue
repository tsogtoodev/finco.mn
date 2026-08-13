<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{ branches: Collections['branches'][] }>()
const { t } = useI18n()

const activeSlug = ref(props.branches[0]?.slug)
const active = computed(
  () => props.branches.find(b => b.slug === activeSlug.value) ?? props.branches[0]!,
)
</script>

<template>
  <div
    class="grid gap-6 lg:grid-cols-[minmax(0,1.94fr)_minmax(0,1fr)_minmax(0,2fr)] lg:gap-6"
  >
    <ul class="flex flex-col gap-[19px]">
      <BranchListItem
        v-for="b in branches"
        :key="b.slug"
        :branch="b"
        :active="b.slug === activeSlug"
        @select="activeSlug = b.slug"
      />
    </ul>

    <div
      v-if="active"
      class="relative h-72 overflow-hidden rounded-[24px] bg-muted lg:h-full"
    >
      <Transition name="branch-fade" mode="out-in">
        <NuxtImg
          v-if="active.photo"
          :key="active.slug"
          :src="active.photo"
          :alt="t('branchesPage.photoAlt', { name: active.name })"
          width="415"
          height="606"
          class="size-full object-cover"
          sizes="sm:100vw md:50vw lg:280px"
        />
        <div v-else :key="active.slug" class="size-full bg-gradient-to-br from-primary/20 via-accent/15 to-teal/20" />
      </Transition>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <span class="text-sm font-semibold text-white">{{ active.caption || active.name }}</span>
      </div>
    </div>

    <MapEmbed
      v-if="active"
      class="h-80 lg:h-full"
      :map-image="active.mapImage"
      :pin="active.pin"
      :lat="active.coords.lat"
      :lng="active.coords.lng"
      :label="active.name"
      :aria-label="t('branchesPage.mapLabel', { name: active.name })"
    />
  </div>
</template>

<style scoped>
.branch-fade-enter-active,
.branch-fade-leave-active {
  transition: opacity 0.35s ease;
}
.branch-fade-enter-from,
.branch-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .branch-fade-enter-active,
  .branch-fade-leave-active {
    transition: none;
  }
}
</style>
