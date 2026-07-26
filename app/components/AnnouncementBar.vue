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
    v-if="!dismissed"
    class="announcement-bar relative h-[var(--announcement-h)] overflow-hidden bg-announcement text-white"
    :class="{ 'is-collapsing': collapsing }"
  >
    <div class="relative mx-auto flex h-9 max-w-7xl items-center justify-center gap-3 px-12">
      <p class="flex min-w-0 items-center gap-1.5 text-sm">
        <svg
          viewBox="0 0 24 24"
          class="size-3.5 shrink-0 text-teal"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
        <span class="truncate text-white/75">{{ t('announcement.text') }}</span>
      </p>

      <NuxtLink
        :to="localePath('/products')"
        class="flex shrink-0 items-center gap-0.5 text-sm text-teal transition-opacity hover:opacity-80"
      >
        {{ t('announcement.cta') }}
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

      <!-- size-10 hit area around a size-6 glyph: this is the only way to reclaim
           the 36px strip, and at size-6 it was a 24×24 target. The negative margin
           keeps the glyph on its original optical position. -->
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
