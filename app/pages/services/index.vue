<script setup lang="ts">
// There is a single trust service and no dedicated listing design, so /services
// redirects to the first service's detail page (ordered by `order`). The "Итгэлцэл"
// nav item therefore lands on the polished detail page. If more services are added
// later, replace this with a real listing built against its own design.
const { locale } = useI18n()
const localePath = useLocalePath()

const { data: first } = await useAsyncData(
  () => `services-first-${locale.value}`,
  () =>
    queryCollection('services')
      .where('locale', '=', locale.value)
      .order('order', 'ASC')
      .first(),
  { watch: [locale] },
)

if (first.value?.slug) {
  await navigateTo(localePath(`/services/${first.value.slug}`), { redirectCode: 301 })
} else {
  throw createError({ statusCode: 404, statusMessage: 'No services found', fatal: true })
}
</script>

<template>
  <div />
</template>
