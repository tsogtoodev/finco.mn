<script setup lang="ts">
// Integer stepper (Figma 1:11603): value on the left, −/+ chips on the right,
// inside the same rgba(0,0,0,0.03) / 12px-radius field as AppInput.
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
  }>(),
  { min: 1, step: 1 },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const id = useId()

function clamp(v: number) {
  let n = Math.round(v)
  if (props.min != null) n = Math.max(props.min, n)
  if (props.max != null) n = Math.min(props.max, n)
  return n
}
function dec() { emit('update:modelValue', clamp(props.modelValue - props.step)) }
function inc() { emit('update:modelValue', clamp(props.modelValue + props.step)) }
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <label v-if="label" :for="id" class="text-sm text-foreground">{{ label }}</label>
    <div class="flex items-center justify-between rounded-[12px] bg-[rgba(0,0,0,0.03)] p-4">
      <span :id="id" class="text-sm text-foreground/80">{{ modelValue }}</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="decrease"
          class="grid place-items-center rounded-[4px] bg-white/60 p-1 disabled:opacity-40"
          :disabled="min != null && modelValue <= min"
          @click="dec"
        >
          <Icon name="f:minus" class="size-4 text-foreground/70" />
        </button>
        <button
          type="button"
          aria-label="increase"
          class="grid place-items-center rounded-[4px] bg-white/60 p-1 disabled:opacity-40"
          :disabled="max != null && modelValue >= max"
          @click="inc"
        >
          <Icon name="f:plus" class="size-4 text-foreground/70" />
        </button>
      </div>
    </div>
  </div>
</template>
