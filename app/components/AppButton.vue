<script setup lang="ts">
// Design-system button (Figma: Geologica Medium 14, radius 12, px-4 py-2,
// trailing Lucide arrow). Renders as <NuxtLink> when `to` is set, else <button>.
const props = withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'accent' | 'teal' | 'light' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    arrow?: boolean
    /** Fully rounded pill shape (Figma CTAs). Default is the 12px radius. */
    pill?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const variants: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  accent: 'bg-accent text-white hover:opacity-90',
  teal: 'bg-teal text-white hover:opacity-90',
  light: 'bg-white text-foreground shadow-2xs hover:bg-white/90',
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
  'inline-flex items-center justify-center gap-2 font-display font-medium transition duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none motion-reduce:transition-none motion-reduce:active:scale-100',
  props.pill ? 'rounded-full' : 'rounded-[var(--radius)]',
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
