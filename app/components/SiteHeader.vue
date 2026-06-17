<script setup lang="ts">
// Global site nav. ONE component, two page-driven treatments (Figma 1:14121 /
// 1:13321):
//   • solid  (default)      — white bg, dark text + full-colour logo. Homepage,
//                             form pages. Gains a shadow once scrolled a touch.
//   • overlay (transparent) — floats over a dark image hero with a white logo +
//                             links and a top-down scrim, then transitions to the
//                             solid treatment after scrolling past the hero top.
//
// Two nav items (Иргэнд / Бизнест) open a mega-menu panel (Figma 1:11916 /
// 1:11775); the other three are plain links. While a panel is open the bar is
// forced to its solid treatment so the white panel reads correctly.
//
// The 36px AnnouncementBar lives above this row in the layout and scrolls away;
// only this row is sticky (top:0). Height is 60px to match Figma.
import { navMenus, type NavAudience } from '~/data/navMenus'

const props = withDefaults(defineProps<{ transparent?: boolean }>(), {
  transparent: false,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// ── nav model ─────────────────────────────────────────────────────────────
type NavItem =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'menu'; audience: NavAudience; label: string }

const navItems = computed<NavItem[]>(() => [
  { kind: 'link', to: '/about', label: t('nav.about') },
  { kind: 'menu', audience: 'individual', label: t('nav.products') },
  { kind: 'menu', audience: 'business', label: t('nav.business') },
  { kind: 'link', to: '/services', label: t('nav.trust') },
  { kind: 'link', to: '/news', label: t('nav.news') },
])

// Resolve a menu's i18n copy into the shape NavMegaMenu expects. Slugs + promo
// structure come from data; titles/descriptions/taglines come from i18n.
function buildMenu(audience: NavAudience) {
  const cfg = navMenus[audience]
  return {
    sectionLabel: t(cfg.labelKey),
    promoSide: cfg.promoSide,
    links: cfg.slugs.map((slug) => ({
      to: `/products/${slug}`,
      title: t(`megaMenu.items.${slug}.title`),
      desc: t(`megaMenu.items.${slug}.desc`),
    })),
    promo: {
      variant: cfg.promo.variant,
      logo: cfg.promo.logo,
      logoAlt: t(cfg.promo.logoAltKey),
      tagline: t(cfg.promo.taglineKey),
      ctaLabel: t('common.learnMore'),
      ctaTo: cfg.promo.ctaTo,
    },
  }
}
const menus = computed(() => ({
  individual: buildMenu('individual'),
  business: buildMenu('business'),
}))

// ── mega-menu open/close with hover intent ─────────────────────────────────
const openMenu = ref<NavAudience | null>(null)
let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined
const OPEN_DELAY = 110
const CLOSE_DELAY = 150

function clearTimers() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
}
function scheduleOpen(a: NavAudience) {
  clearTimers()
  // already showing a panel → switch instantly; otherwise wait out the intent delay
  if (openMenu.value) {
    openMenu.value = a
    return
  }
  openTimer = setTimeout(() => (openMenu.value = a), OPEN_DELAY)
}
function scheduleClose() {
  clearTimers()
  closeTimer = setTimeout(() => (openMenu.value = null), CLOSE_DELAY)
}
function cancelClose() {
  clearTimers()
}
function closeNow() {
  clearTimers()
  openMenu.value = null
}

// ── triggers (keyboard + focus management) ─────────────────────────────────
const triggerEls = ref<Partial<Record<NavAudience, HTMLButtonElement>>>({})
function setTrigger(a: NavAudience, el: unknown) {
  if (el) triggerEls.value[a] = el as HTMLButtonElement
}

