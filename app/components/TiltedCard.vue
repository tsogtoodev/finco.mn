<script setup lang="ts">
import { Motion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    imageSrc: string
    altText?: string
    title?: string
    body?: string
    imageSize?: string
    scaleOnHover?: number
    rotateAmplitude?: number
  }>(),
  {
    altText: '',
    imageSize: '100px',
    scaleOnHover: 1.03,
    rotateAmplitude: 10,
  },
)

const cardRef = useTemplateRef<HTMLElement>('cardRef')
const rotateX = ref(0)
const rotateY = ref(0)
const scale = ref(1)

const glowX = ref(0)
const glowY = ref(0)

const springTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 100,
  mass: 2,
}

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function handleMouse(e: MouseEvent) {
  if (!cardRef.value) return

  const rect = cardRef.value.getBoundingClientRect()

  glowX.value = e.clientX - rect.left
  glowY.value = e.clientY - rect.top

  if (prefersReducedMotion()) return

  const offsetX = e.clientX - rect.left - rect.width / 2
  const offsetY = e.clientY - rect.top - rect.height / 2

  rotateX.value = (offsetY / (rect.height / 2)) * -props.rotateAmplitude
  rotateY.value = (offsetX / (rect.width / 2)) * props.rotateAmplitude
}

function handleMouseEnter(e: MouseEvent) {
  handleMouse(e)
  if (prefersReducedMotion()) return
  scale.value = props.scaleOnHover
}

function handleMouseLeave() {
  scale.value = 1
  rotateX.value = 0
  rotateY.value = 0
}
</script>

<template>
  <figure
    ref="cardRef"
    class="group h-full w-full [perspective:800px]"
    :style="{ '--glow-x': `${glowX}px`, '--glow-y': `${glowY}px` }"
    @mousemove="handleMouse"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <Motion
      tag="div"
      class="relative flex h-full w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-black/5 p-6 [background:linear-gradient(180deg,#FDFDFF_0%,#FAFAFE_100%)]"
      :animate="{ rotateX, rotateY, scale }"
      :transition="springTransition"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out [background:linear-gradient(180deg,#F3F2FD_0%,#FAFAFE_100%)] group-hover:opacity-100 motion-reduce:transition-none"
      />

      <span aria-hidden="true" class="tilt-glow" />

      <div
        class="relative shrink-0 overflow-hidden rounded-3xl"
        :style="{ width: imageSize, height: imageSize }"
      >
        <img
          :src="imageSrc"
          :alt="altText"
          class="size-full object-cover"
          loading="lazy"
          decoding="async"
        >
      </div>

      <figcaption class="relative flex w-full flex-col gap-3">
        <h3 class="font-display text-[18px] font-medium leading-7 text-accent">
          <slot name="title">{{ title }}</slot>
        </h3>
        <p class="text-base font-light leading-6 tracking-[0.16px] text-black/60">
          <slot>{{ body }}</slot>
        </p>
      </figcaption>
    </Motion>
  </figure>
</template>

<style scoped>
.tilt-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 50.688px;
  height: 50.688px;
  border-radius: 9999px;
  background: #a099ff;
  filter: blur(48.2px);
  opacity: 0;
  pointer-events: none;
  transform: translate3d(calc(var(--glow-x, 0px) - 50%), calc(var(--glow-y, 0px) - 50%), 0);
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease-out;
}

figure:hover .tilt-glow {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .tilt-glow {
    transition: none;
  }
}
</style>
