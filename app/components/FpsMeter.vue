<script setup lang="ts">
const fps = ref(0)
const worst = ref(0)
const longestFrame = ref(0)
const hidden = ref(false)

let rafId = 0
let frames = 0
let windowStart = 0
let lastFrame = 0
let peakThisWindow = 0

function tick(now: number) {
  rafId = requestAnimationFrame(tick)

  if (!windowStart) {
    windowStart = now
    lastFrame = now
    return
  }

  const delta = now - lastFrame
  lastFrame = now
  if (delta > peakThisWindow) peakThisWindow = delta
  frames++

  const elapsed = now - windowStart
  if (elapsed < 1000) return

  fps.value = Math.round((frames * 1000) / elapsed)
  longestFrame.value = Math.round(peakThisWindow)
  if (worst.value === 0 || fps.value < worst.value) worst.value = fps.value

  frames = 0
  peakThisWindow = 0
  windowStart = now
}

function reset() {
  worst.value = 0
  longestFrame.value = 0
}

function onVisibility() {
  if (document.hidden) return
  frames = 0
  peakThisWindow = 0
  windowStart = 0
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  document.removeEventListener('visibilitychange', onVisibility)
})

const tone = computed(() => {
  const v = worst.value || fps.value
  if (v >= 55) return 'text-[#4ade80]'
  if (v >= 40) return 'text-[#fbbf24]'
  return 'text-[#f87171]'
})
</script>

<template>
  <div
    v-show="!hidden"
    class="pointer-events-auto fixed bottom-3 left-3 z-[9999] select-none rounded-lg bg-black/80 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-white/70 shadow-lg backdrop-blur-sm"
    aria-hidden="true"
  >
    <div class="flex items-baseline gap-1.5">
      <span :class="tone" class="text-[15px] font-semibold tabular-nums">{{ fps }}</span>
      <span class="text-white/40">fps</span>
    </div>
    <div class="mt-0.5 tabular-nums text-white/50">
      min {{ worst }} · {{ longestFrame }}ms
    </div>
    <div class="mt-1 flex gap-1.5 text-[10px]">
      <button class="text-white/40 transition-colors hover:text-white" @click="reset">reset</button>
      <button class="text-white/40 transition-colors hover:text-white" @click="hidden = true">hide</button>
    </div>
  </div>
</template>
