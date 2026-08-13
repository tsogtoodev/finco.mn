<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const dismissed = useCookie<boolean>('finco_announcement_dismissed', {
  default: () => false,
  sameSite: 'lax',
})

const COLLAPSE_MS = 420
const collapsing = ref(false)
let collapseTimer: ReturnType<typeof setTimeout> | undefined

function dismiss() {
  if (collapsing.value) return
  collapsing.value = true
  collapseTimer = setTimeout(() => {
    dismissed.value = true
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
