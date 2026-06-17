<script setup lang="ts">
// Content paths are locale-prefixed (/mn/..., /en/...) and match route.path 1:1.
const route = useRoute()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
})
</script>

<template>
  <ContentRenderer
    v-if="page"
    :value="page"
    class="prose mx-auto max-w-3xl px-4 py-16"
  />
</template>
