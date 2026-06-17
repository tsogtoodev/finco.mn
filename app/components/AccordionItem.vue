<script setup lang="ts">
// Single collapsible row. Height animates via motion-v.
defineProps<{ question: string }>()
const open = ref(false)
</script>

<template>
  <div class="border-b border-input">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-4 py-5 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="font-display font-medium text-foreground">{{ question }}</span>
      <Icon
        name="lucide:plus"
        class="size-5 shrink-0 text-muted-foreground transition-transform duration-300"
        :class="open ? 'rotate-45' : ''"
      />
    </button>
    <AnimatePresence>
      <Motion
        v-if="open"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
        class="overflow-hidden"
      >
        <p class="pb-5 text-muted-foreground"><slot /></p>
      </Motion>
    </AnimatePresence>
  </div>
</template>
