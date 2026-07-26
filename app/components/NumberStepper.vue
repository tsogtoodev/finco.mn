<script setup lang="ts">
// Integer stepper (Figma 1:11603): value on the left, −/+ chips on the right,
// inside the same rgba(0,0,0,0.03) / 12px-radius field as AppInput.
//
// The value is a real <input>, not a <span>: the chips are the only other way to
// change it, so reaching the 360-month maximum — or even the common 24 — meant
// dozens of taps on what used to be a 24×24 target. Typing is now the primary
// path and the chips are the nudge.
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

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  // Empty is a legitimate mid-edit state (select-all then retype) — hold the
  // last good value and let `onBlur` settle it rather than snapping to `min`
  // under the cursor.
  if (el.value === '') return
  const n = clamp(Number(el.value))
  if (String(n) !== el.value) el.value = String(n) // visibly clamp, like AppInput
  emit('update:modelValue', n)
}
function onBlur(e: Event) {
  const el = e.target as HTMLInputElement
  const n = clamp(Number(el.value) || props.min)
  el.value = String(n)
  emit('update:modelValue', n)
}
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <label v-if="label" :for="id" class="text-sm text-foreground">{{ label }}</label>
    <!-- p-1.5 rather than the p-4 a static value needed: the chips are 44px now,
         so the field keeps roughly AppInput's height instead of growing to 76px. -->
    <div class="flex items-center justify-between gap-2 rounded-[12px] bg-[rgba(0,0,0,0.03)] p-1.5 pl-4">
      <input
        :id="id"
        type="number"
        inputmode="numeric"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        @input="onInput"
        @blur="onBlur"
      >
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="decrease"
          class="grid size-11 place-items-center rounded-[8px] bg-white/60 disabled:opacity-40"
          :disabled="min != null && modelValue <= min"
          @click="dec"
        >
          <Icon name="f:minus" class="size-4 text-foreground/70" />
        </button>
        <button
          type="button"
          aria-label="increase"
          class="grid size-11 place-items-center rounded-[8px] bg-white/60 disabled:opacity-40"
          :disabled="max != null && modelValue >= max"
          @click="inc"
        >
          <Icon name="f:plus" class="size-4 text-foreground/70" />
        </button>
      </div>
    </div>
  </div>
</template>
