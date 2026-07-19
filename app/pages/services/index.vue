<script setup lang="ts">
// There is a single trust service and no dedicated listing design, so /services
// redirects to the first service's detail page (ordered by `order`). The "Итгэлцэл"
// nav item therefore lands on the polished detail page. If more services are added
// later, replace this with a real listing built against its own design.
//
// The redirect lives in route MIDDLEWARE, not setup: a navigateTo() awaited in
// setup cancels the in-flight navigation after the out-in page transition has
// started, which strands the previous page in the DOM while the URL updates.
// Middleware redirects the navigation before the page (and transition) mounts.
definePageMeta({
  middleware: [
    async () => {
      // Everything after the awaited query runs outside the Nuxt async context
      // on the server, so grab the instance up front and re-enter it for the
      // navigateTo/abortNavigation calls.
      const nuxtApp = useNuxtApp()
      const locale = nuxtApp.$i18n.locale.value
      const first =
        nuxtApp.$config.public.cmsProvider === 'directus'
          ? (await $fetch<{ slug: string }[]>('/api/cms/services', { query: { locale } }))[0]
          : await queryCollection('services')
              .where('locale', '=', locale)
              .order('order', 'ASC')
              .first()
      return nuxtApp.runWithContext(() => {
        if (!first?.slug) {
          return abortNavigation(createError({ statusCode: 404, statusMessage: 'No services found' }))
        }
        return navigateTo(nuxtApp.$localePath(`/services/${first.slug}`), { redirectCode: 301 })
      })
    },
  ],
})
</script>

<template>
  <div />
</template>
