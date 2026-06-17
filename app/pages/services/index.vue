<script setup lang="ts">
// Trust services index — backs the "Итгэлцэл" nav item. Overlay nav over a dark hero.
definePageMeta({ transparentHeader: true })

const { locale, t } = useI18n()
const localePath = useLocalePath()

const { data: services } = await useAsyncData(
  () => `services-index-${locale.value}`,
  () => queryCollection('services').where('locale', '=', locale.value).all(),
  { watch: [locale] },
)

useSeoMeta({ title: () => t('nav.services') })
</script>

<template>
  <div>
    <PageHero dark :eyebrow="t('nav.trust')" :title="t('nav.services')" />

    <section class="mx-auto max-w-7xl px-4 py-16">
      <div v-if="services?.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="s in services"
          :key="s.slug"
          :to="localePath(`/services/${s.slug}`)"
          class="group flex flex-col rounded-[--radius] p-6 ring-1 ring-black/5 transition-shadow hover:shadow-2xs"
        >
          <h3 class="font-display font-semibold text-foreground transition-colors group-hover:text-primary">
            {{ s.title }}
          </h3>
          <p v-if="s.summary" class="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {{ s.summary }}
          </p>
        </NuxtLink>
      </div>
      <p v-else class="py-10 text-center text-muted-foreground">—</p>
    </section>
  </div>
</template>
