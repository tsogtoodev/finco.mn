<script setup lang="ts">
// Global site nav. ONE component, two page-driven treatments (Figma 1:14121 /
// 1:13321):
//   • solid  (default)      — white bg, dark text + full-colour logo. Homepage,
//                             form pages. Gains a shadow once scrolled a touch.
//   • overlay (transparent) — floats over a dark image hero with a white logo +
//                             links and a top-down scrim, then transitions to the
//                             solid treatment after scrolling past the hero top.
//
// The 36px AnnouncementBar lives above this row in the layout and scrolls away;
// only this row is sticky (top:0). Height is 60px to match Figma — the "97px"
// top bar in the brief is the announcement (36) + this row (60) + 1px border.
const props = withDefaults(defineProps<{ transparent?: boolean }>(), {
  transparent: false,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const links = computed(() => [
  { to: '/about', label: t('nav.about') },
  { to: '/products', label: t('nav.products') },
  { to: '/business', label: t('nav.business') },
  { to: '/services', label: t('nav.trust') },
  { to: '/news', label: t('nav.news') },
])

// ── scroll state ──────────────────────────────────────────────────────────
const scrolled = ref(false) // past a small offset → drop shadow
const pastHero = ref(false) // past the hero top → overlay flips to solid
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 8
  pastHero.value = y > 80
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// ── mobile menu ───────────────────────────────────────────────────────────
const mobileOpen = ref(false)
watch(() => route.fullPath, () => { mobileOpen.value = false })

// Solid *appearance* = white bg + dark content. Overlay flips to it once the user
// scrolls past the hero, or whenever the mobile menu is open (so the links stay
// readable instead of sitting over a photo).
const solid = computed(() => !props.transparent || pastHero.value || mobileOpen.value)
const showScrim = computed(() => props.transparent && !solid.value)

// Shrink-on-scroll: condense the bar (shorter row + smaller logo + shadow) once
// scrolled. Overlay pages condense at the hero threshold (where they also turn
// solid); solid pages condense after a small offset. The open mobile menu keeps
// the bar at full height. On overlay pages the negative margin is matched to the
// row height so the hero never shifts as the bar grows/shrinks.
const condensed = computed(
  () => !mobileOpen.value && (props.transparent ? pastHero.value : scrolled.value),
)
const showShadow = computed(() => condensed.value)
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-[background-color,border-color,box-shadow,margin] duration-200"
    :class="[
      solid ? 'border-b border-black/10 bg-white' : 'border-b border-transparent bg-transparent',
      showShadow ? 'shadow-2xs' : 'shadow-none',
      transparent ? (condensed ? '-mb-[52px]' : '-mb-[60px]') : '',
    ]"
  >
    <!-- top-down scrim keeps the white nav legible over the hero before it solidifies -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-200"
      :class="showScrim ? 'opacity-100' : 'opacity-0'"
    />

    <div
      class="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 transition-[height] duration-200"
      :class="condensed ? 'h-[52px]' : 'h-[60px]'"
    >
      <!-- left: logo + desktop nav -->
      <div class="flex items-center gap-8 xl:gap-16">
        <NuxtLink
          :to="localePath('/')"
          class="relative block shrink-0 transition-[width,height] duration-200"
          :class="condensed ? 'h-6 w-[120px]' : 'h-7 w-[140px]'"
          aria-label="Finco Capital"
        >
          <FincoLogo
            variant="color"
            class="absolute inset-0 size-full transition-opacity duration-200"
            :class="solid ? 'opacity-100' : 'opacity-0'"
          />
          <FincoLogo
            variant="white"
            class="absolute inset-0 size-full transition-opacity duration-200"
            :class="solid ? 'opacity-0' : 'opacity-100'"
          />
        </NuxtLink>

        <nav class="hidden items-center gap-1 lg:flex">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="localePath(l.to)"
            class="rounded-full px-4 py-2 text-sm font-light transition-colors"
            :class="solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10'"
            :active-class="solid ? 'bg-black/[0.06] font-normal' : 'bg-white/15 font-normal'"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- right: locale switcher + mobile toggle -->
      <div class="flex items-center gap-2">
        <LocaleSwitcher :variant="solid ? 'solid' : 'overlay'" />
        <button
          type="button"
          class="rounded-full p-2 transition-colors lg:hidden"
          :class="solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10'"
          :aria-label="mobileOpen ? t('announcement.dismiss') : 'Menu'"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <svg v-if="!mobileOpen" viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- mobile menu — solid white panel (readable in both modes), overlays content -->
    <AnimatePresence>
      <Motion
        v-if="mobileOpen"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
        class="absolute inset-x-0 top-full overflow-hidden border-t border-black/10 bg-white shadow-2xs lg:hidden"
      >
        <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="localePath(l.to)"
            class="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-light text-dark transition-colors hover:bg-black/5"
            active-class="bg-black/[0.06] font-normal"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </Motion>
    </AnimatePresence>
  </header>
</template>
