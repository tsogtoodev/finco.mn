<script setup lang="ts">
// Branches — selectable list + photo + static map.
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
    <PageHero
      :eyebrow="page?.hero?.eyebrow"
      :title="page?.hero?.headline"
      :subtitle="page?.hero?.subheadline"
      :breadcrumb="[{ label: t('nav.home'), to: '/' }, { label: page?.hero?.headline ?? t('nav.branches') }]"
    />

    <section class="mx-auto max-w-7xl px-4 py-16">
      <BranchExplorer v-if="branches?.length" :branches="branches" />
    </section>
  </div>
</template>
