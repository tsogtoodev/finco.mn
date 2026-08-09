<script setup lang="ts">
// Inject <html lang>, hreflang alternates and canonical per locale.
const head = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
}))

// Default social share image (bundled template).
defineOgImageComponent('NuxtSeo', { title: 'finco.design', description: 'Санхүүгийн шийдэл' })

// Site-wide structured data.
useSchemaOrg([
  defineOrganization({
    name: 'finco.design',
    url: 'https://finco.design',
    logo: '/favicon.png',
  }),
  defineWebSite({ name: 'finco.design' }),
])

const isDev = import.meta.dev
</script>

<template>
  <NuxtRouteAnnouncer />
  <PreloStairs v-if="!isDev" text="Бүтээ, ирээдүйг эзэгнэ... Санхүүжүүлье!" background="#000000" :transparency="40" :blur="80" color="#ffffff" :z-index="100" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
