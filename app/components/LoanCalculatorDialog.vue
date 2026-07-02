<script setup lang="ts">
// "Зээлийн тооцоолуур" popup (Figma 1:11586). Amortised monthly payment + total,
// recomputed live as the user types.
defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const { t } = useI18n()

const amount = ref('') // ₮
const rate = ref('')   // monthly %
const term = ref(12)   // months

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

// NumberFlow rounds + groups (mn-MN) live; ₮ is rendered as a static suffix.
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
      <div class="flex flex-col gap-6 sm:flex-row sm:gap-[34px]">
        <AppInput v-model="amount" :label="t('fab.calculator.amount')" type="number" inputmode="numeric" unit="₮" />
        <AppInput v-model="rate" :label="t('fab.calculator.rate')" type="number" inputmode="decimal" unit="%" unit-position="trailing" />
        <NumberStepper v-model="term" :label="t('fab.calculator.term')" :min="1" :max="360" />
      </div>

      <!-- <AppButton variant="accent" block size="lg" type="button">
        {{ t('fab.calculator.calculate') }}
      </AppButton> -->

      <div class="flex flex-col gap-6 rounded-[24px] bg-[#f7f7f7] p-6 sm:flex-row">
        <div class="flex flex-1 items-center justify-between gap-4 rounded-[24px] bg-white p-6">
          <span class="text-base text-foreground/60">{{ t('fab.calculator.monthly') }}</span>
          <span class="text-xl font-medium text-[#252525]">
            <AppNumberFlow :value="monthly" :format="fmt" suffix="₮" />
          </span>
        </div>
        <div class="flex flex-1 items-center justify-between gap-4 rounded-[24px] bg-white p-6">
          <span class="text-base text-foreground/60">{{ t('fab.calculator.total') }}</span>
          <span class="text-xl font-bold text-accent-bright">
            <AppNumberFlow :value="total" :format="fmt" suffix="₮" />
          </span>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped>
/* Press micro-interaction: subtle blur + scale with a fast-out deceleration curve. */
.calc-body :deep(button) {
  transition:
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1),
    filter 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.calc-body :deep(button:active:not(:disabled)) {
  transform: scale(0.88);
}
</style>
