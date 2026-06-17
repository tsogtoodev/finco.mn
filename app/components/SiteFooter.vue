<script setup lang="ts">
// Site footer (Figma node 1:3652): 4 link columns, contact row with social +
// phone/email chips, address bar, legal strip.
const { t } = useI18n()
const localePath = useLocalePath()

const columns = computed(() => [
  {
    heading: t('footer.about'),
    links: [
      { label: t('footer.intro'), to: '/about' },
      { label: t('nav.branches'), to: '/branches' },
      { label: t('footer.reports'), to: '/about' },
    ],
  },
  {
    heading: t('footer.individuals'),
    links: [{ label: t('nav.products'), to: '/products' }],
  },
  {
    heading: t('footer.business'),
    links: [{ label: t('nav.business'), to: '/business' }],
  },
  {
    heading: t('footer.other'),
    links: [
      { label: t('nav.services'), to: '/services/trust' },
      { label: t('nav.careers'), to: '/careers' },
      { label: t('nav.news'), to: '/' },
    ],
  },
])

const socials = [
  { icon: 'hugeicons:facebook-01', href: 'https://facebook.com', label: 'Facebook' },
  { icon: 'hugeicons:linkedin-01', href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: 'hugeicons:youtube', href: 'https://youtube.com', label: 'YouTube' },
]
</script>

<template>
  <footer class="border-t border-black/5 bg-background">
    <div class="mx-auto max-w-7xl px-4 py-14">
      <!-- Link columns -->
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div v-for="col in columns" :key="col.heading">
          <h3 class="font-display text-sm font-semibold text-primary">{{ col.heading }}</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="l in col.links" :key="l.label">
              <NuxtLink :to="localePath(l.to)" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {{ l.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Contact -->
      <div class="mt-12">
        <h3 class="font-display text-sm font-semibold text-primary">{{ t('footer.contact') }}</h3>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            class="flex size-9 items-center justify-center rounded-[--radius-sm] bg-dark text-white transition-opacity hover:opacity-85"
          >
            <Icon :name="s.icon" class="size-5" />
          </a>
          <a
            :href="`tel:${t('contact.phone').replace(/\\s/g, '')}`"
            class="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm text-foreground transition-colors hover:border-primary"
          >
            {{ t('contact.phone') }}
            <Icon name="hugeicons:arrow-up-right-01" class="size-4 text-muted-foreground" />
          </a>
          <a
            :href="`mailto:${t('contact.email')}`"
            class="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm text-foreground transition-colors hover:border-primary"
          >
            {{ t('contact.email') }}
            <Icon name="hugeicons:arrow-up-right-01" class="size-4 text-muted-foreground" />
          </a>
        </div>
        <div class="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm text-muted-foreground">
          <span class="truncate">{{ t('contact.address') }}</span>
          <Icon name="hugeicons:arrow-up-right-01" class="size-4 shrink-0" />
        </div>
      </div>

      <!-- Legal -->
      <div class="mt-12 flex flex-col items-start justify-between gap-3 border-t border-black/5 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <span>{{ t('footer.rights') }}</span>
        <div class="flex items-center gap-5">
          <NuxtLink :to="localePath('/')" class="hover:text-foreground">{{ t('footer.terms') }}</NuxtLink>
          <NuxtLink :to="localePath('/')" class="hover:text-foreground">{{ t('footer.privacy') }}</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
