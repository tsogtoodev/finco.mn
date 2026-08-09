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
    <HomeBeepV2 />
    <HomeFincoBizV2 />
    <HomeNews />
  </div>
</template>
