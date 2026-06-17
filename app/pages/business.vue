<script setup lang="ts">
// Business loan catalog — renders the shared ProductsListing with audience.
definePageMeta({ transparentHeader: true })

const { t } = useI18n()

useSeoMeta({
  title: () => t('productsPage.headline'),
  description: () => t('productsPage.intro.business'),
})
</script>

<template>
  <ProductsListing audience="business" />
</template>
