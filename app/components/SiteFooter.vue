<script setup lang="ts">
// Site footer (Figma 568:5816 redesign): single light surface — link columns
// (About + Other stacked in the first column, then the two product catalogs),
// contact pill row, hairline divider, legal block with an inline privacy-policy
// link, and the Finco wordmark bleeding off the bottom edge. The product
// columns render the full catalog from the `products` collection so footer
// links always point at real, CMS-managed product pages.
const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

const catalog = await useProductList()
const productLinks = (audience: 'individual' | 'business') =>
  (catalog.value ?? [])
    .filter((p) => p.audience === audience)
    .map((p) => ({ label: p.title, to: `/products/${p.slug}` }))

const aboutGroup = computed(() => ({
  heading: t('footer.about'),
  links: [
    { label: t('footer.intro'), to: '/about' },
    { label: t('footer.links.branches'), to: '/branches' },
    { label: t('footer.reports'), to: '/about' },
  ],
}))

const otherGroup = computed(() => ({
  heading: t('footer.other'),
  links: [
    { label: t('footer.links.trust'), to: '/services/trust' },
    { label: t('footer.links.careers'), to: '/careers' },
    { label: t('footer.links.news'), to: '/news' },
    { label: t('footer.links.fincobiz'), to: '/business' },
    { label: t('footer.links.beep'), to: '/products' },
  ],
}))

const individualsGroup = computed(() => ({
  heading: t('footer.individuals'),
  links: productLinks('individual'),
}))

const businessGroup = computed(() => ({
  heading: t('footer.business'),
  links: productLinks('business'),
}))

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
  <footer class="bg-[#fbfbfb]">
    <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-0 pt-20 pb-10 md:pb-0 lg:pt-[120px]">
      <!-- Link columns. Two balanced columns on mobile (meta groups | catalog
           groups, each pair stacked), expanding to three on desktop: the catalog
           wrapper is `md:contents` so at md its two groups dissolve into direct
           grid cells, giving [About+Other] [Individuals] [Business]. -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
        <div class="flex flex-col gap-[48px]">
          <div v-for="col in [aboutGroup, otherGroup]" :key="col.heading">
            <h3 class="text-sm text-accent">{{ col.heading }}</h3>
            <div class="mt-[16px] space-y-[16px] text-sm font-light leading-normal">
              <div v-for="l in col.links" :key="l.label">
                <NuxtLink
                  :to="localePath(l.to)"
                  class="block text-black/60 transition-colors hover:text-foreground text-[14px] leading-[18px]"
                >
                  {{ l.label }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-[48px] md:contents">
          <div v-for="col in [individualsGroup, businessGroup]" :key="col.heading">
            <h3 class="text-sm text-accent">{{ col.heading }}</h3>
            <div class="mt-[16px] space-y-[16px] text-sm font-light leading-normal">
              <div v-for="l in col.links" :key="l.label">
                <NuxtLink
                  :to="localePath(l.to)"
                  class="block text-black/60 transition-colors hover:text-foreground text-[14px] leading-[18px]"
                >
                  {{ l.label }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="mt-12">
        <h3 class="text-sm text-accent">{{ t('footer.contact') }}</h3>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            class="flex size-9 items-center justify-center rounded-full bg-black/[0.03] text-dark transition-colors hover:bg-black/10"
          >
            <Icon :name="s.icon" class="text-[20px]" />
          </a>
          <a
            :href="`tel:${phone.replace(/\s/g, '')}`"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ phone }}
          </a>
          <a
            :href="`mailto:${email}`"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ email }}
          </a>
          <NuxtLink
            :to="localePath('/branches')"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ t('footer.viewLocations') }}
          </NuxtLink>
        </div>
      </div>

      <div class="mt-8 h-px w-full bg-black/10" />

      <!-- Legal -->
      <div class="mt-8">
        <p class="text-xs font-light leading-5 text-black/60">{{ t('footer.rights') }}</p>
        <div class="mt-[16px] space-y-[16px] text-xs font-thin leading-[18px] text-black/50">
          <p v-for="(para, i) in disclaimer" :key="i">{{ para }}</p>
          <p>
            {{ t('footer.privacyPre') }}<NuxtLink
              :to="localePath('/legal/privacy')"
              class="font-light text-accent underline"
            >{{ t('footer.privacyLink') }}</NuxtLink>{{ t('footer.privacyPost') }}
          </p>
        </div>
      </div>

      <!-- Giant wordmark, bottom half clipped by the footer edge (Figma 568:5878).
           The negative bottom margin (half the logo's height as % of width,
           aspect 139.355:28) shrinks the wrapper so overflow-hidden crops it.
           Mobile (< md) shows the wordmark in full — no negative margin, nothing
           to crop; the bleeding half-clip returns at md and up. -->
      <div class="mt-10 overflow-hidden" aria-hidden="true">
        <FincoLogo class="block w-full md:[margin-bottom:-10.05%]" />
      </div>
    </div>
  </footer>
</template>
