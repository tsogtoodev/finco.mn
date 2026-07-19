<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Job detail + data-driven application form.
definePageMeta({ transparentHeader: true })

const route = useRoute()
const { locale, t } = useI18n()
const slug = computed(() => route.params.slug as string)

const provider = useCmsProvider()
const { data: job } = await useAsyncData(
  () => `job-${locale.value}-${slug.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['jobs'] | null>('jobs', { locale: locale.value, slug: slug.value })
      : queryCollection('jobs')
          .where('locale', '=', locale.value)
          .where('slug', '=', slug.value)
          .first(),
  { watch: [locale, slug] },
)

if (!job.value) {
  throw createError({ statusCode: 404, statusMessage: 'Job not found', fatal: true })
}

useSeoMeta({
  title: () => job.value?.title,
  description: () => job.value?.summary,
})
</script>

<template>
  <div v-if="job">
    <PageHero
      dark
      :eyebrow="job.department"
      :title="job.title"
      :subtitle="job.summary"
      :breadcrumb="[{ label: t('nav.home'), to: '/' }, { label: t('nav.careers'), to: '/careers' }, { label: job.title }]"
    />

    <div class="mx-auto grid max-w-5xl gap-12 px-4 py-16 lg:grid-cols-2">
      <!-- Job info -->
      <div class="space-y-8">
        <div v-if="job.responsibilities?.length">
          <h2 class="font-display text-lg font-semibold text-foreground">{{ t('tabs.info') }}</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li v-for="(r, i) in job.responsibilities" :key="i">{{ r }}</li>
          </ul>
        </div>
        <div v-if="job.requirements?.length">
          <h2 class="font-display text-lg font-semibold text-foreground">{{ t('tabs.requirements') }}</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li v-for="(r, i) in job.requirements" :key="i">{{ r }}</li>
          </ul>
        </div>
      </div>

      <!-- Application -->
      <div>
        <h2 class="font-display text-lg font-semibold text-foreground">{{ t('careers.apply') }}</h2>
        <div class="mt-4">
          <ApplicationForm
            v-if="job.applicationSections?.length"
            :sections="job.applicationSections"
            :job-slug="job.slug"
          />
          <p v-else class="text-muted-foreground">—</p>
        </div>
      </div>
    </div>
  </div>
</template>
