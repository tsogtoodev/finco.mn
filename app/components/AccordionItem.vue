<script setup lang="ts">
// Single FAQ row (Figma 1:13738/1:13746). Open → card surface + grey minus button;
// closed → flat row with a blurple plus button and bottom divider. Height animates
// via motion-v; ARIA wires the button to its panel.
const props = withDefaults(defineProps<{ question: string; defaultOpen?: boolean }>(), {
  defaultOpen: false,
})
const open = ref(props.defaultOpen)
const uid = useId()
</script>

<template>
  <div :class="open ? 'rounded-[24px] bg-black/[0.025]' : 'border-b border-black/10'">
    <h3 class="m-0">
      <button
        :id="`${uid}-btn`"
        type="button"
        class="flex w-full items-center justify-between gap-4 px-3 py-5 text-left sm:px-6 sm:py-6 cursor-pointer"
        :aria-expanded="open"
        :aria-controls="`${uid}-panel`"
        @click="open = !open"
      >
        <span
          class="font-display text-base text-black/80 sm:text-lg"
          :class="open ? 'font-semibold' : 'font-normal'"
        >
          {{ question }}
        </span>
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full transition-colors"
          :class="open ? 'bg-black/5 text-black/70' : 'bg-transparent text-black/70'"
        >
          <!-- Both icons stacked in the same grid cell so the swap can cross-fade/rotate -->
          <Icon
            name="lucide:plus"
            class="col-start-1 row-start-1 size-5 transition duration-300 ease-out"
            :class="open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'"
          />
          <Icon
            name="lucide:minus"
            class="col-start-1 row-start-1 size-5 transition duration-300 ease-out"
            :class="open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'"
          />
        </span>
      </button>
    </h3>
    <AnimatePresence>
      <Motion
        v-if="open"
        :id="`${uid}-panel`"
        role="region"
        :aria-labelledby="`${uid}-btn`"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
        class="overflow-hidden"
      >
        <p class="px-3 pb-5 text-base font-extralight leading-[26px] text-black sm:px-6 sm:pb-6">
          <slot />
        </p>
      </Motion>
    </AnimatePresence>
  </div>
</template>
