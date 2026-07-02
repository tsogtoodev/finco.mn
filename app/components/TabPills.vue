<script setup lang="ts">
// Sliding-pill tabs. The pill tweens between the measured offsetLeft/offsetWidth
// of the active tab; on first paint / font-load / resize it SNAPS (transition
// suspended + reflow) so it never animates from a stale position. Reduced motion
// disables the tween (CSS). Fully themeable via the --tabs-* custom properties —
// override them with an inline `style` on the component to match each surface.
const props = defineProps<{
  modelValue: string
  tabs: { value: string; label: string }[]
  ariaLabel?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const pill = ref<HTMLElement | null>(null)
const tabEls = ref<HTMLButtonElement[]>([])

const activeIndex = computed(() => {
  const i = props.tabs.findIndex(t => t.value === props.modelValue)
  return i === -1 ? 0 : i
})

function position(animate: boolean) {
  const p = pill.value
  const el = tabEls.value[activeIndex.value]
  if (!p || !el) return
  if (!animate) p.style.transition = 'none'
  p.style.transform = `translateX(${el.offsetLeft}px)`
  p.style.width = `${el.offsetWidth}px`
  if (!animate) {
    void p.offsetWidth // force a reflow so the snap can't tween
    p.style.transition = ''
  }
}

const snap = () => position(false)

function select(value: string) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

watch(() => props.modelValue, () => position(true))
// Re-snap only when the tab SET actually changes (a stable key, not the array
// ref — consumers often pass a freshly-mapped array each render, which must NOT
// trigger a snap or it would cancel the click animation).
watch(() => props.tabs.map(t => `${t.value}:${t.label}`).join('|'), () => nextTick(snap))

onMounted(() => {
  nextTick(snap)
  // Label widths can shift once the web font loads — re-snap then.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(snap).catch(() => {})
  }
  window.addEventListener('resize', snap, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', snap))
</script>

<template>
  <div class="t-tabs" role="tablist" :aria-label="ariaLabel">
    <span ref="pill" class="t-tabs-pill" aria-hidden="true" />
    <button
      v-for="(tab, i) in tabs"
      :key="tab.value"
      :ref="(el) => { if (el) tabEls[i] = el as HTMLButtonElement }"
      type="button"
      role="tab"
      :aria-selected="tab.value === modelValue"
      class="t-tab"
      @click="select(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.t-tabs {
  /* Theme tokens — override via inline style on <TabPills>. Defaults: dark pill. */
  --tabs-dur: 250ms;
  --tabs-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tabs-text-muted: rgba(193, 193, 193, 0.8);
  --tabs-text-active: #ffffff;
  --tabs-text-hover: var(--tabs-text-active); /* unselected hover; override on light bars */
  --tabs-bar-bg: #202020;
  --tabs-pill-bg: #454545;
  --tabs-radius: 48px;
  --tabs-pad: 3px;
  --tabs-gap: 3px;
  --tabs-tab-h: 30px;
  --tabs-tab-px: 12px;
  --tabs-font: inherit;
  --tabs-weight: 400;
  --tabs-weight-active: var(--tabs-weight);

  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tabs-gap);
  padding: var(--tabs-pad);
  border-radius: var(--tabs-radius);
  background: var(--tabs-bar-bg);
  transition: background-color var(--tabs-dur) var(--tabs-ease);
}
.t-tab {
  position: relative;
  appearance: none;
  border: 0;
  background: transparent;
  height: var(--tabs-tab-h);
  padding: 0 var(--tabs-tab-px);
  font-size: var(--tabs-font);
  font-weight: var(--tabs-weight);
  line-height: 1;
  white-space: nowrap;
  color: var(--tabs-text-muted);
  cursor: pointer;
  border-radius: var(--tabs-radius);
  z-index: 1;
  transition: color var(--tabs-dur) var(--tabs-ease);
}
.t-tab:not([aria-selected="true"]):hover {
  color: var(--tabs-text-hover);
}
.t-tab[aria-selected="true"] {
  color: var(--tabs-text-active);
  font-weight: var(--tabs-weight-active);
}
.t-tabs-pill {
  position: absolute;
  top: var(--tabs-pad);
  left: 0;
  height: var(--tabs-tab-h);
  width: 0;
  background: var(--tabs-pill-bg);
  border-radius: var(--tabs-radius);
  transform: translateX(0);
  transition:
    transform var(--tabs-dur) var(--tabs-ease),
    width var(--tabs-dur) var(--tabs-ease),
    background-color var(--tabs-dur) var(--tabs-ease);
  will-change: transform, width;
  z-index: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .t-tabs,
  .t-tabs-pill,
  .t-tab {
    transition: none !important;
  }
}
</style>
