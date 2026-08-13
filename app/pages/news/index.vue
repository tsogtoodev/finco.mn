<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale, t } = useI18n()
const localePath = useLocalePath()

const provider = useCmsProvider()
const { data: news } = await useAsyncData(
  () => `news-index-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['news'][]>('news', { locale: locale.value })
      : queryCollection('news')
          .where('locale', '=', locale.value)
          .order('publishedAt', 'DESC')
          .all(),
  { watch: [locale] },
)

useSeoMeta({ title: () => t('nav.news') })

const FEATURED_COUNT = 3
const featured = computed(() => {
  const all = news.value ?? []
  return [...all.filter((n) => n.featured), ...all.filter((n) => !n.featured)].slice(0, FEATURED_COUNT)
})
const listAll = computed(() => news.value ?? [])

const PAGE_SIZE = 5
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(listAll.value.length / PAGE_SIZE)))
const pageItems = computed(() =>
  listAll.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
watch(news, () => { page.value = 1 })

const listEl = ref<HTMLElement | null>(null)
function goTo(p: number) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  listEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const featuredEl = ref<HTMLElement | null>(null)
const hydrated = ref(false)
const featuredRevealed = ref(false)
const listRevealed = ref(false)
let revealObserver: IntersectionObserver | null = null
const revealDelay = (i: number) => `${Math.min(i, 6) * 80}ms`

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    featuredRevealed.value = true
    listRevealed.value = true
    return
  }
  hydrated.value = true
  revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      if (e.target === featuredEl.value) featuredRevealed.value = true
      if (e.target === listEl.value) listRevealed.value = true
      revealObserver?.unobserve(e.target)
    }
    if (featuredRevealed.value && listRevealed.value) {
      revealObserver?.disconnect()
      revealObserver = null
    }
  }, { threshold: 0.15 })
  if (featuredEl.value) revealObserver.observe(featuredEl.value)
  if (listEl.value) revealObserver.observe(listEl.value)
})
onBeforeUnmount(() => {
  revealObserver?.disconnect()
})

const pageNumbers = computed<(number | '…')[]>(() => {
  const n = totalPages.value
  const c = page.value
  if (n <= 8) return Array.from({ length: n }, (_, i) => i + 1)
  if (c <= 5) return [1, 2, 3, 4, 5, 6, '…', n]
  if (c >= n - 4) return [1, '…', n - 5, n - 4, n - 3, n - 2, n - 1, n]
  return [1, '…', c - 1, c, c + 1, '…', n]
})

function fmtDate(d?: string) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('.')
}
</script>

<template>
  <div class="bg-white">
    <section class="px-6 py-14 sm:py-20">
      <div class="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 text-center">
        <h1 class="flex flex-wrap justify-center gap-x-[0.3em] font-display text-[32px] font-semibold tracking-[0.01em] text-black/80 sm:text-[40px]">
          <BlurText :text="t('newsPage.heroTitle')" as="span" animate-by="words" :delay="60" />
          <BlurText
            :text="t('newsPage.heroAccent')"
            as="span"
            animate-by="words"
            :delay="60"
            :start-delay="0.06"
            class="text-accent"
          />
        </h1>
        <BlurText
          :text="t('newsPage.subtitle')"
          as="p"
          animate-by="words"
          :delay="20"
          :start-delay="0.1"
          class="justify-center text-base font-extralight tracking-[0.01em] text-black/50 sm:text-lg"
        />
      </div>
    </section>

    <section v-if="featured.length" ref="featuredEl" class="news-featured px-6 py-14 sm:py-20">
      <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-8 sm:gap-12">
        <h2 class="font-display text-2xl font-medium tracking-[0.01em] text-black/80 sm:text-[28px]">
          {{ t('newsPage.featured') }}
        </h2>
        <div class="grid gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
          <NewsCard
            v-for="(n, i) in featured"
            :key="n.slug"
            :item="n"
            compact
            :class="featuredRevealed ? 'carousel-reveal' : hydrated ? 'carousel-pre' : ''"
            :style="{ animationDelay: featuredRevealed ? revealDelay(i) : undefined }"
          />
        </div>
      </div>
    </section>

    <section v-if="listAll.length" ref="listEl" class="scroll-mt-24 px-6 pb-20 pt-14 sm:pb-30 sm:pt-20">
      <div class="mx-auto flex w-full max-w-[1200px] flex-col">
        <h2 class="font-display text-2xl font-medium tracking-[0.01em] text-[#323232] sm:text-[28px]">
          {{ t('newsPage.recent') }}
        </h2>

        <ul class="mt-8 flex flex-col divide-y divide-black/10">
          <li v-for="(n, i) in pageItems" :key="n.slug" class="py-8 first:pt-0">
            <NuxtLink
              :to="localePath(`/news/${n.slug}`)"
              class="group flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8"
              :class="listRevealed ? 'carousel-reveal' : hydrated ? 'carousel-pre' : ''"
              :style="{ animationDelay: listRevealed ? revealDelay(i) : undefined }"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-3">
                <span class="text-sm font-extralight text-black/40">{{ fmtDate(n.publishedAt) }}</span>
                <h3 class="font-display text-lg font-medium text-black/90 transition-colors group-hover:text-accent">
                  {{ n.title }}
                </h3>
                <p v-if="n.summary" class="line-clamp-2 text-base font-extralight leading-6 text-black/60">
                  {{ n.summary }}
                </p>
              </div>
              <div class="h-[184px] w-full shrink-0 overflow-hidden rounded-[8px] rounded-tr-[90px] bg-muted sm:w-[368px]">
                <NuxtImg
                  v-if="n.image"
                  :src="n.image"
                  :alt="n.title"
                  loading="lazy"
                  sizes="368px"
                  class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="size-full bg-gradient-to-br from-primary/15 via-accent/10 to-teal/15" />
              </div>
            </NuxtLink>
          </li>
        </ul>

        <nav v-if="totalPages > 1" class="mt-12 flex flex-wrap items-center justify-center gap-1 sm:mt-20" aria-label="Pagination">
          <template v-for="(p, i) in pageNumbers" :key="`${p}-${i}`">
            <span v-if="p === '…'" class="grid size-10 shrink-0 place-items-center text-black/60">
              <Icon name="lucide:ellipsis" class="size-4" />
            </span>
            <button
              v-else
              type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full text-sm transition-colors"
              :class="p === page ? 'bg-[#e6e8ea] text-black' : 'text-black/60 hover:bg-black/5'"
              :aria-current="p === page ? 'page' : undefined"
              @click="goTo(p)"
            >
              {{ p }}
            </button>
          </template>
          <button
            type="button"
            class="grid size-10 shrink-0 place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="page === 1"
            :aria-label="t('newsPage.prevPage')"
            @click="goTo(page - 1)"
          >
            <Icon name="lucide:chevron-left" class="size-5" />
          </button>
          <button
            type="button"
            class="grid size-10 shrink-0 place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="page === totalPages"
            :aria-label="t('newsPage.nextPage')"
            @click="goTo(page + 1)"
          >
            <Icon name="lucide:chevron-right" class="size-5" />
          </button>
        </nav>
      </div>
    </section>

    <p v-if="!news?.length" class="py-24 text-center text-muted-foreground">—</p>
  </div>
</template>

<style scoped>
.news-featured {
  background: rgba(45, 224, 198, 0.05);
}
</style>