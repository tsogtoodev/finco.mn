<script setup lang="ts">
definePageMeta({
  middleware: [
    async () => {
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
