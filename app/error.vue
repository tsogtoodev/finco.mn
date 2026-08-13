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

const CODE_CAP = 120
const TEXT_CAP = 28
const GAP = 24

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
  const codeW = (code.width / code.capHeight) * CODE_CAP
  return Math.max(codeW, safeTextWidth(title.value, TEXT_CAP))
})

const PARTICLE_Z = 20

const hostEl = ref<HTMLElement | null>(null)
const availW = ref(0)
let resizeObserver: ResizeObserver | null = null
function measure() {
  if (hostEl.value) availW.value = hostEl.value.clientWidth
}

const scale = computed(() =>
  availW.value ? Math.min(1, availW.value / naturalW.value) : 1,
)
const particleHeight = computed(() => Math.floor(CODE_CAP * scale.value))
const particleTextSize = computed(() => Math.floor(TEXT_CAP * scale.value))
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
