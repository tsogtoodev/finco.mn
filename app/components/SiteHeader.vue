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
// `label` names the panel for assistive tech (matches the trigger's label).
function buildMenu(audience: NavAudience) {
  const cfg = navMenus[audience]
  return {
    label: t(audience === 'individual' ? 'nav.products' : 'nav.business'),
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
// `openMenu` holds the visible menu; `closing` plays the exit animation for
// EXIT_MS before the panel actually unmounts (so close is animated, not abrupt).
// `swapped` marks an open→open switch (Иргэнд ↔ Бизнесд): the keyed panel
// remounts with the lighter .mega-swap settle instead of the full pop.
const openMenu = ref<NavAudience | null>(null)
const closing = ref(false)
const swapped = ref(false)
let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined
let exitTimer: ReturnType<typeof setTimeout> | undefined
const OPEN_DELAY = 110
const CLOSE_DELAY = 150
const EXIT_MS = 180 // keep in sync with .mega-pop-out / .scrim-fade-out (0.18s)

function clearTimers() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
}
// Show a menu now: cancels any pending close/exit and swaps content instantly.
function showMenu(a: NavAudience) {
  clearTimers()
  clearTimeout(exitTimer)
  swapped.value = openMenu.value !== null && openMenu.value !== a
  closing.value = false
  openMenu.value = a
}
// Begin the exit animation, then unmount once it finishes.
function hideMenu() {
  clearTimers()
  if (!openMenu.value || closing.value) return
  closing.value = true
  exitTimer = setTimeout(() => {
    openMenu.value = null
    closing.value = false
  }, EXIT_MS)
}
function scheduleOpen(a: NavAudience) {
  clearTimers()
  clearTimeout(exitTimer)
  // already showing (or mid-exit) → switch/cancel-exit instantly; else intent delay
  if (openMenu.value) {
    showMenu(a)
    return
  }
  openTimer = setTimeout(() => showMenu(a), OPEN_DELAY)
}
function scheduleClose() {
  clearTimers()
  closeTimer = setTimeout(hideMenu, CLOSE_DELAY)
}
function cancelClose() {
  clearTimers()
  // pointer returned while exiting → cancel the exit and keep it open
  if (closing.value && openMenu.value) showMenu(openMenu.value)
}
function closeNow() {
  hideMenu()
}
// Route change: drop the panel immediately (no exit animation mid-navigation).
function hardClose() {
  clearTimers()
  clearTimeout(exitTimer)
  closing.value = false
  openMenu.value = null
}

// ── triggers (keyboard + focus management) ─────────────────────────────────
const triggerEls = ref<Partial<Record<NavAudience, HTMLButtonElement>>>({})
function setTrigger(a: NavAudience, el: unknown) {
  if (el) triggerEls.value[a] = el as HTMLButtonElement
}

function toggleMenu(a: NavAudience) {
  if (openMenu.value === a && !closing.value) hideMenu()
  else showMenu(a)
}
function openAndFocus(a: NavAudience) {
  showMenu(a)
  nextTick(() =>
    document.getElementById(`mega-${a}`)?.querySelector<HTMLAnchorElement>('a')?.focus(),
  )
}
function escClose() {
  const a = openMenu.value
  if (!a) return
  hideMenu()
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
const hidden = ref(false) // scrolling down past the bar → slide the row off-screen
let lastY = 0
const DIR_THRESHOLD = 4 // ignore sub-pixel/momentum jitter
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 8
  pastHero.value = y > 80
  // Hide on scroll-down (once past the bar's own height), reveal on scroll-up.
  // Always reveal near the top so the bar never hides over the hero/announcement.
  const delta = y - lastY
  if (y < 80) hidden.value = false
  else if (delta > DIR_THRESHOLD && y > 120) hidden.value = true
  else if (delta < -DIR_THRESHOLD) hidden.value = false
  lastY = y
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openMenu.value) escClose()
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  clearTimers()
  clearTimeout(exitTimer)
})

// ── mobile menu ──────────────────────────────────────────────────────────
const mobileOpen = ref(false)
const mobileExpanded = ref<NavAudience | null>(null)
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  hardClose()
})

// A mega-menu is visually present while open OR mid-exit animation.
const menuVisible = computed(() => openMenu.value !== null)

// Solid *appearance* = white bg + dark content. Overlay flips to it once the user
// scrolls past the hero, whenever the mobile menu is open, or while a mega-menu
// panel is open (so the white panel + dark links read correctly).
const solid = computed(
  () => !props.transparent || pastHero.value || mobileOpen.value || openMenu.value !== null,
)
const showScrim = computed(() => props.transparent && !solid.value)

// Drop a shadow once scrolled (overlay: past the hero; solid: any nudge) as the
// separation cue. The bar height stays fixed at 60px — no shrink-on-scroll.
const showShadow = computed(
  () => !mobileOpen.value && (props.transparent ? pastHero.value : scrolled.value),
)

// Slide the bar away on scroll-down, but never while a mega-menu or the mobile
// menu is open (it must stay anchored for the panel to read correctly).
const barHidden = computed(
  () => hidden.value && openMenu.value === null && !mobileOpen.value,
)
</script>

