<script setup lang="ts">
// Fixed FAB stack, bottom-right (Figma 251:14882 — lavender pill container holding
// two white icon circles):
//  • Calculator (outline) — opens the loan-calculator dialog.
//  • Messenger — links to the contact page for now (placeholder; a chatbot panel
//    will replace this NuxtLink later).
const { t } = useI18n()
const localePath = useLocalePath()

const showCalculator = ref(false)
</script>

<template>
  <div
    class="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-end gap-3 rounded-full border border-[#e2e8eb] bg-[#f6f6ff] p-2 drop-shadow-[0_0_10px_rgba(0,0,0,0.05)]"
  >
    <!-- Calculator FAB -->
    <button
      type="button"
      :aria-label="t('fab.calculator.label')"
      class="fab-btn cursor-pointer"
      @click="showCalculator = true"
    >
      <Icon name="f:calculator" class="text-[24px]" />
    </button>

    <!-- Messenger FAB: contact link (TODO: swap for an in-app chatbot panel) -->
    <NuxtLink
      :to="localePath('/contact')"
      :aria-label="t('fab.chat.label')"
      class="fab-btn"
    >
      <Icon name="f:messenger" class="text-[24px]" />
    </NuxtLink>

    <LoanCalculatorDialog v-model:open="showCalculator" />
  </div>
</template>

<style scoped>
/* Button component states (Figma 256:7906): idle → hover → focus/click */
.fab-btn {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  border: 2px solid #f2f2f2;
  background: #fff;
  color: #646466;
  transition:
    background-color 0.2s cubic-bezier(0.25, 1, 0.5, 1),
    color 0.2s cubic-bezier(0.25, 1, 0.5, 1),
    transform 0.2s cubic-bezier(0.25, 1, 0.5, 1),
    filter 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform;
}

.fab-btn:hover {
  background: #dbdaee;
  color: #646466;
}

/* focus/click (pressed) state — order after :hover so a press while hovering wins */
.fab-btn:focus-visible,
.fab-btn:active {
  background: #4c41d8;
  color: #fff;
}

/* Tactile press micro-interaction: a brief scale-down + soft blur that springs
   back crisp on release (cubic-bezier deceleration is on the transition above).
   Press-only — a persistent blur would soften the icon and hurt legibility. */
.fab-btn:active {
  transform: scale(0.88);
  /* filter: blur(1px); */
}

@media (prefers-reduced-motion: reduce) {
  .fab-btn:active {
    transform: none;
    filter: none;
  }
}
</style>
