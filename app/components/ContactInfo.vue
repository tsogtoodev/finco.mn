<script setup lang="ts">
// Contact details card. Reuses the footer's contact block (Figma 1:14377):
// social icon circles + underlined pill rows for phone / email / address.
const { t } = useI18n()

const phone = computed(() => t('contact.phone'))
const email = computed(() => t('contact.email'))
const address = computed(() => t('contact.address'))

const socials = [
  { icon: 'f:facebook', href: 'https://facebook.com', label: 'Facebook' },
  { icon: 'f:linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: 'f:youtube', href: 'https://youtube.com', label: 'YouTube' },
]

const rows = computed(() => [
  {
    icon: 'lucide:phone',
    label: t('contactPage.info.phoneLabel'),
    value: phone.value,
    href: `tel:${phone.value.replace(/\s/g, '')}`,
  },
  {
    icon: 'lucide:mail',
    label: t('contactPage.info.emailLabel'),
    value: email.value,
    href: `mailto:${email.value}`,
  },
  {
    icon: 'lucide:map-pin',
    label: t('contactPage.info.addressLabel'),
    value: address.value,
    href: `https://maps.google.com/?q=${encodeURIComponent(address.value)}`,
    external: true,
  },
])
</script>

<template>
  <div class="rounded-[var(--radius)] border border-input bg-white p-6 sm:p-8">
    <h2 class="font-display text-2xl font-medium text-foreground">
      {{ t('contactPage.info.heading') }}
    </h2>
    <p class="mt-3 text-sm text-muted-foreground sm:text-base">
      {{ t('contactPage.info.subtext') }}
    </p>

    <ul class="mt-8 space-y-6">
      <li v-for="r in rows" :key="r.label" class="flex items-start gap-4">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-primary">
          <Icon :name="r.icon" class="size-5" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-medium text-muted-foreground">{{ r.label }}</p>
          <a
            :href="r.href"
            :target="r.external ? '_blank' : undefined"
            :rel="r.external ? 'noopener' : undefined"
            class="mt-1 inline-flex items-start gap-1 text-base font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <span>{{ r.value }}</span>
            <Icon
              v-if="r.external"
              name="lucide:arrow-up-right"
              class="size-4 shrink-0 translate-y-1 text-muted-foreground"
            />
          </a>
        </div>
      </li>
    </ul>

    <div class="mt-8 border-t border-input pt-6">
      <p class="text-sm font-medium text-muted-foreground">{{ t('contactPage.info.followLabel') }}</p>
      <div class="mt-4 flex items-center gap-4">
        <a
          v-for="s in socials"
          :key="s.label"
          :href="s.href"
          target="_blank"
          rel="noopener"
          :aria-label="s.label"
          class="flex size-11 items-center justify-center rounded-full bg-white text-dark shadow-2xs ring-1 ring-black/5 transition-colors hover:bg-muted"
        >
          <Icon :name="s.icon" class="size-5" />
        </a>
      </div>
    </div>
  </div>
</template>
