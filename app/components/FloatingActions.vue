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
  <!-- `fab-dock` is the hook for the yield rule in main.css — see the
       body:has(.anx-overlay) block there. -->
  <div class="fab-dock fixed bottom-6 right-6 z-50">
    <!-- Liquid-glass pill (client-only: the effect relies on backdrop-filter +
         SVG feature detection, so SSR would hydration-mismatch). -->
    <ClientOnly>
      <!-- Glass pill materialises on mount: scale + fade up from the corner. -->
      <div class="fab-reveal">
        <GlassSurface :width="64" :height="124" :border-radius="9999">
        <div class="fab-buttons flex flex-col items-center justify-end gap-3">
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
        </div>
        </GlassSurface>
      </div>
    </ClientOnly>

    <LoanCalculatorDialog v-model:open="showCalculator" />
  </div>
</template>

<style scoped>
/* Staggered entrance (CSS @keyframes, not a JS toggle, so nothing strands on the
   ClientOnly node; `backwards` holds each element hidden through its delay — no
   first-paint flash — and leaves no lingering transform, keeping the glass
   backdrop-filter intact):
     1. wait 0.9s after mount,
     2. the glass pill rises out of the corner and settles with one soft
        overshoot (0.55s),
     3. the buttons follow with a quick bottom-up stagger — the one nearest the
        pill's origin corner first — overlapping the settle. */
.fab-reveal {
  animation: fab-rise-in 0.55s cubic-bezier(0.22, 1.2, 0.36, 1) 0.9s backwards;
  transform-origin: bottom right;
}

.fab-buttons > * {
  animation: fab-item-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
.fab-buttons > *:nth-child(1) {
  animation-delay: 1.3s;
}
.fab-buttons > *:nth-child(2) {
  animation-delay: 1.18s;
}

@keyframes fab-rise-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fab-item-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fab-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fab-reveal {
    animation: fab-fade-in 0.3s ease 1s backwards;
  }
  .fab-buttons > * {
    animation: fab-fade-in 0.3s ease 1.3s backwards;
  }
}

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