function toggleMenu(a: NavAudience) {
  clearTimers()
  openMenu.value = openMenu.value === a ? null : a
}
function openAndFocus(a: NavAudience) {
  clearTimers()
  openMenu.value = a
  nextTick(() =>
    document.getElementById(`mega-${a}`)?.querySelector<HTMLAnchorElement>('a')?.focus(),
  )
}
function escClose() {
  const a = openMenu.value
  if (!a) return
  closeNow()
  triggerEls.value[a]?.focus()
}
// Close when keyboard focus leaves the whole nav cluster (Tab past the last link).
const navWrap = ref<HTMLElement | null>(null)
function onFocusOut(e: FocusEvent) {
  if (!openMenu.value) return
  const next = e.relatedTarget as Node | null
  if (!next || !navWrap.value?.contains(next)) closeNow()
}

// ── scroll state ───────────────────────────────────────────────────────────
const scrolled = ref(false) // past a small offset → drop shadow
const pastHero = ref(false) // past the hero top → overlay flips to solid
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 8
  pastHero.value = y > 80
}
const reduceMotion = ref(false)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openMenu.value) escClose()
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  clearTimers()
})

// ── mobile menu ──────────────────────────────────────────────────────────
const mobileOpen = ref(false)
const mobileExpanded = ref<NavAudience | null>(null)
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  closeNow()
})

// Solid *appearance* = white bg + dark content. Overlay flips to it once the user
// scrolls past the hero, whenever the mobile menu is open, or while a mega-menu
// panel is open (so the white panel + dark links read correctly).
const solid = computed(
  () => !props.transparent || pastHero.value || mobileOpen.value || openMenu.value !== null,
)
const showScrim = computed(() => props.transparent && !solid.value)

// Shrink-on-scroll. The open mobile menu keeps the bar at full height.
const condensed = computed(
  () => !mobileOpen.value && (props.transparent ? pastHero.value : scrolled.value),
)
const showShadow = computed(() => condensed.value)

