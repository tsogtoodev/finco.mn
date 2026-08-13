<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string | number
    type?: string
    unit?: string
    unitPosition?: 'leading' | 'trailing'
    placeholder?: string
    inputmode?: string
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
    el.value = value
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
