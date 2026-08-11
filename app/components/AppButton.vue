<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'accent' | 'teal' | 'lime' | 'light' | 'secondary' | 'glass' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    arrow?: boolean
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
  lime: 'bg-lime text-dark hover:opacity-90',
  light: 'bg-white text-foreground shadow-2xs hover:bg-white/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
  glass: 'border border-white/20 bg-white/10 text-white backdrop-blur-[20px] hover:bg-white/20',
  outline: 'border border-input text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-current hover:bg-current/10',
}

const sizes: Record<NonNullable<typeof props.size>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const classes = computed(() => [
  'inline-flex cursor-pointer items-center justify-center gap-2 font-display font-medium transition duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] active:blur-[1.5px] disabled:opacity-60 disabled:pointer-events-none motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:active:blur-none',
  props.pill ? 'rounded-full' : 'rounded-[var(--radius)]',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
])

const localePath = useLocalePath()

const isExternal = computed(() => /^https?:\/\//i.test(props.to ?? ''))

const href = computed(() => {
  if (!props.to) return undefined
  return isExternal.value ? props.to : localePath(props.to)
})
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="href"
    :external="isExternal || undefined"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
    :class="classes"
  >
    <slot />
    <Icon v-if="arrow" name="lucide:arrow-right" class="size-4" />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
    <Icon v-if="arrow" name="lucide:arrow-right" class="size-4" />
  </button>
</template>