// ── panel animation (honours reduced motion) ───────────────────────────────
const panelInitial = computed(() => (reduceMotion.value ? { opacity: 0 } : { opacity: 0, y: -8 }))
const panelExit = computed(() => (reduceMotion.value ? { opacity: 0 } : { opacity: 0, y: -8 }))
const panelTransition = computed(() => ({ duration: reduceMotion.value ? 0 : 0.18, ease: 'easeOut' }))
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-[background-color,border-color,box-shadow,margin] duration-200"
    :class="[
      solid ? 'border-b border-black/10 bg-white' : 'border-b border-transparent bg-transparent',
      showShadow ? 'shadow-2xs' : 'shadow-none',
      transparent ? (condensed ? '-mb-[52px]' : '-mb-[60px]') : '',
    ]"
    @keydown.esc="escClose"
  >
    <!-- top-down scrim keeps the white nav legible over the hero before it solidifies -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-200"
      :class="showScrim ? 'opacity-100' : 'opacity-0'"
    />

    <!-- dimming scrim behind an open mega-menu panel; click anywhere to close -->
    <AnimatePresence>
      <Motion
        v-if="openMenu"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: reduceMotion ? 0 : 0.18 }"
        class="fixed inset-0 z-40 hidden bg-black/10 backdrop-blur-[2px] lg:block"
        aria-hidden="true"
        @click="closeNow"
      />
    </AnimatePresence>

    <div
      ref="navWrap"
      class="relative z-50 mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 transition-[height] duration-200"
      :class="condensed ? 'h-[52px]' : 'h-[60px]'"
      @focusout="onFocusOut"
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
          <template v-for="item in navItems" :key="item.kind === 'menu' ? item.audience : item.to">
            <NuxtLink
              v-if="item.kind === 'link'"
              :to="localePath(item.to)"
              class="rounded-full px-4 py-2 text-sm font-light transition-colors"
              :class="solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10'"
              :active-class="solid ? 'bg-black/[0.06] font-normal' : 'bg-white/15 font-normal'"
            >
              {{ item.label }}
            </NuxtLink>

            <button
              v-else
              :ref="(el) => setTrigger(item.audience, el)"
              type="button"
              class="flex items-center gap-1 rounded-full py-2 pl-4 pr-3 text-sm font-light transition-colors"
              :class="[
                solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10',
                openMenu === item.audience ? 'bg-black/[0.06] font-normal' : '',
              ]"
              :aria-expanded="openMenu === item.audience"
              aria-haspopup="true"
              :aria-controls="`mega-${item.audience}`"
              @mouseenter="scheduleOpen(item.audience)"
              @mouseleave="scheduleClose"
              @click="toggleMenu(item.audience)"
              @keydown.down.prevent="openAndFocus(item.audience)"
            >
              {{ item.label }}
              <Icon
                name="lucide:chevron-down"
                class="size-3.5 transition-transform duration-200"
                :class="openMenu === item.audience ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>
          </template>
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

      <!-- desktop mega-menu panel: full container width, dropped below the bar -->
      <div class="pointer-events-none absolute inset-x-4 top-full z-50 hidden lg:block">
        <AnimatePresence>
          <Motion
            v-if="openMenu"
            :id="`mega-${openMenu}`"
            role="region"
            :aria-label="menus[openMenu].sectionLabel"
            :initial="panelInitial"
            :animate="{ opacity: 1, y: 0 }"
            :exit="panelExit"
            :transition="panelTransition"
            class="pointer-events-auto mt-2"
            @mouseenter="cancelClose"
            @mouseleave="scheduleClose"
          >
            <NavMegaMenu
              :section-label="menus[openMenu].sectionLabel"
              :links="menus[openMenu].links"
              :promo-side="menus[openMenu].promoSide"
              :promo="menus[openMenu].promo"
            />
          </Motion>
        </AnimatePresence>
      </div>
    </div>

    <!-- mobile menu — solid white panel (readable in both modes), overlays content -->
    <AnimatePresence>
      <Motion
        v-if="mobileOpen"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }"
        class="absolute inset-x-0 top-full max-h-[calc(100dvh-60px)] overflow-y-auto border-t border-black/10 bg-white shadow-2xs lg:hidden"
      >
        <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          <template v-for="item in navItems" :key="item.kind === 'menu' ? item.audience : item.to">
            <NuxtLink
              v-if="item.kind === 'link'"
              :to="localePath(item.to)"
              class="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-light text-dark transition-colors hover:bg-black/5"
              active-class="bg-black/[0.06] font-normal"
            >
              {{ item.label }}
            </NuxtLink>

            <!-- mega items become accordion sections on mobile -->
            <div v-else>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-light text-dark transition-colors hover:bg-black/5"
                :aria-expanded="mobileExpanded === item.audience"
                @click="mobileExpanded = mobileExpanded === item.audience ? null : item.audience"
              >
                {{ item.label }}
                <Icon
                  name="lucide:chevron-down"
                  class="size-4 text-black/50 transition-transform duration-200"
                  :class="mobileExpanded === item.audience ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence>
                <Motion
                  v-if="mobileExpanded === item.audience"
                  :initial="{ opacity: 0, height: 0 }"
                  :animate="{ opacity: 1, height: 'auto' }"
                  :exit="{ opacity: 0, height: 0 }"
                  :transition="{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }"
                  class="overflow-hidden"
                >
                  <div class="flex flex-col gap-0.5 py-1 pl-3">
                    <NuxtLink
                      v-for="link in menus[item.audience].links"
                      :key="link.to"
                      :to="localePath(link.to)"
                      class="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-3 py-2 transition-colors hover:bg-black/5"
                    >
                      <span class="text-sm font-normal text-black/80">{{ link.title }}</span>
                      <span class="text-xs font-extralight leading-4 text-black/55">{{ link.desc }}</span>
                    </NuxtLink>
                  </div>
                </Motion>
              </AnimatePresence>
            </div>
          </template>
        </nav>
      </Motion>
    </AnimatePresence>
  </header>
</template>
