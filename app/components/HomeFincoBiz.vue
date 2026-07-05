<script setup lang="ts">
// FincoBiz showcase (Figma 1:14224): FincoBiz wordmark + intro + accent CTA,
// then the platform mockup as a live deck of three stacked browser cards.
// Clicking a peeked card brings it to the front (the others shift back one
// slot). The front "Зээлийн хүсэлт илгээх" card shows the baked platform
// artwork (fincobiz-mockup-body.png = the original mockup cropped to that
// card's body) overlaid with two white masks + crisp/translatable live text;
// the other two cards carry abstract skeleton UIs in the same design language.
// All geometry is % of the card / cqw of the stack so it tracks any width.
// Copy (subtext, callout, card tab titles) comes from the `pages` home doc's
// fincobiz group, with i18n as fallback.
const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  subtext: page.value?.fincobiz?.subtext ?? t('home.fincobiz.subtext'),
  calloutHeading: page.value?.fincobiz?.calloutHeading ?? t('home.fincobiz.calloutHeading'),
  calloutSubtext: page.value?.fincobiz?.calloutSubtext ?? t('home.fincobiz.calloutSubtext'),
}))
const cardTitle = (id: CardId) =>
  page.value?.fincobiz?.cards?.[id] ?? t(`home.fincobiz.cards.${id}`)

type CardId = 'eligibility' | 'receivables' | 'request'

const cards = [
  { id: 'eligibility' as CardId, dot: '#12b76a' },
  { id: 'receivables' as CardId, dot: '#4e83fd' },
  { id: 'request' as CardId, dot: '#f7b23b' },
]

// Front-first stacking order; depth 0 = front, 2 = back (matches the mockup).
const order = ref<CardId[]>(['request', 'receivables', 'eligibility'])
const depth = (id: CardId) => order.value.indexOf(id)
function promote(id: CardId) {
  if (order.value[0] === id) return
  order.value = [id, ...order.value.filter((c) => c !== id)]
}
</script>

