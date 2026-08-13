<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{ tabs: NonNullable<Collections['products']['tabs']>; body?: unknown }>()
const { t } = useI18n()

const available = computed(() => {
  const out: { key: string; label: string }[] = []
  if (props.tabs.info || props.body) out.push({ key: 'info', label: t('tabs.info') })
  if (props.tabs.requirements) out.push({ key: 'requirements', label: t('tabs.requirements') })
  if (props.tabs.other) out.push({ key: 'other', label: t('tabs.other') })
  return out
})

const active = ref(
  available.value.find((to) => to.key === 'requirements')?.key ?? available.value[0]?.key ?? 'info',
)
const activeIndex = computed(() =>
  Math.max(0, available.value.findIndex((to) => to.key === active.value)),
)

const proseClass =
  'prose prose-neutral tab-prose max-w-none text-base font-light prose-headings:font-display prose-headings:font-medium prose-p:leading-7 prose-p:text-black/80 prose-li:text-black/80 prose-strong:text-foreground'
</script>

<template>
  <div v-if="available.length">
    <div role="tablist" :aria-label="t('tabs.requirements')" class="relative flex w-full">
      <button
        v-for="tab in available"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="active === tab.key"
        class="relative min-w-0 flex-1 cursor-pointer px-2 pb-6 pt-2 text-center text-base leading-5 transition-colors duration-300"
        :class="active === tab.key ? 'font-medium text-black/80' : 'font-light text-black/60 hover:text-black/80'"
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
      <span class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/10" />
      <span
        class="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-black/80 transition-transform duration-300 ease-out"
        :style="{ width: `${100 / available.length}%`, transform: `translateX(${activeIndex * 100}%)` }"
      />
    </div>

    <AnimatePresence mode="wait">
      <Motion
        :key="active"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ duration: 0.2, ease: 'easeOut' }"
        class="mt-6 min-h-[320px]"
      >
        <div v-if="active === 'info'" :class="proseClass">
          <ContentRenderer v-if="body" :value="{ body } as any" />
          <MDC v-else-if="tabs.info" :value="tabs.info" />
        </div>

        <div v-else-if="active === 'requirements'" :class="[proseClass, 'px-3 py-6']">
          <MDC :value="tabs.requirements!" />
        </div>

        <div v-else-if="active === 'other'" :class="proseClass">
          <MDC :value="tabs.other!" />
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.tab-prose :deep(ol) {
  list-style: none;
  counter-reset: tab-row;
  padding-left: 0;
  margin: 0;
}
.tab-prose :deep(ol > li) {
  counter-increment: tab-row;
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0.375rem 0;
  padding-inline-start: 0;
  line-height: 1.75;
  color: rgb(0 0 0 / 0.8);
}
.tab-prose :deep(ol > li)::before {
  content: counter(tab-row) '.';
  flex: none;
  font-variant-numeric: tabular-nums;
}
.tab-prose :deep(ol > li + li) {
  border-top: 1px solid rgb(0 0 0 / 0.1);
}
</style>
