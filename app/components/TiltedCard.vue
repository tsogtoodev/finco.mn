<script setup lang="ts">
import { Motion } from 'motion-v'

// Feature card (Figma 1016:4448): a 192px rounded illustration well on a soft
// white gradient surface, with the accent title + supporting copy sitting at the
// bottom of the card. Fills its grid cell, so the gap between the well and the
// caption is whatever height the cell gives it.
//
// Keeps the React Bits tilt this component started as: the card rotates toward
// the pointer on a spring and lifts a little. It tilts as ONE plane rather than
// parallaxing its layers — the card clips its own rounded corners, and
// `overflow: hidden` + `transform-style: preserve-3d` cancel each other out.
const props = withDefaults(
  defineProps<{
    imageSrc: string
    altText?: string
    title?: string
    body?: string
    /** Side of the square illustration well (Figma: 192px). */
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

// Pointer position within the card, fed to the glow as CSS vars (see .tilt-glow).
const glowX = ref(0)
const glowY = ref(0)

const springTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 100,
  mass: 2,
}

// The tilt is pure decoration, so it's dropped entirely for reduced-motion
// users — leaving the spring in place would still swing the card around.
function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function handleMouse(e: MouseEvent) {
  if (!cardRef.value) return

  const rect = cardRef.value.getBoundingClientRect()

  // The glow tracks the pointer even for reduced motion — it's the hover
  // affordance itself, not an embellishment on top of one.
  glowX.value = e.clientX - rect.left
  glowY.value = e.clientY - rect.top

  if (prefersReducedMotion()) return

  const offsetX = e.clientX - rect.left - rect.width / 2
  const offsetY = e.clientY - rect.top - rect.height / 2

  rotateX.value = (offsetY / (rect.height / 2)) * -props.rotateAmplitude
  rotateY.value = (offsetX / (rect.width / 2)) * props.rotateAmplitude
}

function handleMouseEnter(e: MouseEvent) {
  // Place the glow before it fades in, so it doesn't slide in from the corner
  // when the pointer enters without a mousemove landing first.
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
      <!-- Hover wash. `background-image` isn't an interpolable property, so the
           hover gradient can't be transitioned on the card itself — it rides on
           its own layer and cross-fades on opacity instead. Everything below it
           is `relative` so it stays under the content despite being painted in
           the positioned layer. -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out [background:linear-gradient(180deg,#F3F2FD_0%,#FAFAFE_100%)] group-hover:opacity-100 motion-reduce:transition-none"
      />

      <!-- Cursor glow (Figma 1016:4470). Sits above the wash — the wash is
           opaque, so a glow underneath it would never show. The card's
           `overflow-hidden` is what keeps it inside the rounded box. -->
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
/* Figma 1016:4470 is a 50.7px #4C41D8 circle under a 48.2px gaussian blur, which
   spreads it into a ~243px violet bloom. It's parked at the card's top-left and
   translated to the pointer (the % in the calc is the glow's OWN half-size, so
   it centres on the cursor); transitioning that transform is what makes it trail
   the cursor instead of snapping to it. */
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

/* Reduced motion keeps the glow (it's the hover cue) but drops the trailing. */
@media (prefers-reduced-motion: reduce) {
  .tilt-glow {
    transition: none;
  }
}
</style>
