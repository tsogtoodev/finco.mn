<script setup lang="ts">
// "Зээлийн тооцоолуур" popup (Figma 1:11586). Amortised monthly payment + total,
// recomputed live as the user types.
defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const { t } = useI18n()

const amount = ref('1000000') // ₮
const rate = ref('1.0')       // monthly %
const term = ref(3)           // months

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
      <!-- Three-across only from lg. The stepper's chips are 44px touch targets
           now, which raises its min-content width — and at 640–1023 all three
           fields were already sitting on their min-content floors, so the row
           overflowed its container by ~35px. At lg the dialog is at its 840px cap
           and each field gets ~236px, which clears every floor. -->
      <div class="flex flex-col gap-6 lg:flex-row lg:gap-[34px]">
        <AppInput v-model="amount" :label="t('fab.calculator.amount')" type="number" inputmode="numeric" unit="₮" :max="1_000_000_000" />
        <AppInput v-model="rate" :label="t('fab.calculator.rate')" type="number" inputmode="decimal" unit="%" unit-position="trailing" :max="100" />
        <NumberStepper v-model="term" :label="t('fab.calculator.term')" :min="1" :max="360" />
      </div>

      <!-- <AppButton variant="accent" block size="lg" type="button">
        {{ t('fab.calculator.calculate') }}
      </AppButton> -->

      <!-- Label ABOVE value until lg, not `sm:`. The tray itself goes side-by-side
           at `sm`, halving each card's width — so a row layout inside the card
           overflowed twice: once at 375 (nested p-6s left ~199px of interior for a
           ~100px label plus a value that can reach 13 digits) and again at 640–800
           once the tray split. AppNumberFlow renders a fixed-width tabular digit
           strip that can neither wrap nor shrink, so the space has to come from
           the layout. -->
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
