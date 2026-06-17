<script setup lang="ts">
// Design-system button (Figma: Geologica Medium 14, radius 12, px-4 py-2,
// trailing Lucide arrow). Renders as <NuxtLink> when `to` is set, else <button>.
const props = withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    arrow?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const variants: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  accent: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
  outline: 'border border-input text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-foreground hover:bg-muted',
}

const sizes: Record<NonNullable<typeof props.size>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-[--radius] font-display font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
])

const localePath = useLocalePath()
</script>

<template>
  <NuxtLink v-if="to" :to="localePath(to)" :class="classes">
    <slot />
    <Icon v-if="arrow" name="lucide:arrow-right" class="size-4" />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
    <Icon v-if="arrow" name="lucide:arrow-right" class="size-4" />
  </button>
</template>
