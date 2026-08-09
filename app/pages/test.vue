<script setup lang="ts">
definePageMeta({ transparentHeader: true })
const page = await usePageContent('home')

useSeoMeta({
  title: () => page.value?.hero?.headline ?? 'Finco Capital',
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <div class="relative">
      <div class="z-0 overflow-hidden bg-[#0a0a1a] lg:motion-safe:sticky lg:motion-safe:top-0">
        <HomeStats />
      </div>
      <div class="relative z-10">
        <HomeProducts />
      </div>
    </div>
    <HomeBeepV2 />
    <HomeFincoBiz />
  </div>
</template>
