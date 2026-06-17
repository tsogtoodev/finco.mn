<script setup lang="ts">
defineProps<{ items?: { question: string; answer: string }[]; heading?: string }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="items?.length" class="mx-auto max-w-3xl px-4 py-16">
    <MotionReveal>
      <h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {{ heading || t('faq.heading') }}
      </h2>
    </MotionReveal>
    <div class="mt-8">
      <AccordionItem v-for="(f, i) in items" :key="i" :question="f.question">
        {{ f.answer }}
      </AccordionItem>
    </div>
  </section>
</template>
