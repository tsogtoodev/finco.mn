<script setup lang="ts">
import type { NuxtError } from '#app'
import { ParticleStatus, glyphTextBox, sanitizeGlyphText, statusCodeSize } from '@tsogtoodev/particle-glock';

const props = defineProps<{ error: NuxtError }>()

const head = useLocaleHead({ dir: true, lang: true })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs }))

const { t } = useI18n()

const isDev = import.meta.dev
const is404 = computed(() => props.error?.statusCode === 404)
const copy = computed(() => (is404.value ? 'errorPage.notFound' : 'errorPage.error'))

const title = computed(() => t(`${copy.value}.title`))

// ── Particle mark sizing ───────────────────────────────────────────────────
// ParticleStatus draws the code with the `text` headline stacked beneath it,
// both sized by cap height, and lets each width follow its own glyph run. The
// block's width is therefore whichever of the two is wider — and the headline
// wins by a lot: at cap height 100 the code "404" is 274 grid units while
// "SOMETHING WENT WRONG" is 1964, over 7x wider. Sizing off the code alone
// (which is all v0.1 needed) would put the headline straight through the side
// of the viewport.
//
// This matters more than it looks: the particles render on a full-viewport
// fixed overlay positioned from the host's box, so a CSS transform on the host
// would desync the particles from the mark. The size has to come from the props.
const CODE_CAP = 120 // desktop cap height of the digits, px
const TEXT_CAP = 28 // desktop cap height of the headline, px
const GAP = 24 // desktop gap between the two, px

// The glyph set is caps-only and drops what it can't draw. Every current title
// (en + mn, including Mongolian Cyrillic) resolves with no missing glyphs, but
// titles are editable copy — one em dash shouldn't be able to throw *on the
// error page*, so measure the sanitized string and fall back rather than crash.
function safeTextWidth(text: string, cap: number): number {
  try {
    return glyphTextBox(sanitizeGlyphText(text), cap).width
  }
  catch {
    return 0
  }
}

const naturalW = computed(() => {
  const code = statusCodeSize(props.error?.statusCode ?? 500)
  // statusCodeSize reports grid units against a cap height of 100.
  const codeW = (code.width / code.capHeight) * CODE_CAP
  return Math.max(codeW, safeTextWidth(title.value, TEXT_CAP))
})

// The particle overlay is a full-viewport fixed canvas appended to <body>, and
// the package defaults it to z-index 2147483000 — above the sticky header
// (z-50), so the nav's mega-menu panel rendered *behind* it. It's
// pointer-events:none, so this was a paint-order bug only, never a click trap.
// Sit it above the page content but below every piece of site chrome:
// AutoNextNews 40 · header/FAB 50 · Beep QR popover 70 · AppDialog 100.
const PARTICLE_Z = 20

const hostEl = ref<HTMLElement | null>(null)
const availW = ref(0)
let resizeObserver: ResizeObserver | null = null
function measure() {
  if (hostEl.value) availW.value = hostEl.value.clientWidth
}

// One scale for the whole block, so the code, headline and gap stay in
// proportion. SSR / pre-measure has no box to read yet, so it renders at the
// desktop size and the wrapper's overflow-hidden clips it until the observer
// fires — same approach as before, just now driven by the wider of the two runs.
const scale = computed(() =>
  availW.value ? Math.min(1, availW.value / naturalW.value) : 1,
)
// Floor, don't round, the two cap heights: width is linear in cap height, so
// rounding *up* scales the block back over the budget. That is not theoretical
// — "ХУУДАС ОЛДСОНГҮЙ" at 375px wants cap 21.58, and rounding it to 22 pushed
// the headline to 350px inside a 343px column. Flooring can only shrink it.
const particleHeight = computed(() => Math.floor(CODE_CAP * scale.value))
const particleTextSize = computed(() => Math.floor(TEXT_CAP * scale.value))
// Gap is vertical only, so it can round normally.
const particleGap = computed(() => Math.round(GAP * scale.value))

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (hostEl.value) resizeObserver.observe(hostEl.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

useSeoMeta({
  title: () => `${props.error?.statusCode ?? 500} — ${t(`${copy.value}.title`)}`,
})
</script>

<template>
  <NuxtLayout>
    <section class="mx-auto flex min-h-[calc(100svh-320px)] max-w-[696px] flex-col items-center justify-center px-4 py-20">
      <!-- w-full so the observer reads the real available width; overflow-hidden
           so the pre-hydration render (still at desktop size) is clipped rather
           than scrolling the page sideways. -->
      <div ref="hostEl" class="flex w-full justify-center overflow-hidden">
        <ParticleStatus
          :code="error?.statusCode"
          :text="title"
          :height="particleHeight"
          :text-size="particleTextSize"
          :gap="particleGap"
          :z-index="PARTICLE_Z"
          preset="snap"
          color="#28303f"
          sound
        />
      </div>

      <div
        class="flex w-full flex-col items-center text-center"
        :class="is404 ? 'mt-12 gap-8' : 'gap-8'"
      >
        <div class="flex flex-col gap-6">
          <!-- The headline is now drawn as particles above. Kept in the DOM but
               visually hidden: the particle mark is a <canvas>, so without this
               the page would have no real <h1> for the document outline or a
               screen reader — and showing it too would print the same words
               twice, stacked. -->
          <h1 class="sr-only">
            {{ title }}
          </h1>
          <p class="font-display text-base font-light leading-6 text-dark/80">
            {{ t(`${copy}.subtitle`) }}
          </p>
        </div>

        <pre
          v-if="isDev && !is404 && error?.message"
          class="max-w-full overflow-x-auto rounded-[var(--radius)] bg-secondary px-4 py-3 text-left text-xs text-secondary-foreground"
        >{{ error.message }}</pre>

        <AppButton to="/" variant="outline" size="lg" class="h-12 bg-white px-6 text-dark">
          {{ t('errorPage.backHome') }}
        </AppButton>
      </div>
    </section>
  </NuxtLayout>
</template>
