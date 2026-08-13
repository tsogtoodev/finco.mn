<script setup lang="ts">
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
