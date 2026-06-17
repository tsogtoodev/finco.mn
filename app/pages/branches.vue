<script setup lang="ts">
// Branches — interactive: selectable list drives a photo + an animated map.
// Light/centered header; the nav stays in its SOLID/light mode (page default).
const { locale, t } = useI18n()

const page = await usePageContent('branches')

const { data: branches } = await useAsyncData(
  () => `branches-${locale.value}`,
  () =>
    queryCollection('branches')
      .where('locale', '=', locale.value)
      .order('order', 'ASC')
      .all(),
  { watch: [locale] },
)

useSeoMeta({
  title: () => page.value?.hero?.headline ?? t('nav.branches'),
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <BranchesHeader
      :title="page?.hero?.headline"
      :accent="page?.hero?.accent"
      :subtitle="page?.hero?.subheadline"
      map-texture="/images/branches/map-base.jpg"
    />

    <section class="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:pt-8">
      <BranchExplorer v-if="branches?.length" :branches="branches" />
    </section>
  </div>
</template>
