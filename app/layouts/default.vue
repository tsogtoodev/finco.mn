<script setup lang="ts">
// Base shell. Full header/footer composition lands in Phase 7 (Figma assembly).
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-b border-black/5">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <NuxtLink :to="localePath('/')" class="font-display text-lg font-semibold text-brand-700">
          finco.mn
        </NuxtLink>
        <nav class="flex items-center gap-6 text-sm">
          <NuxtLink :to="localePath('/')" class="text-muted hover:text-ink">{{ t('nav.home') }}</NuxtLink>
          <NuxtLink :to="localePath('/about')" class="text-muted hover:text-ink">{{ t('nav.about') }}</NuxtLink>
          <LocaleSwitcher />
          <AuthButton />
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
