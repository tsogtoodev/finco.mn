<script setup lang="ts">
// Dismissible promo strip above the nav (Figma node 1:12280). Full-bleed, 36px,
// near-black bg, centered teal bolt + message + teal CTA, dismiss ✕ pinned right.
// Not sticky — it scrolls away with the page; only the nav row sticks. When
// dismissed it is removed from the flow, so the sticky nav sits flush at top:0.
//
// Dismissal persists for the browser session via a cookie. useCookie is read on
// the server, so a dismissed bar never flashes in before hydration.
const { t } = useI18n()
const localePath = useLocalePath()

// Copy comes from the CMS (`announcement` collection); useAnnouncement falls
// back to the i18n strings when the record is missing or the CMS is down.
const content = await useAnnouncement()

// An absolute URL is an external campaign link — NuxtLink handles the target,
// but the locale prefix must NOT be prepended to it.
const isExternal = computed(() => /^https?:\/\//.test(content.value.ctaUrl))
const ctaTo = computed(() =>
  isExternal.value ? content.value.ctaUrl : localePath(content.value.ctaUrl),
)
const showCta = computed(() => Boolean(content.value.ctaLabel && content.value.ctaUrl))

const dismissed = useCookie<boolean>('finco_announcement_dismissed', {
  default: () => false,
  sameSite: 'lax',
  // No maxAge → session cookie: cleared when the browser closes, kept across reloads.
})

// Dismiss is a two-phase exit so the nav slides up instead of jumping: flip
// `collapsing` (adds .is-collapsing → CSS eases --announcement-h, and thus the
// bar's height + the nav's flow position, to 0), then unmount once it settles.
// COLLAPSE_MS must match the --announcement-h transition in main.css.
const COLLAPSE_MS = 420
const collapsing = ref(false)
let collapseTimer: ReturnType<typeof setTimeout> | undefined

function dismiss() {
  if (collapsing.value) return
  collapsing.value = true
  collapseTimer = setTimeout(() => {
    dismissed.value = true // persists the cookie + drops the bar from the DOM
  }, COLLAPSE_MS)
}

onBeforeUnmount(() => clearTimeout(collapseTimer))
</script>

<template>
  <div
    v-if="content.enabled && content.text && !dismissed"
    class="announcement-bar relative h-[var(--announcement-h)] overflow-hidden bg-announcement text-white"
    :class="{ 'is-collapsing': collapsing }"
  >
    <div class="relative mx-auto flex h-9 max-w-7xl items-center justify-center gap-3 px-12">
      <p class="flex min-w-0 items-center gap-1.5 text-sm">
        <span class="truncate text-white/75">{{ content.text }}</span>
      </p>

      <NuxtLink
        v-if="showCta"
        :to="ctaTo"
        :target="isExternal ? '_blank' : undefined"
        :rel="isExternal ? 'noopener noreferrer' : undefined"
        class="flex shrink-0 items-center gap-0.5 text-sm text-teal transition-opacity hover:opacity-80"
      >
        {{ content.ctaLabel }}
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>

      <button
        type="button"
        class="absolute right-4 -mr-2 flex size-10 items-center justify-center text-white/70 transition-colors hover:text-white"
        :aria-label="t('announcement.dismiss')"
        @click="dismiss()"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
