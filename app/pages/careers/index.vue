<script setup lang="ts">
import type { Collections } from '@nuxt/content'

definePageMeta({ transparentHeader: true })

const { locale, t } = useI18n()

const page = await usePageContent('careers')

const provider = useCmsProvider()
const { data: jobs } = await useAsyncData(
  () => `jobs-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['jobs'][]>('jobs', { locale: locale.value })
      : queryCollection('jobs').where('locale', '=', locale.value).all(),
  { watch: [locale] },
)

const steps = computed(() =>
  (page.value?.timeline ?? []).map(s => ({ label: s.year, title: s.title })),
)

useSeoMeta({
  title: () => page.value?.hero?.headline ?? t('nav.careers'),
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <PageHero
      dark
      :eyebrow="page?.hero?.eyebrow"
      :title="page?.hero?.headline"
      :subtitle="page?.hero?.subheadline"
    />

    <section v-if="steps.length" class="mx-auto max-w-7xl px-4 py-20">
      <h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ t('careers.process') }}
      </h2>
      <div class="mt-12">
        <Timeline :items="steps" orientation="horizontal" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 pb-24">
      <div class="grid gap-12 lg:grid-cols-[20rem_1fr]">
        <div>
          <h2 class="font-display text-xl font-bold text-foreground">{{ t('careers.perks') }}</h2>
          <div class="mt-6">
            <PerksList :perks="page?.perks" />
          </div>
        </div>
        <div>
          <h2 class="font-display text-xl font-bold text-foreground">{{ t('careers.openRoles') }}</h2>
          <div class="mt-4">
            <JobListingItem v-for="j in jobs ?? []" :key="j.slug" :job="j" />
            <p v-if="!jobs?.length" class="py-6 text-muted-foreground">—</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
