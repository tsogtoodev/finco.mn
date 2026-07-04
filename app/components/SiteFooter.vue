<script setup lang="ts">
// Site footer (Figma 1:14377 + legal block 1:14111): white link columns +
// contact row, then a dark legal strip with disclaimer, ISO badges, copyright.
const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

const columns = computed(() => [
  {
    heading: t('footer.about'),
    links: [
      { label: t('footer.intro'), to: '/about' },
      { label: t('footer.links.branches'), to: '/branches' },
      { label: t('footer.reports'), to: '/about' },
    ],
  },
  {
    heading: t('footer.individuals'),
    links: [
      { label: t('footer.links.consumerLoan'), to: '/products/consumer-loan' },
      { label: t('footer.links.greenLoan'), to: '/products/green-loan' },
      { label: t('footer.links.autoLease'), to: '/products/auto-loan' },
      { label: t('footer.links.autoCollateral'), to: '/products/quick-collateral-loan' },
    ],
  },
  {
    heading: t('footer.business'),
    links: [
      { label: t('footer.links.businessLoan'), to: '/business' },
      { label: t('footer.links.investmentLoan'), to: '/products/investment-loan' },
      { label: t('footer.links.purchaseLoan'), to: '/products/purchase-loan' },
      { label: t('footer.links.greenBusinessLoan'), to: '/products/green-business-loan' },
      { label: t('footer.links.womenLoan'), to: '/products/women-business-loan' },
    ],
  },
  {
    heading: t('footer.other'),
    links: [
      { label: t('footer.links.trust'), to: '/services/trust' },
      { label: t('footer.links.careers'), to: '/careers' },
      { label: t('footer.links.news'), to: '/news' },
    ],
  },
])

const socials = [
  { icon: 'f:facebook', href: 'https://facebook.com', label: 'Facebook' },
  { icon: 'f:linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: 'f:youtube', href: 'https://youtube.com', label: 'YouTube' },
]

const phone = computed(() => t('contact.phone'))
const email = computed(() => t('contact.email'))
const disclaimer = computed(() => (tm('footer.disclaimer') as unknown[]).map((p) => rt(p as string)))
</script>

<template>
  <footer>
    <!-- Link columns + contact — the opaque "curtain" that scrolls in FRONT and
         lifts away to reveal the dark legal strip pinned behind it. Higher z than
         the strip; solid white bg so it fully occludes the strip until it lifts. -->
    <div class="relative z-10 bg-white">
      <div class="mx-auto w-full max-w-[1200px] px-6 py-20 lg:py-28">
        <div class="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          <div v-for="col in columns" :key="col.heading">
            <h3 class="font-display text-base font-medium text-accent">{{ col.heading }}</h3>
            <ul class="mt-6 space-y-3">
              <li v-for="l in col.links" :key="l.label">
                <NuxtLink
                  :to="localePath(l.to)"
                  class="text-sm font-light text-black/[0.64] transition-colors hover:text-foreground"
                >
                  {{ l.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Contact -->
        <div class="mt-16">
          <h3 class="font-display text-base font-medium text-accent">{{ t('footer.contact') }}</h3>
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <a
              v-for="s in socials"
              :key="s.label"
              :href="s.href"
              target="_blank"
              rel="noopener"
              :aria-label="s.label"
              class="flex size-9 items-center justify-center rounded-full bg-white text-dark transition-colors hover:bg-muted"
            >
              <Icon :name="s.icon" class="text-[22px]" />
            </a>
            <a
              :href="`tel:${phone.replace(/\s/g, '')}`"
              class="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm text-black/[0.64] transition-colors hover:bg-black/10"
            >
              {{ phone }}
              <Icon name="lucide:arrow-up-right" class="size-4" />
            </a>
            <a
              :href="`mailto:${email}`"
              class="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm text-black/[0.64] transition-colors hover:bg-black/10"
            >
              {{ email }}
              <Icon name="lucide:arrow-up-right" class="size-4" />
            </a>
          </div>
          <a
            :href="`https://maps.google.com/?q=${encodeURIComponent(t('contact.address'))}`"
            target="_blank"
            rel="noopener"
            class="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm text-black/[0.64] transition-colors hover:bg-black/10"
          >
            <span class="truncate">{{ t('contact.address') }}</span>
            <Icon name="lucide:arrow-up-right" class="size-4 shrink-0" />
          </a>
        </div>
      </div>
    </div>

    <!-- Legal strip — pinned to the viewport bottom BEHIND the contact curtain
         (lower z), so as the page scrolls the contact lifts off to reveal it.
         motion-safe only → reduced-motion users get a plain stacked footer. -->
    <div class="relative z-0 overflow-hidden bg-[#0a0a1a] motion-safe:sticky motion-safe:bottom-0">
      <img
        src="/images/home/finco-footer.png"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute bottom-0 right-0 h-auto w-[80%] min-w-[720px] max-w-none translate-x-[8%] translate-y-[6%]"
      >
      <div class="relative mx-auto w-full max-w-[1200px] px-6 py-16 lg:py-24">
        <div class="flex flex-col gap-4 text-center text-sm font-thin leading-5 tracking-wide text-white/60">
          <p v-for="(para, i) in disclaimer" :key="i">{{ para }}</p>
        </div>

        <div class="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <span class="text-sm font-light text-white">{{ t('footer.rights') }}</span>
          <img
            src="/images/home/iso-badges.png"
            :alt="t('footer.iso')"
            class="h-12 w-auto opacity-80"
          >
          <div class="flex items-center gap-8 text-sm font-light text-white/95">
            <NuxtLink :to="localePath('/')" class="hover:text-white">{{ t('footer.terms') }}</NuxtLink>
            <NuxtLink :to="localePath('/')" class="hover:text-white">{{ t('footer.privacy') }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
