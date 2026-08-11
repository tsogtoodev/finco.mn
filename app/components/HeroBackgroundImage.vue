<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    width?: number | string
    height?: number | string
    fetchpriority?: 'high' | 'auto' | 'low'
    preload?: boolean
    imgClass?: string
    wrapperClass?: string
  }>(),
  { alt: '', fetchpriority: 'auto', preload: false },
)

const wrapRef = ref<HTMLElement | null>(null)
const revealed = ref(false)

function reveal() {
  revealed.value = true
}

function checkAlreadyLoaded() {
  const img = wrapRef.value?.querySelector('img')
  if (img?.complete && img.naturalWidth > 0) reveal()
}

watch(
  () => props.src,
  () => {
    revealed.value = false
    nextTick(checkAlreadyLoaded)
  },
)

onMounted(checkAlreadyLoaded)
</script>

<template>
  <div
    ref="wrapRef"
    class="hero-image-reveal absolute inset-0 overflow-hidden"
    :class="[wrapperClass, { 'is-revealed': revealed }]"
  >
    <NuxtImg
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :fetchpriority="fetchpriority"
      :preload="preload"
      :class="imgClass"
      @load="reveal"
      @error="reveal"
    />
  </div>
</template>
