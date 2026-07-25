<script setup lang="ts">
// Labelled input (Figma 1:11593): 14px label above a rgba(0,0,0,0.03) field with
// 12px radius and an optional leading/trailing unit (e.g. ₮ or %).
const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string | number
    type?: string
    /** Unit shown inside the field, e.g. '₮' or '%'. */
    unit?: string
    unitPosition?: 'leading' | 'trailing'
    placeholder?: string
    inputmode?: string
    /**
     * Upper bound for `type="number"` fields. Values typed or pasted above it
     * are clamped in place (the native `max` attribute only affects spinners
     * and validation styling — it doesn't stop typed input).
     */
    max?: number
  }>(),
  { type: 'text', unitPosition: 'leading', placeholder: '', inputmode: 'decimal' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  let value = el.value
  if (props.type === 'number' && props.max != null && value !== '' && Number(value) > props.max) {
    value = String(props.max)
    el.value = value // sync the DOM so the field visibly clamps
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <label :for="id" class="text-sm text-foreground">{{ label }}</label>
    <div class="flex items-center gap-2 rounded-[12px] bg-[rgba(0,0,0,0.03)] p-4">
      <span v-if="unit && unitPosition === 'leading'" class="shrink-0 text-sm text-foreground/60">{{ unit }}</span>
      <input
        :id="id"
        :type="type"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :value="modelValue"
        :max="type === 'number' ? max : undefined"
        class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
        @input="onInput"
      >
      <span v-if="unit && unitPosition === 'trailing'" class="shrink-0 text-sm text-foreground/60">{{ unit }}</span>
    </div>
  </div>
</template>
