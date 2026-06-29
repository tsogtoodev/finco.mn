<script setup lang="ts">
// Labelled input (Figma 1:11593): 14px label above a rgba(0,0,0,0.03) field with
// 12px radius and an optional leading/trailing unit (e.g. ₮ or %).
withDefaults(
  defineProps<{
    label: string
    modelValue: string | number
    type?: string
    /** Unit shown inside the field, e.g. '₮' or '%'. */
    unit?: string
    unitPosition?: 'leading' | 'trailing'
    placeholder?: string
    inputmode?: string
  }>(),
  { type: 'text', unitPosition: 'leading', placeholder: '', inputmode: 'decimal' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
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
        class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <span v-if="unit && unitPosition === 'trailing'" class="shrink-0 text-sm text-foreground/60">{{ unit }}</span>
    </div>
  </div>
</template>
