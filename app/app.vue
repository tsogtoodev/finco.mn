<script setup lang="ts">
// Inject <html lang>, hreflang alternates and canonical per locale.
const head = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
}))

// Default social share image (bundled template). Branded templates land in Phase 7.
defineOgImageComponent('NuxtSeo', { title: 'finco.mn', description: 'Санхүүгийн шийдэл' })

// Site-wide structured data.
useSchemaOrg([
  defineOrganization({
    name: 'finco.mn',
    url: 'https://finco.mn',
    logo: '/favicon.ico',
  }),
  defineWebSite({ name: 'finco.mn' }),
])
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
