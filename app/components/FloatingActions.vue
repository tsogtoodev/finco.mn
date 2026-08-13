<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const showCalculator = ref(false)
</script>

<template>
  <div class="fab-dock fixed bottom-6 right-6 z-50">
    <ClientOnly>
      <div class="fab-reveal">
        <GlassSurface :width="64" :height="124" :border-radius="9999">
        <div class="fab-buttons flex flex-col items-center justify-end gap-3">
          <button
            type="button"
            :aria-label="t('fab.calculator.label')"
            class="fab-btn cursor-pointer"
            @click="showCalculator = true"
          >
            <Icon name="f:calculator" class="text-[24px]" />
          </button>

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

.fab-btn:focus-visible,
.fab-btn:active {
  background: #4c41d8;
  color: #fff;
}

.fab-btn:active {
  transform: scale(0.88);
}

@media (prefers-reduced-motion: reduce) {
  .fab-btn:active {
    transform: none;
    filter: none;
  }
}
</style>
