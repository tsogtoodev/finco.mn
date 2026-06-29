<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Product-detail tab strip (Figma 1:13353): three equal-width underline tabs
// (Үйлчилгээний нөхцөл · Тавигдах шаардлага · Бүрдүүлэх материал), the active one
// in medium weight with a dark underline. The requirements panel renders a numbered
// list with full-width dividers between rows.
const props = defineProps<{ tabs: NonNullable<Collections['products']['tabs']>; body?: unknown }>()
const { t } = useI18n()

// Build the visible tab set from whichever fields the product provides.
const available = computed(() => {
  const out: { key: string; label: string }[] = []
  if (props.tabs.info || props.body) out.push({ key: 'info', label: t('tabs.info') })
  if (props.tabs.requirements?.length) out.push({ key: 'requirements', label: t('tabs.requirements') })
  if (props.tabs.other) out.push({ key: 'other', label: t('tabs.other') })
  return out
})

// Open on the requirements tab when present (Figma shows it active), else the first.
const active = ref(
  available.value.find((to) => to.key === 'requirements')?.key ?? available.value[0]?.key ?? 'info',
)
</script>

<template>
  <div v-if="available.length">
    <!-- Underline tablist -->
    <div role="tablist" :aria-label="t('tabs.requirements')" class="flex w-full">
      <button
        v-for="tab in available"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="active === tab.key"
        class="relative flex-1 cursor-pointer px-2 pb-6 pt-2 text-center text-base leading-5 transition-colors"
        :class="active === tab.key ? 'font-medium text-black/80' : 'font-light text-black/60 hover:text-black/80'"
        @click="active = tab.key"
      >
        {{ tab.label }}
        <span class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/10" />
        <span
          v-if="active === tab.key"
          class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-black/80"
        />
      </button>
    </div>

    <!-- Panels -->
    <div class="mt-6">
      <div v-show="active === 'info'" class="prose max-w-none text-base font-light leading-7 text-black/80">
        <ContentRenderer v-if="body" :value="{ body } as any" />
        <p v-else-if="tabs.info">{{ tabs.info }}</p>
      </div>

      <ol v-show="active === 'requirements'" class="flex flex-col gap-3 rounded-[12px] px-3 py-6">
        <template v-for="(r, i) in tabs.requirements" :key="i">
          <li class="flex gap-2 text-base font-light leading-7 text-black/80">
            <span class="shrink-0 tabular-nums">{{ i + 1 }}.</span>
            <span>{{ r }}</span>
          </li>
          <div v-if="i < (tabs.requirements?.length ?? 0) - 1" class="h-px w-full bg-black/10" />
        </template>
      </ol>

      <p v-show="active === 'other'" class="text-base font-light leading-7 text-black/80">{{ tabs.other }}</p>
    </div>
  </div>
</template>
