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
// The 36px AnnouncementBar rides at the top of this sticky header (rendered
// below), so it reveals/hides WITH the nav on scroll — returning on scroll-up
// until dismissed — instead of scrolling away. The nav row is 60px per Figma.
import { navPromos, type NavAudience } from '~/data/navMenus'

const props = withDefaults(defineProps<{ transparent?: boolean }>(), {
  transparent: false,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// The error page gets a hairline bottom border. It's rendered by app/error.vue,
// which sits outside the router's page tree — a 404 URL matches no page, so
// `route.meta` is empty and the layout's meta-driven props (transparentHeader,
// floatingActions) can't reach it. useError() is the signal that works there.
// It's set during SSR too, so the border renders server-side — no hydration flip.
const nuxtError = useError()
const onErrorPage = computed(() => Boolean(nuxtError.value))

// ── nav model ─────────────────────────────────────────────────────────────
type NavItem =
  | { kind: 'link'; to: string; label: string }
  // Mega-menu items are also real links: the trigger navigates to its section
  // page on click while opening the dropdown on hover.
  | { kind: 'menu'; audience: NavAudience; label: string; to: string }

const navItems = computed<NavItem[]>(() => [
  { kind: 'link', to: '/about', label: t('nav.about') },
  { kind: 'menu', audience: 'individual', label: t('nav.products'), to: '/products' },
  { kind: 'menu', audience: 'business', label: t('nav.business'), to: '/business' },
  { kind: 'link', to: '/services', label: t('nav.trust') },
  { kind: 'link', to: '/news', label: t('nav.news') },
])

// Main nav links sit in the viewport permanently — prefetch on hover/focus only
// (not visibility) so we don't pull every destination's chunks/assets on load.
const navPrefetchOn = { interaction: true, visibility: false } as const

// Menu links come from the `products` collection (audience + order) so the
// menus track the CMS catalog; promo card structure comes from navPromos and
// its copy from i18n. `label` names the panel for assistive tech.
const catalog = await useProductList()

function buildMenu(audience: NavAudience) {
  const promo = navPromos[audience]
  return {
    label: t(audience === 'individual' ? 'nav.products' : 'nav.business'),
    links: (catalog.value ?? [])
      .filter((p) => p.audience === audience)
      .map((p) => ({
        to: `/products/${p.slug}`,
        title: p.menuTitle ?? p.title,
        desc: p.menuDesc ?? p.summary,
      })),
    promo: {
      variant: promo.variant,
      logo: promo.logo,
      logoAlt: t(promo.logoAltKey),
      tagline: t(promo.taglineKey),
      ctaLabel: t('common.learnMore'),
      ctaTo: promo.ctaTo,
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
// Touch at >=lg (iPad Pro portrait is exactly 1024, any tablet in landscape):
// the trigger is a real <NuxtLink>, and the panel only ever opened on
// @mouseenter — so a tap navigated straight to /products and the per-product
// sub-links were unreachable from the nav entirely. First tap opens the panel,
// a second tap on the same trigger follows the link. Below lg the drawer covers
// this, and on a pointer device hover has already opened it so this is a no-op.
//
// Bound with .capture: vue-router's own click handler bails when the event is
// already `defaultPrevented`, but only if we get there first — a bubble-phase
// listener races with RouterLink's and would navigate anyway.
function onTriggerActivate(e: MouseEvent, a: NavAudience) {
  if (window.matchMedia('(hover: hover)').matches) return
  if (openMenu.value === a) return
  e.preventDefault()
  showMenu(a)
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
  megaSize.value = {}
}

// ── mega-menu size tween (.t-resize) ───────────────────────────────────────
// The panel is a different size per menu (Иргэнд: 1 column, Бизнесд: 2). A
// persistent-while-open wrapper carries the card chrome + `.t-resize`; on each
// open/switch we measure the (w-max, natural-size) content and pin the wrapper's
// explicit px width/height, so an Иргэнд ↔ Бизнесд switch TWEENS the frame
// between the two sizes (the wrapper persists across the switch; only the inner
// keyed content remounts for the pop/swap). Reset on close so the next open
// re-measures from scratch instead of flashing the previous menu's size.
const megaContent = ref<HTMLElement | null>(null)
const megaSize = ref<Record<string, string>>({})
async function measureMega() {
  await nextTick()
  const el = megaContent.value
  // Pin WIDTH only (the 1-col ↔ 2-col change). Height is left auto: both menus
  // are ≤5 rows so it barely differs, and an exact pinned height would risk a
  // 1px clip against the overflow-hidden frame.
  if (el) megaSize.value = { width: `${el.offsetWidth}px` }
}
watch(openMenu, (v) => { if (v) measureMega() })

// ── triggers (keyboard + focus management) ─────────────────────────────────
// Triggers are <NuxtLink>s, so a template ref yields the component instance —
// unwrap to its root <a> element so focus management (Esc restore) still works.
const triggerEls = ref<Partial<Record<NavAudience, HTMLElement>>>({})
function setTrigger(a: NavAudience, el: unknown) {
  if (!el) return
  const node = (el as { $el?: unknown }).$el ?? el
  if (node instanceof HTMLElement) triggerEls.value[a] = node
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

// Lock the page behind the drawer. Without this, scrolling while the drawer is
// open scrolls the content behind an opaque white panel. Reference-counted so it
// composes with AppDialog, which can be opened on top of the drawer via the FAB.
watch(mobileOpen, (open) => {
  if (open) lockBodyScroll()
  else unlockBodyScroll()
})
onBeforeUnmount(() => {
  if (mobileOpen.value) unlockBodyScroll()
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
    class="sticky top-0 z-50 [transition:box-shadow_300ms_cubic-bezier(0.33,1,0.68,1),translate_400ms_cubic-bezier(0.22,1,0.36,1)] [will-change:translate] motion-reduce:transition-none"
    :class="[
      barHidden ? '-translate-y-full' : 'translate-y-0',
      // shadow conveys separation on scroll; suppressed while a panel is open so the
      // bar reads as one clean surface with the floating panel
      showShadow && !menuVisible ? 'shadow-2xs' : 'shadow-none',
      transparent ? '-mb-[60px]' : '',
      // Error page only: the page below is a short, mostly-empty column, so the
      // scroll-driven shadow never fires and the bar would float unanchored.
      onErrorPage ? 'border-b border-black/10' : '',
    ]"
    @keydown.esc="escClose"
  >
    <!-- White surface: instead of cross-fading background-color in place (which
         mid-fade reads as a muddy translucent slab bleaching the hero image), a
         fully-opaque white sheet slides down behind the bar content — the same
         motion language as the bar's own hide/reveal. Clipped by its own wrapper
         (the header can't be overflow-hidden: the mega-menu panel hangs below). -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute inset-0 bg-white transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="solid ? 'translate-y-0' : '-translate-y-[101%]'"
      />
    </div>

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

    <!-- Promo strip rides at the top of this sticky, scroll-revealing header (so
         it hides on scroll-down and returns on scroll-up until dismissed). Its
         own 36px height + the transparent `-mb-[60px]` keep the hero offset the
         same as when it was a separate strip. -->
    <AnnouncementBar />

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
              :prefetch-on="navPrefetchOn"
              class="rounded-full px-4 py-2 text-sm font-light transition-colors"
              :class="solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10'"
              :active-class="solid ? 'bg-black/[0.06] font-normal' : 'bg-white/15 font-normal'"
            >
              {{ item.label }}
            </NuxtLink>

            <NuxtLink
              v-else
              :ref="(el) => setTrigger(item.audience, el)"
              :to="localePath(item.to)"
              :prefetch-on="navPrefetchOn"
              class="rounded-full px-4 py-2 text-sm font-light transition-colors"
              :class="[
                solid ? 'text-dark hover:bg-black/5' : 'text-white hover:bg-white/10',
                openMenu === item.audience ? 'bg-black/5 font-medium' : '',
              ]"
              :active-class="solid ? 'bg-black/[0.06] font-normal' : 'bg-white/15 font-normal'"
              :aria-expanded="openMenu === item.audience"
              aria-haspopup="true"
              :aria-controls="`mega-${item.audience}`"
              @click.capture="onTriggerActivate($event, item.audience)"
              @mouseenter="scheduleOpen(item.audience)"
              @mouseleave="scheduleClose"
              @keydown.down.prevent="openAndFocus(item.audience)"
            >
              {{ item.label }}
            </NuxtLink>
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
        <!-- The bar↔card gap is PADDING (pt-2), not margin, so it belongs to this
             pointer-events-auto box: moving trigger → gap → card stays hovered,
             leaving no dead zone that would flicker the panel closed. -->
        <div
          v-if="openMenu"
          class="pointer-events-auto pt-2"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
        >
          <!-- Resizing card frame: persists across an Иргэнд ↔ Бизнесд switch, so
               `.t-resize` tweens its measured width between the two menus. The card
               chrome (bg/shadow/ring/rounding) lives HERE so overflow-hidden clips
               the inner content without clipping the box-shadow. Capped to the
               viewport so a wide menu can't force a horizontal scrollbar. -->
          <div
            class="t-resize max-w-[calc(100vw-2rem)] shrink-0 overflow-hidden rounded-[24px] bg-white shadow-[0_16px_44px_-24px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.05]"
            :style="megaSize"
          >
            <!-- Inner content remounts per menu (keyed) to replay the pop/swap; it
                 stays at its natural width (w-max) so the frame clips it during the
                 tween instead of reflowing the columns. -->
            <div
              ref="megaContent"
              :id="`mega-${openMenu}`"
              :key="openMenu"
              role="region"
              :aria-label="menus[openMenu].label"
              class="w-max"
              :class="closing ? 'mega-pop-out' : swapped ? 'mega-swap' : 'mega-pop'"
            >
              <NavMegaMenu
                :links="menus[openMenu].links"
                :promo="menus[openMenu].promo"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tap-outside-to-close scrim for the mobile drawer, mirroring the desktop
         mega-menu scrim above (which is lg:block, so it never covered this case).
         Starts at top-full so the nav and announcement bar stay crisp. Sits below
         the panel's z-40 — without an explicit z the positioned scrim would paint
         over it. -->
    <div
      v-if="mobileOpen"
      class="absolute inset-x-0 top-full z-30 h-screen bg-black/20 lg:hidden"
      aria-hidden="true"
      @click="mobileOpen = false"
    />

    <!-- mobile menu — solid white panel (readable in both modes), overlays content.
         Height animates via the CSS grid-rows 0fr→1fr trick (reliable, no JS). -->
    <div
      class="absolute inset-x-0 top-full z-40 grid bg-white transition-[grid-template-rows,border-color] duration-300 ease-out motion-reduce:transition-none lg:hidden"
      :class="mobileOpen ? 'grid-rows-[1fr] border-black/10 shadow-2xs' : 'grid-rows-[0fr] border-transparent'"
      :aria-hidden="!mobileOpen"
    >
      <div class="overflow-hidden">
        <!-- Subtract the announcement strip as well as the 60px nav row: the panel
             is anchored at top-full of a header that is 96px tall while the bar is
             up, so `100dvh - 60px` ended 36px below the fold — and because the
             header is sticky, scrolling can't bring that back. --announcement-h is
             global (main.css) and eases to 0 when the bar is dismissed. -->
        <nav class="mx-auto flex max-h-[calc(100dvh-60px-var(--announcement-h,0px))] max-w-7xl flex-col gap-1 overflow-y-auto px-4 py-3">
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

            <!-- mega items: the label links to its section page; the chevron
                 toggles the sub-links accordion. -->
            <div v-else>
              <div class="flex items-center rounded-[var(--radius-sm)] text-dark transition-colors hover:bg-black/5">
                <NuxtLink
                  :to="localePath(item.to)"
                  :tabindex="mobileOpen ? undefined : -1"
                  class="flex-1 px-3 py-2.5 text-sm font-light"
                  active-class="font-normal"
                >
                  {{ item.label }}
                </NuxtLink>
                <button
                  type="button"
                  :tabindex="mobileOpen ? undefined : -1"
                  class="flex items-center self-stretch px-3"
                  :aria-label="item.label"
                  :aria-expanded="mobileExpanded === item.audience"
                  @click="mobileExpanded = mobileExpanded === item.audience ? null : item.audience"
                >
                  <Icon
                    name="lucide:chevron-down"
                    class="size-4 text-black/50 transition-transform duration-200"
                    :class="mobileExpanded === item.audience ? 'rotate-180' : ''"
                    aria-hidden="true"
                  />
                </button>
              </div>
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
