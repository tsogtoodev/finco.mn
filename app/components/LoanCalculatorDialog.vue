<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const { t } = useI18n()

const amount = ref('1000000')
const rate = ref('1.0')
const term = ref(3)

const principal = computed(() => Number(amount.value) || 0)
const monthlyRate = computed(() => (Number(rate.value) || 0) / 100)
const months = computed(() => Math.max(1, Math.round(Number(term.value) || 1)))

const monthly = computed(() => {
  const p = principal.value
  const r = monthlyRate.value
  const n = months.value
  if (p <= 0) return 0
  if (r === 0) return p / n
  return (p * r) / (1 - (1 + r) ** -n)
})
const total = computed(() => monthly.value * months.value)

const fmt: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
</script>

<template>
  <AppDialog
    :open="open"
    :title="t('fab.calculator.title')"
    :label-close="t('fab.close')"
    @update:open="emit('update:open', $event)"
  >
    <div class="calc-body flex flex-col gap-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:gap-[34px]">
        <AppInput v-model="amount" :label="t('fab.calculator.amount')" type="number" inputmode="numeric" unit="₮" :max="1_000_000_000" />
        <AppInput v-model="rate" :label="t('fab.calculator.rate')" type="number" inputmode="decimal" unit="%" unit-position="trailing" :max="100" />
        <NumberStepper v-model="term" :label="t('fab.calculator.term')" :min="1" :max="360" />
      </div>

      <div class="flex flex-col gap-6 rounded-[24px] bg-[#f7f7f7] p-4 sm:flex-row sm:p-6">
        <div class="flex min-w-0 flex-1 flex-col items-start gap-2 rounded-[24px] bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <span class="min-w-0 text-base text-foreground/60">{{ t('fab.calculator.monthly') }}</span>
          <span class="min-w-0 text-lg font-medium text-[#252525] sm:text-xl">
            <AppNumberFlow :value="monthly" :format="fmt" suffix="₮" />
          </span>
        </div>
        <div class="flex min-w-0 flex-1 flex-col items-start gap-2 rounded-[24px] bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <span class="min-w-0 text-base text-foreground/60">{{ t('fab.calculator.total') }}</span>
          <span class="min-w-0 text-lg font-bold text-accent-bright sm:text-xl">
            <AppNumberFlow :value="total" :format="fmt" suffix="₮" />
          </span>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
.calc-body :deep(button) {
  transition:
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1),
    filter 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.calc-body :deep(button:active:not(:disabled)) {
  transform: scale(0.88);
}
</style>
