<script setup lang="ts">
// One board-of-directors row (Figma 1:7907) — portrait + name/title on the
// left, bio on the right. Stacks (photo above text) on small screens.
import type { BoardMember } from '~/data/about'

defineProps<{ member: BoardMember }>()
</script>

<template>
  <div class="flex flex-col gap-5 border-t border-black/10 py-8 md:flex-row md:items-start md:justify-between md:gap-10">
    <div class="flex items-center gap-5 md:gap-8 lg:gap-12">
      <NuxtImg
        :src="member.photo"
        :alt="member.name"
        width="120"
        height="144"
        class="h-36 w-[120px] shrink-0 rounded-[--radius] object-cover"
      />
      <div class="flex flex-col gap-2.5">
        <h3 class="text-xl font-semibold uppercase leading-tight text-black sm:text-2xl">{{ member.name }}</h3>
        <p class="text-base font-light text-[rgba(0,0,0,0.6)] sm:text-lg">{{ member.role }}</p>
      </div>
    </div>
    <p class="text-sm font-light leading-6 text-[rgba(0,0,0,0.6)] sm:text-base md:max-w-[720px] md:pt-1">
      {{ member.bio }}
    </p>
  </div>
</template>
