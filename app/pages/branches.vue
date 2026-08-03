<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Branches — interactive: selectable list drives a photo + an animated map.
// Light/centered header; the nav stays in its SOLID/light mode (page default).
const { locale, t } = useI18n()

const page = await usePageContent('branches')

const provider = useCmsProvider()
const { data: branches } = await useAsyncData(
  () => `branches-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['branches'][]>('branches', { locale: locale.value })
      : queryCollection('branches')
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

    <section v-if="branches?.length" class="pb-[120px] pt-[96px]">
      <div :style="{ '--carousel-edge': 'max(1.5rem, calc((100vw - 1200px) / 2))' }">
        <BranchesCarousel :branches="branches" />
      </div>
    </section>
  </div>
</template>
