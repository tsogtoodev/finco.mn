<script setup lang="ts">
// Two fixed FABs, bottom-right (Figma Component 1 — 1:11620 resting / 1:11548 open):
//  • Calculator (white circle) — expands to a "Тооцоолуур" pill on hover/focus,
//    opens the loan-calculator dialog.
//  • Chat (accent circle) — links to the contact page for now (placeholder; a
//    chatbot panel will replace this NuxtLink later).
const { t } = useI18n()
const localePath = useLocalePath()

const showCalculator = ref(false)
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
    <!-- Calculator FAB: icon-only circle that grows into a labelled pill on hover/focus -->
    <button
      type="button"
      :aria-label="t('fab.calculator.label')"
      class="group flex h-14 items-center rounded-full bg-[#fcfcff] px-4 text-accent shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] cursor-pointer"
      @click="showCalculator = true"
    >
      <Icon name="f:calculator" class="shrink-0 text-[24px]" />
      <!-- Smooth grid 0fr→1fr reveal (no max-width jank). -->
      <span
        class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]"
      >
        <span class="min-w-0 overflow-hidden">
          <span class="whitespace-nowrap pl-2 text-sm font-medium">{{ t('fab.calculator.label') }}</span>
        </span>
      </span>
    </button>

    <!-- Chat FAB: contact link (TODO: swap for an in-app chatbot panel) -->
    <NuxtLink
      :to="localePath('/contact')"
      :aria-label="t('fab.chat.label')"
      class="grid size-14 place-items-center rounded-full bg-accent text-white shadow-lg transition-shadow hover:shadow-xl"
    >
      <Icon name="f:chatting" class="text-[24px]" />
    </NuxtLink>

    <LoanCalculatorDialog v-model:open="showCalculator" />
  </div>
</template>
