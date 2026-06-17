<script setup lang="ts">
// Top promo strip. Dark bg, centered message + teal CTA (Figma node 1:3711).
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="bg-dark text-white">
    <div class="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-sm">
      <span class="text-white/75">{{ t('announcement.text') }}</span>
      <NuxtLink
        :to="localePath('/products')"
        class="inline-flex items-center gap-1 font-medium text-teal transition-opacity hover:opacity-80"
      >
        {{ t('announcement.cta') }}
        <Icon name="hugeicons:arrow-right-01" class="size-4" />
      </NuxtLink>
    </div>
  </div>
</template>
