<script setup lang="ts">
import type { Collections } from '@nuxt/content'

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

const active = ref(available.value[0]?.key ?? 'info')
</script>

<template>
  <div v-if="available.length">
    <!-- Tablist -->
    <div class="flex gap-1 rounded-full bg-secondary p-1">
      <button
        v-for="tab in available"
        :key="tab.key"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="active === tab.key ? 'bg-white text-primary shadow-2xs' : 'text-muted-foreground hover:text-foreground'"
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Panels -->
    <div class="mt-6">
      <div v-show="active === 'info'" class="prose max-w-none text-muted-foreground">
        <ContentRenderer v-if="body" :value="{ body } as any" />
        <p v-else-if="tabs.info">{{ tabs.info }}</p>
      </div>
      <ul v-show="active === 'requirements'" class="list-disc space-y-2 pl-5 text-muted-foreground">
        <li v-for="(r, i) in tabs.requirements" :key="i">{{ r }}</li>
      </ul>
      <p v-show="active === 'other'" class="text-muted-foreground">{{ tabs.other }}</p>
    </div>
  </div>
</template>
