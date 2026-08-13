<script setup lang="ts">
import { navPromoArt, navPromos, type NavAudience } from '~/data/navMenus'

const props = withDefaults(defineProps<{ transparent?: boolean }>(), {
  transparent: false,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const nuxtError = useError()
const onErrorPage = computed(() => Boolean(nuxtError.value))

type NavItem =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'menu'; audience: NavAudience; label: string; to: string }

const navItems = computed<NavItem[]>(() => [
  { kind: 'link', to: '/about', label: t('nav.about') },
  { kind: 'menu', audience: 'individual', label: t('nav.products'), to: '/products' },
  { kind: 'menu', audience: 'business', label: t('nav.business'), to: '/business' },
  { kind: 'link', to: '/services', label: t('nav.trust') },
  { kind: 'link', to: '/news', label: t('nav.news') },
])

const navPrefetchOn = { interaction: true, visibility: false } as const

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

const openMenu = ref<NavAudience | null>(null)
const closing = ref(false)
const swapped = ref(false)
let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined
let exitTimer: ReturnType<typeof setTimeout> | undefined
const OPEN_DELAY = 110
const CLOSE_DELAY = 150
const EXIT_MS = 180

function clearTimers() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
}

function showMenu(a: NavAudience) {
  clearTimers()
  clearTimeout(exitTimer)
  swapped.value = openMenu.value !== null && openMenu.value !== a
  closing.value = false
  openMenu.value = a
}

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
  if (openMenu.value) {
    showMenu(a)
    return
  }
  openTimer = setTimeout(() => showMenu(a), OPEN_DELAY)
}

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
  if (closing.value && openMenu.value) showMenu(openMenu.value)
}
function closeNow() {
  hideMenu()
}

function hardClose() {
  clearTimers()
  clearTimeout(exitTimer)
  closing.value = false
  openMenu.value = null
  megaSize.value = {}
}

const megaContent = ref<HTMLElement | null>(null)
const megaSize = ref<Record<string, string>>({})
async function measureMega() {
  await nextTick()
  const el = megaContent.value
  if (!el) return
  const prevCap = el.style.maxWidth
  el.style.maxWidth = 'none'
  const natural = el.offsetWidth
  el.style.maxWidth = prevCap
  megaSize.value = { width: `${Math.min(natural, window.innerWidth - 32)}px` }
}
watch(openMenu, (v) => { if (v) measureMega() })

function onMegaResize() { if (openMenu.value) measureMega() }

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

const navWrap = ref<HTMLElement | null>(null)
function onFocusOut(e: FocusEvent) {
  if (!openMenu.value) return
  const next = e.relatedTarget as Node | null
  if (!next || !navWrap.value?.contains(next)) closeNow()
}

const scrolled = ref(false)
const pastHero = ref(false)
const hidden = ref(false)
let lastY = 0
const DIR_THRESHOLD = 4
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 8
  pastHero.value = y > 80
  const delta = y - lastY
  if (y < 80) hidden.value = false
  else if (delta > DIR_THRESHOLD && y > 120) hidden.value = true
  else if (delta < -DIR_THRESHOLD) hidden.value = false
  lastY = y
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openMenu.value) escClose()
}

function warmPromoArt() {
  if (!window.matchMedia('(min-width: 1024px)').matches) return
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn?.saveData || /(?:^|-)2g$/.test(conn?.effectiveType ?? '')) return

  const img = useImage()
  for (const art of navPromoArt) {
    try {
      const { srcset, sizes } = img.getSizes(art.src, { sizes: art.sizes })
      const el = new Image()
      if (sizes) el.sizes = sizes
      if (srcset) el.srcset = srcset
      el.src = img(art.src)
    }
    catch {}
  }
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onMegaResize, { passive: true })

  if ('requestIdleCallback' in window) window.requestIdleCallback(warmPromoArt, { timeout: 4000 })
  else setTimeout(warmPromoArt, 2000)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onMegaResize)
  clearTimers()
  clearTimeout(exitTimer)
})

const mobileOpen = ref(false)
const mobileExpanded = ref<NavAudience | null>(null)
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  hardClose()
})

watch(mobileOpen, (open) => {
  if (open) lockBodyScroll()
  else unlockBodyScroll()
})
onBeforeUnmount(() => {
  if (mobileOpen.value) unlockBodyScroll()
})

const menuVisible = computed(() => openMenu.value !== null)

const solid = computed(
  () => !props.transparent || pastHero.value || mobileOpen.value || openMenu.value !== null,
)
const showScrim = computed(() => props.transparent && !solid.value)

const showShadow = computed(
  () => !mobileOpen.value && (props.transparent ? pastHero.value : scrolled.value),
)

const barHidden = computed(
  () => hidden.value && openMenu.value === null && !mobileOpen.value,
)
</script>

<template>
  <header
    class="sticky top-0 z-50 [transition:box-shadow_300ms_cubic-bezier(0.33,1,0.68,1),translate_400ms_cubic-bezier(0.22,1,0.36,1)] [will-change:translate] motion-reduce:transition-none"
    :class="[
      barHidden ? '-translate-y-full' : 'translate-y-0',
      showShadow && !menuVisible ? 'shadow-2xs' : 'shadow-none',
      transparent ? '-mb-[60px]' : '',
      onErrorPage ? 'border-b border-black/10' : '',
    ]"
    @keydown.esc="escClose"
  >
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute inset-0 bg-white transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :class="solid ? 'translate-y-0' : '-translate-y-[101%]'"
      />
    </div>

    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/35 to-transparent transition-opacity duration-300"
      :class="showScrim ? 'opacity-100' : 'opacity-0'"
    />

    <div
      v-if="openMenu"
      class="absolute inset-x-0 top-full z-40 hidden h-screen bg-black/10 backdrop-blur-[2.5px] lg:block"
      :class="closing ? 'scrim-fade-out' : 'scrim-fade'"
      aria-hidden="true"
      @click="closeNow"
    />

    <AnnouncementBar />

    <div
      ref="navWrap"
      class="relative z-50 mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-6 px-4"
      @focusout="onFocusOut"
    >
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

      <div class="pointer-events-none absolute inset-x-4 top-full z-50 hidden lg:flex lg:justify-center mr-30">
        <div
          v-if="openMenu"
          class="pointer-events-auto pt-2"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
        >
          <div
            class="t-resize max-w-[calc(100vw-2rem)] shrink-0 overflow-hidden rounded-[24px] bg-white shadow-[0_16px_44px_-24px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.05]"
            :style="megaSize"
          >
            <div
              ref="megaContent"
              :id="`mega-${openMenu}`"
              :key="openMenu"
              role="region"
              :aria-label="menus[openMenu].label"
              class="w-max max-w-full"
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

    <div
      v-if="mobileOpen"
      class="absolute inset-x-0 top-full z-30 h-screen bg-black/20 lg:hidden"
      aria-hidden="true"
      @click="mobileOpen = false"
    />

    <div
      class="absolute inset-x-0 top-full z-40 grid bg-white transition-[grid-template-rows,border-color] duration-300 ease-out motion-reduce:transition-none lg:hidden"
      :class="mobileOpen ? 'grid-rows-[1fr] border-black/10 shadow-2xs' : 'grid-rows-[0fr] border-transparent'"
      :aria-hidden="!mobileOpen"
    >
      <div class="overflow-hidden">
        <nav data-lenis-prevent class="mx-auto flex max-h-[calc(100dvh-60px-var(--announcement-h,0px))] max-w-7xl flex-col gap-1 overflow-y-auto px-4 py-3">
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
