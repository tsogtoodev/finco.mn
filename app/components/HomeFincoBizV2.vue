<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  subtext: page.value?.fincobiz?.subtext ?? t('home.fincobiz.subtext'),
}))

type CardId = 'eligibility' | 'receivables' | 'request'

const cards = [
  { id: 'eligibility' as CardId, dot: '#12b76a', bar: '#12b76a', img: 3, art: '61.67%', w: 1421 },
  { id: 'receivables' as CardId, dot: '#4e83fd', bar: '#4e83fd', img: 1, art: '58.81%', w: 1355 },
  { id: 'request' as CardId, dot: '#f7b23b', bar: '#f7b23b', img: 2, art: '60.76%', w: 1400 },
]

function cardCopy(id: CardId) {
  const cms = page.value?.fincobiz
  const card = cms?.cards?.[id]
  const field = (k: 'tab' | 'heading' | 'body') =>
    typeof card === 'string' ? (k === 'tab' ? card : undefined) : card?.[k]

  return {
    tab: field('tab') || t(`home.fincobiz.cards.${id}.tab`),
    heading: field('heading') || (id === 'request' ? cms?.calloutHeading : undefined) || t(`home.fincobiz.cards.${id}.heading`),
    body: field('body') || (id === 'request' ? cms?.calloutSubtext : undefined) || t(`home.fincobiz.cards.${id}.body`),
  }
}

const order = ref<CardId[]>(['request', 'receivables', 'eligibility'])
const depth = (id: CardId) => order.value.indexOf(id)
function promote(id: CardId) {
  if (order.value[0] === id) return
  order.value = [id, ...order.value.filter((c) => c !== id)]
}

const AUTO_MS = 5000
let timer: ReturnType<typeof setInterval> | null = null
let autoObserver: IntersectionObserver | null = null
let hovering = false
let onScreen = false

const rootEl = ref<HTMLElement | null>(null)

const hydrated = ref(false)
const revealed = ref(false)
let revealObserver: IntersectionObserver | null = null

const REVEAL_ORDER: CardId[] = ['request', 'receivables', 'eligibility']
const revealDelay = (id: CardId) => `${REVEAL_ORDER.indexOf(id) * 80}ms`

function advance() {
  const back = order.value[order.value.length - 1]
  if (back) promote(back)
}
function stopAuto() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function startAuto() {
  stopAuto()
  if (!onScreen || hovering || document.hidden) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(advance, AUTO_MS)
}
function onEnter() {
  hovering = true
  stopAuto()
}
function onLeave() {
  hovering = false
  startAuto()
}
function onVisibility() {
  if (document.hidden) stopAuto()
  else startAuto()
}
function onPromote(id: CardId) {
  promote(id)
  startAuto()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  if (!('IntersectionObserver' in window)) {
    onScreen = true
    revealed.value = true
    startAuto()
    return
  }
  hydrated.value = true
  autoObserver = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]?.isIntersecting ?? false
    if (onScreen) startAuto()
    else stopAuto()
  }, { threshold: 0.2 })
  if (rootEl.value) autoObserver.observe(rootEl.value)

  revealObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      revealed.value = true
      revealObserver?.disconnect()
      revealObserver = null
    }
  }, { threshold: 0.15 })
  if (rootEl.value) revealObserver.observe(rootEl.value)
})

