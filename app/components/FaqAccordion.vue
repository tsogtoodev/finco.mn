<script setup lang="ts">
// Shared FAQ block (Figma 1:13733 / 1:14010). Centered heading + accordion; all
// items start collapsed. Used by the products/business listing and the detail
// pages — same `items` API.
defineProps<{ items?: { question: string; answer: string }[]; heading?: string }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="items?.length" class="bg-white px-6 py-[80px]">
    <div class="mx-auto flex w-full max-w-[1240px] flex-col gap-10 sm:gap-16">
      <MotionReveal class="flex flex-col gap-[8px]">
        <h2 class="text-center font-display text-3xl font-normal leading-tight text-black sm:text-[28px]">
          {{ heading || t('faq.heading') }}
        </h2>
      </MotionReveal>
      <div class="flex flex-col gap-3">
        <AccordionItem
          v-for="(f, i) in items"
          :key="i"
          :question="f.question"
        >
          {{ f.answer }}
        </AccordionItem>
      </div>
    </div>
  </section>
</template>
