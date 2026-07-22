<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// News article page rebuilt to Figma 663:14287: solid header, white page,
// 760px column — back pill, dotted date + 32px title, lede, rounded-24 cover,
// divider, markdown body, accent "view more news" CTA. A sticky tick-ruler on
// the left fills with accent as the article is read (progress % in accent).
// 404s when the slug/locale pair is missing (same contract as product/job
// detail pages).
const { locale, t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const provider = useCmsProvider()
const { data: article } = await useAsyncData(
  () => `news-${slug.value}-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['news'] | null>('news', { locale: locale.value, slug: slug.value })
      : queryCollection('news')
          .where('locale', '=', locale.value)
          .where('slug', '=', slug.value)
          .first(),
  { watch: [locale, slug] },
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

// "2026.12.22" — dotted date like the design.
const published = computed(() => {
  if (!article.value?.publishedAt) return ''
  const d = new Date(article.value.publishedAt)
  if (Number.isNaN(d.getTime())) return ''
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('.')
})

function goBack() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo(localePath('/news'))
}

// --- reading-progress ruler (Figma 663:14309) --------------------------------
// Sticky tick column in the left margin; ticks fill top-down with the accent
// colour as the article scrolls past. The tick at the current position grows
// longer and the percentage number rides right next to it.
const TICKS = 34
const TICK_PITCH = 5 // 1px tick + 4px gap — keep in sync with the template
const articleEl = ref<HTMLElement | null>(null)
const progress = ref(0)
const activeTick = computed(() => Math.round(progress.value * (TICKS - 1)))

function measureProgress() {
  const el = articleEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const total = r.height - window.innerHeight
  progress.value = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1
}

// 50ms trailing debounce: the tick fill and the sliding long marker update in
// one step after scrolling settles, so the fill edge can't run ahead of the
// marker mid-transition.
let scrollTimer: ReturnType<typeof setTimeout> | null = null
function onScroll() {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(measureProgress, 5)
}

onMounted(() => {
  measureProgress()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
// -----------------------------------------------------------------------------

useSeoMeta({
  title: () => article.value?.title ?? t('nav.news'),
  description: () => article.value?.summary,
})
</script>

<template>
  <div v-if="article" class="relative bg-white">
    <!-- Sticky reading-progress ruler — decorative, margin space only -->
    <div class="pointer-events-none absolute inset-y-0 left-12 hidden lg:block" aria-hidden="true">
      <div class="sticky top-0 flex h-screen items-center">
        <div class="relative">
          <span
            class="absolute left-9 -translate-y-1/2 font-display text-base font-medium leading-none text-accent transition-[top] duration-150 ease-out"
            :style="{ top: `${activeTick * TICK_PITCH + 0.5}px` }"
          >
            {{ Math.round(progress * 100) }}
          </span>
          <!-- One persistent long marker that slides along the ruler -->
          <span
            class="absolute left-0 h-px w-7 bg-accent transition-[top] duration-150 ease-out"
            :style="{ top: `${activeTick * TICK_PITCH}px` }"
          />
          <div class="flex flex-col gap-[4px]">
            <span
              v-for="i in TICKS"
              :key="i"
              class="h-px w-4 transition-colors duration-150"
              :class="(i - 1) / TICKS <= progress ? 'bg-accent' : 'bg-black/15'"
            />
          </div>
        </div>
      </div>
    </div>

    <article ref="articleEl" class="mx-auto w-full max-w-[808px] px-6 py-14 sm:py-20">
      <AppButton to="/news" variant="secondary" size="md">
        <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
        {{ t('common.back') }}
      </AppButton>

      <div class="mt-8 flex flex-col gap-4">
        <time :datetime="article.publishedAt" class="text-sm font-extralight text-black/40">
          {{ published }}
        </time>
        <h1 class="font-display text-2xl font-semibold tracking-[0.01em] text-black sm:text-[32px]">
          {{ article.title }}
        </h1>
      </div>

      <p v-if="article.summary" class="mt-4 text-base font-light tracking-[0.01em] text-black/50">
        {{ article.summary }}
      </p>

      <div v-if="article.image" class="mt-6 overflow-hidden rounded-[24px]">
        <NuxtImg
          :src="article.image"
          :alt="article.title"
          width="1388"
          height="776"
          sizes="760px"
          class="aspect-[1388/776] w-full object-cover"
        />
      </div>

      <hr class="mt-8 border-black/10">

      <ContentRenderer :value="article" class="article-body mt-8" />

      <AppButton to="/news" variant="secondary" size="lg" pill block arrow class="mt-12">
        {{ t('newsPage.viewAll') }}
      </AppButton>
    </article>
  </div>
</template>

<style scoped>
/* Markdown body per Figma 663:14303/14304: 16px semibold black headings,
   16px light black/50 paragraphs, rounded-24 inline images. (No tailwind
   typography plugin in this project — styled by hand.) */
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  font-family: var(--font-display, inherit);
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  margin: 2rem 0 1.5rem;
}
.article-body :deep(p) {
  font-size: 1rem;
  font-weight: 300;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 1.25rem;
}
.article-body :deep(img) {
  border-radius: 24px;
  width: 100%;
  margin: 2rem 0;
}
.article-body :deep(a) {
  text-decoration: underline;
  text-underline-position: from-font;
}
.article-body :deep(ul),
.article-body :deep(ol) {
  font-size: 1rem;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 1.25rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.article-body :deep(ol) {
  list-style: decimal;
}
.article-body :deep(> :first-child) {
  margin-top: 0;
}
.article-body :deep(> :last-child) {
  margin-bottom: 0;
}
</style>