onBeforeUnmount(() => {
  autoObserver?.disconnect()
  autoObserver = null
  revealObserver?.disconnect()
  revealObserver = null
  stopAuto()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <section ref="rootEl" class="relative overflow-hidden py-24 lg:py-28 lg:pb-[80px]" style="background: linear-gradient(180deg, rgba(19, 207, 185, 0.00) 0%, rgba(19, 207, 185, 0.05) 100%);">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <BlobMeshBackground
        top-width="0.45"
        :bottom-width="1"
        :speed="0.8"
        :opacity="65"
        :center-y="0.55"
        bg-color="#C2FFFB"
        color1="184,255,251"
        color2="215,242,240"
        color3="222,201,255"
      />
    </div>

    <div class="relative mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="max-w-[750px]">
          <img src="/images/home/fincobiz-logo.svg" alt="FincoBiz" class="block h-auto w-[190px]">
          <p class="mt-4 text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
            {{ copy.subtext }}
          </p>
        </div>
        <AppButton to="/business" variant="accent" pill arrow class="h-10 shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>

      <MotionReveal :delay="0.1" class="relative mt-16">
        <div class="[container-type:inline-size]">
          <div
            class="biz-stack relative pt-[max(8cqw,88px)]"
            @pointerenter="onEnter"
            @pointerleave="onLeave"
          >
            <div class="relative">
              <div
                v-for="card in cards"
                :key="card.id"
                :class="[
                  card.id === 'request' ? 'relative' : 'absolute inset-0',
                  revealed ? 'carousel-reveal' : hydrated ? 'carousel-pre' : '',
                ]"
                :style="{
                  '--depth': depth(card.id),
                  zIndex: 3 - depth(card.id),
                  animationDelay: revealed ? revealDelay(card.id) : undefined,
                }"
              >
                <article
                  class="biz-card flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06] [will-change:transform] lg:h-[450px]"
                  :class="depth(card.id) === 0 ? 'is-front' : ''"
                  @click="onPromote(card.id)"
                >
                <button
                  type="button"
                  class="flex w-full shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3 text-left sm:py-3.5"
                  :aria-expanded="depth(card.id) === 0"
                >
                  <span aria-hidden="true" class="biz-dot" :style="{ background: card.dot }" />
                  <span class="text-sm font-normal text-black/80 sm:text-base">
                    {{ cardCopy(card.id).tab }}
                  </span>
                </button>

                <div class="relative flex min-h-0 flex-1 flex-col lg:block">
                  <div
                    class="relative z-10 flex flex-col gap-4 p-5 lg:absolute lg:left-[4.6875%] lg:top-1/2 lg:h-[300px] lg:w-[34.72%] lg:-translate-y-1/2 lg:justify-between lg:gap-0 lg:p-0"
                  >
                    <div class="flex flex-col gap-3 lg:gap-4">
                      <div class="flex items-start gap-[18px] lg:gap-[22px]">
                        <span
                          aria-hidden="true"
                          class="w-1 shrink-0 self-stretch rounded-full"
                          :style="{ background: card.bar }"
                        />
                        <h3
                          class="font-display text-xl font-bold leading-7 text-[#212947] lg:text-[20px] lg:leading-[]"
                        >
                          {{ cardCopy(card.id).heading }}
                        </h3>
                      </div>
                      <p
                        class="text-sm font-extralight leading-[22px] text-black/60 lg:text-[18px] lg:leading-6 lg:tracking-[0.18px]"
                      >
                        {{ cardCopy(card.id).body }}
                      </p>
                    </div>

                    <AppButton
                      to="https://biz.finco.mn?utm_source=finco_home&utm_medium=card"
                      variant="ghost"
                      arrow
                      class="h-10 self-start text-foreground"
                      :class="depth(card.id) === 0 ? '' : 'pointer-events-none'"
                    >
                      {{ t('common.learnMore') }}
                    </AppButton>
                  </div>

                  <NuxtImg
                    :src="`/images/home/fincobiz-${card.img}.png`"
                    alt=""
                    aria-hidden="true"
                    :width="card.w"
                    :height="794"
                    sizes="100vw lg:720px"
                    class="mt-auto block w-full object-cover object-right lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-full -mr-px"
                    :style="{ '--art-w': card.art }"
                  />
                </div>
              </article>
              </div>
            </div>
          </div>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>

<style scoped>
.biz-stack {
  --peek: max(4cqw, 44px);
}

.biz-card {
  transform: translateY(calc(var(--depth) * var(--peek) * -1)) scale(calc(1 - var(--depth) * 0.04));
  transform-origin: top center;
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.6s ease,
    filter 0.6s ease;
}
.biz-card:not(.is-front) {
  cursor: pointer;
  filter: brightness(0.985);
}
.biz-card:not(.is-front):hover {
  transform: translateY(calc(var(--depth) * var(--peek) * -1 - 6px)) scale(calc(1 - var(--depth) * 0.04));
  filter: brightness(1);
}
.biz-card.is-front > button {
  cursor: default;
}

@media (min-width: 1024px) {
  .biz-card img {
    width: var(--art-w);
  }
}

.biz-dot {
  width: 15px;
  height: 15px;
  flex: none;
  border-radius: 62% 38% 55% 45% / 55% 62% 38% 45%;
}

@media (prefers-reduced-motion: reduce) {
  .biz-card {
    transition-duration: 0.01ms;
  }
}
</style>