<template>
  <section class="relative overflow-hidden bg-white py-24 lg:py-28">
    <div class="pointer-events-none absolute inset-0 [background:radial-gradient(55%_45%_at_72%_58%,rgba(76,65,216,0.07),transparent_70%)]" />

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

      <MotionReveal :delay="0.1" class="relative mt-24">
        <div class="[container-type:inline-size]">
          <!-- headroom for the two peeked headers above the front card -->
          <div class="biz-stack relative pt-[max(8cqw,88px)]">
            <div class="relative">
              <article
                v-for="card in cards"
                :key="card.id"
                class="biz-card flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_28px_70px_-34px_rgba(23,16,84,0.3)] ring-1 ring-black/[0.06] [will-change:transform]"
                :class="[
                  depth(card.id) === 0 ? 'is-front' : '',
                  card.id === 'request' ? 'relative' : 'absolute inset-0',
                ]"
                :style="{ '--depth': depth(card.id), zIndex: 3 - depth(card.id) }"
                @click="promote(card.id)"
              >
                <!-- browser-chrome header: the clickable, translatable tab -->
                <button
                  type="button"
                  class="flex w-full shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3 text-left sm:py-3.5"
                  :aria-expanded="depth(card.id) === 0"
                >
                  <span aria-hidden="true" class="biz-dot" :style="{ background: card.dot }" />
                  <span class="text-sm font-normal text-black/80 sm:text-base">
                    {{ cardTitle(card.id) }}
                  </span>
                </button>

                <!-- Зээлийн хүсэлт илгээх: baked artwork + live callout -->
                <div v-if="card.id === 'request'" class="relative">
                  <NuxtImg
                    src="/images/home/fincobiz-mockup-body.png"
                    :alt="copy.calloutHeading"
                    width="2872"
                    height="1322"
                    sizes="1200px"
                    class="block w-full"
                  />
                  <!-- Live callout (desktop): white masks cover the mockup's baked text -->
                  <div class="pointer-events-none absolute inset-0 hidden lg:block">
                    <div class="absolute bg-white" style="left:1.977%;top:7.858%;width:28.601%;height:15.968%" />
                    <div class="absolute bg-white" style="left:2.606%;top:25.708%;width:30.118%;height:19.788%" />
                    <h3
                      class="absolute whitespace-nowrap font-display font-semibold tracking-[0.01em] text-black"
                      style="left:3.088%;top:7.858%;font-size:2.4cqw;line-height:2.74cqw"
                    >
                      {{ copy.calloutHeading }}
                    </h3>
                    <p
                      class="absolute font-light tracking-[0.01em] text-black/60"
                      style="left:3.088%;top:18.081%;width:36.033%;font-size:1.2cqw;line-height:2.06cqw"
                    >
                      {{ copy.calloutSubtext }}
                    </p>
                  </div>
                </div>

                <!-- Авлагын мэдээлэл хянах: receivables-table skeleton -->
                <div v-else-if="card.id === 'receivables'" aria-hidden="true" class="relative min-h-0 flex-1 overflow-hidden">
                  <div class="absolute -bottom-[28%] -left-[10%] h-[85%] w-[58%] rounded-full bg-[radial-gradient(closest-side,rgba(76,65,216,0.16),rgba(45,212,191,0.1),transparent_72%)] blur-2xl" />
                  <div class="absolute left-[4.5%] right-[42%] top-[10%]">
                    <div class="h-[1.8cqw] w-[46%] rounded-full bg-black/[0.14]" />
                    <div class="mt-[3.5%] h-[1.1cqw] w-[68%] rounded-full bg-black/[0.06]" />
                    <div class="mt-[9%] space-y-[4.5%]">
                      <div v-for="(row, i) in [[62, '#12b76a'], [78, '#12b76a'], [54, '#f7b23b'], [70, '#12b76a']]" :key="i" class="flex items-center gap-[3%]">
                        <span class="size-[1.5cqw] shrink-0 rounded-full" :style="{ background: `${row[1]}b3` }" />
                        <span class="h-[1.1cqw] rounded-full bg-black/[0.07]" :style="{ width: `${row[0]}%` }" />
                        <span class="ml-auto h-[1.1cqw] w-[16%] shrink-0 rounded-full bg-black/[0.12]" />
                      </div>
                    </div>
                  </div>
                  <div class="absolute bottom-[12%] right-[4.5%] top-[10%] w-[31%] rounded-[1.2cqw] bg-white p-[2.4%] shadow-[0_16px_40px_-24px_rgba(23,16,84,0.25)] ring-1 ring-black/[0.05]">
                    <div class="h-[1.2cqw] w-[55%] rounded-full bg-black/[0.12]" />
                    <div class="absolute inset-x-[10%] bottom-[10%] top-[28%] flex items-end justify-between gap-[6%]">
                      <div v-for="(h, i) in [42, 64, 50, 82, 58, 70]" :key="i" class="w-full rounded-t-[0.5cqw]" :class="i === 3 ? 'bg-[#4c41d8]/60' : 'bg-[#4c41d8]/15'" :style="{ height: `${h}%` }" />
                    </div>
                  </div>
                </div>

                <!-- Зээлийн эрх шалгах: eligibility-score skeleton -->
                <div v-else aria-hidden="true" class="relative min-h-0 flex-1 overflow-hidden">
                  <div class="absolute -bottom-[28%] -right-[10%] h-[85%] w-[58%] rounded-full bg-[radial-gradient(closest-side,rgba(76,65,216,0.14),rgba(45,212,191,0.1),transparent_72%)] blur-2xl" />
                  <div class="absolute left-[4.5%] top-[12%] w-[40%]">
                    <div class="h-[1.8cqw] w-[78%] rounded-full bg-black/[0.14]" />
                    <div class="mt-[4%] h-[1.1cqw] w-full rounded-full bg-black/[0.06]" />
                    <div class="mt-[2.5%] h-[1.1cqw] w-[84%] rounded-full bg-black/[0.06]" />
                    <div class="mt-[10%] space-y-[5%]">
                      <div v-for="(w, i) in [58, 72, 48]" :key="i" class="flex items-center gap-[4%]">
                        <span class="size-[1.5cqw] shrink-0 rounded-full bg-[#12b76a]/70" />
                        <span class="h-[1.1cqw] rounded-full bg-black/[0.07]" :style="{ width: `${w}%` }" />
                      </div>
                    </div>
                  </div>
                  <!-- score donut: conic accent arc + white core -->
                  <div class="absolute right-[13%] top-1/2 size-[22cqw] -translate-y-1/2 rounded-full bg-[conic-gradient(#4c41d8_0deg_236deg,rgba(0,0,0,0.06)_236deg_360deg)]">
                    <div class="absolute inset-[11%] rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                      <div class="absolute left-1/2 top-1/2 h-[10%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/[0.14]" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>

<style scoped>
/* Deck geometry: depth d sits d peeks higher and 4% smaller, shrinking toward
   the top-right so deeper cards stair-step in from the left like the Figma
   artwork. Promotion just changes --depth per card — the transform transition
   carries the reorder (z-index snaps, but the moving card covers the swap). */
.biz-stack {
  --peek: max(4cqw, 44px);
}

.biz-card {
  transform: translateY(calc(var(--depth) * var(--peek) * -1)) scale(calc(1 - var(--depth) * 0.04));
  transform-origin: top right;
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.6s ease;
}

/* Back cards read as inactive: a whisper darker, full brightness + a nudge on
   hover as the click affordance. The front card is inert (promote no-ops). */
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

/* organic pebble, like the baked tab dots */
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
