<script setup lang="ts">
// Individual loan catalog — renders the shared ProductsListing with audience.
definePageMeta({ transparentHeader: true })

const { t } = useI18n()

useSeoMeta({
  title: () => t('productsPage.headline'),
  description: () => t('productsPage.intro.individual'),
})
</script>

<template>
  <ProductsListing audience="individual" />
</template>
