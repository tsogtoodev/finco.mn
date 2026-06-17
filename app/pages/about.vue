<script setup lang="ts">
// About — story timeline, leadership, team (uses the Figma portrait assets).
const { t } = useI18n()
const page = await usePageContent('about')

const story = computed(() =>
  (page.value?.timeline ?? []).map(m => ({ label: m.year, title: m.title, body: m.body })),
)

useSeoMeta({
  title: () => page.value?.hero?.headline ?? t('nav.about'),
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

    <!-- Story -->
    <section v-if="story.length" class="mx-auto max-w-3xl px-4 py-20">
      <h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ t('about.story') }}
      </h2>
      <div class="mt-10">
        <Timeline :items="story" orientation="vertical" />
      </div>
    </section>

    <!-- Leadership -->
    <section v-if="page?.leadership" class="mx-auto max-w-5xl px-4 py-12">
      <h2 class="mb-8 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ t('about.leadership') }}
      </h2>
      <LeadershipProfile :leader="page.leadership" />
    </section>

    <!-- Team -->
    <section v-if="page?.team?.length" class="mx-auto max-w-5xl px-4 py-20">
      <h2 class="mb-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ t('about.team') }}
      </h2>
      <TeamList :members="page.team" />
    </section>
  </div>
</template>