<template>
  <header
    class="sticky top-0 z-50 [transition:background-color_300ms_cubic-bezier(0.33,1,0.68,1),box-shadow_300ms_cubic-bezier(0.33,1,0.68,1),translate_400ms_cubic-bezier(0.22,1,0.36,1)] [will-change:translate] motion-reduce:transition-none"
    :class="[
      barHidden ? '-translate-y-full' : 'translate-y-0',
      solid ? 'bg-white' : 'bg-transparent',
      // shadow conveys separation on scroll; suppressed while a panel is open so the
      // bar reads as one clean surface with the floating panel
      showShadow && !menuVisible ? 'shadow-2xs' : 'shadow-none',
      transparent ? '-mb-[60px]' : '',
    ]"
    @keydown.esc="escClose"
  >
    <!-- top-down scrim keeps the white nav legible over the hero before it solidifies -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-300"
      :class="showScrim ? 'opacity-100' : 'opacity-0'"
    />

    <!-- dimming scrim behind an open mega-menu panel; click anywhere to close.
         Starts at the bar's bottom edge (top-full) so the nav + announcement bar
         above it stay crisp — matching Figma, the dim/blur only affects the page. -->
    <div
      v-if="openMenu"
      class="absolute inset-x-0 top-full z-40 hidden h-screen bg-black/10 backdrop-blur-[2.5px] lg:block"
      :class="closing ? 'scrim-fade-out' : 'scrim-fade'"
      aria-hidden="true"
      @click="closeNow"
    />

    <div
      ref="navWrap"
      class="relative z-50 mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-6 px-4"
      @focusout="onFocusOut"
    >
      <!-- left: logo + desktop nav -->
      <div class="flex items-center gap-8 xl:gap-16">
        <NuxtLink
          :to="localePath('/')"
          class="relative block h-7 w-[140px] shrink-0"
          aria-label="Finco Capital"
        >
          <FincoLogo
            variant="color"
            class="absolute inset-0 size-full transition-opacity duration-300"
            :class="solid ? 'opacity-100' : 'opacity-0'"
          />
          <FincoLogo
            variant="white"
            class="absolute inset-0 size-full transition-opacity duration-300"
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
              class="rounded-full px-4 py-2 text-sm font-light transition-colors"
              :class="[
                solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10',
                openMenu === item.audience ? 'bg-black/5 font-medium' : '',
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

      <!-- desktop mega-menu panel: content-sized, centered below the bar.
           Centering lives on this static wrapper (flex) — the animated child
           can't carry translate classes since .mega-pop animates transform. -->
      <div class="pointer-events-none absolute inset-x-4 top-full z-50 hidden lg:flex lg:justify-center">
        <div
          v-if="openMenu"
          :id="`mega-${openMenu}`"
          :key="openMenu"
          role="region"
          :aria-label="menus[openMenu].label"
          class="pointer-events-auto mt-6 min-w-0"
          :class="closing ? 'mega-pop-out' : swapped ? 'mega-swap' : 'mega-pop'"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
        >
          <NavMegaMenu
            :links="menus[openMenu].links"
            :promo="menus[openMenu].promo"
          />
        </div>
      </div>
    </div>

    <!-- mobile menu — solid white panel (readable in both modes), overlays content.
         Height animates via the CSS grid-rows 0fr→1fr trick (reliable, no JS). -->
    <div
      class="absolute inset-x-0 top-full grid bg-white transition-[grid-template-rows,border-color] duration-300 ease-out motion-reduce:transition-none lg:hidden"
      :class="mobileOpen ? 'grid-rows-[1fr] border-black/10 shadow-2xs' : 'grid-rows-[0fr] border-transparent'"
      :aria-hidden="!mobileOpen"
    >
      <div class="overflow-hidden">
        <nav class="mx-auto flex max-h-[calc(100dvh-60px)] max-w-7xl flex-col gap-1 overflow-y-auto px-4 py-3">
          <template v-for="item in navItems" :key="item.kind === 'menu' ? item.audience : item.to">
            <NuxtLink
              v-if="item.kind === 'link'"
              :to="localePath(item.to)"
              :tabindex="mobileOpen ? undefined : -1"
              class="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-light text-dark transition-colors hover:bg-black/5"
              active-class="bg-black/[0.06] font-normal"
            >
              {{ item.label }}
            </NuxtLink>

            <!-- mega items become accordion sections on mobile -->
            <div v-else>
              <button
                type="button"
                :tabindex="mobileOpen ? undefined : -1"
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
              <div
                class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                :class="mobileExpanded === item.audience ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              >
                <div class="overflow-hidden">
                  <div class="flex flex-col gap-0.5 py-1 pl-3">
                    <NuxtLink
                      v-for="link in menus[item.audience].links"
                      :key="link.to"
                      :to="localePath(link.to)"
                      :tabindex="mobileOpen && mobileExpanded === item.audience ? undefined : -1"
                      class="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-3 py-2 transition-colors hover:bg-black/5"
                    >
                      <span class="text-sm font-normal text-black/80">{{ link.title }}</span>
                      <span class="text-xs font-extralight leading-4 text-black/55">{{ link.desc }}</span>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>
