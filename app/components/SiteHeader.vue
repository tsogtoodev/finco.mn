<script setup lang="ts">
// Primary site header: wordmark, nav, locale switcher, auth. Mobile menu
// slides in via motion-v (AnimatePresence).
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const links = computed(() => [
  { to: '/products', label: t('nav.products') },
  { to: '/business', label: t('nav.business') },
  { to: '/about', label: t('nav.about') },
  { to: '/branches', label: t('nav.branches') },
  { to: '/careers', label: t('nav.careers') },
])

const mobileOpen = ref(false)
// Close the mobile menu whenever the route changes.
watch(() => route.fullPath, () => { mobileOpen.value = false })
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-black/5 bg-background/90 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5">
      <!-- Wordmark -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-primary">
        <span class="inline-block size-2.5 rounded-full bg-teal" />
        Finco
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-7 text-sm font-medium lg:flex">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="localePath(l.to)"
          class="text-secondary-foreground transition-colors hover:text-primary"
          active-class="text-primary"
        >
          {{ l.label }}
        </NuxtLink>
      </nav>

      <!-- Right actions -->
      <div class="flex items-center gap-3">
        <LocaleSwitcher class="hidden sm:flex" />
        <AuthButton class="hidden sm:block" />
        <button
          type="button"
          class="lg:hidden"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :name="mobileOpen ? 'hugeicons:cancel-01' : 'hugeicons:menu-01'" class="size-6 text-foreground" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <AnimatePresence>
      <Motion
        v-if="mobileOpen"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
        class="overflow-hidden border-t border-black/5 lg:hidden"
      >
        <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-medium">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="localePath(l.to)"
            class="rounded-[--radius-sm] px-3 py-2 text-secondary-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            {{ l.label }}
          </NuxtLink>
          <div class="mt-2 flex items-center justify-between border-t border-black/5 px-3 pt-3">
            <LocaleSwitcher />
            <AuthButton />
          </div>
        </nav>
      </Motion>
    </AnimatePresence>
  </header>
</template>
