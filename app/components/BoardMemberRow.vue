<script setup lang="ts">
// One board-of-directors row (Figma 1:7907) — portrait + name/title on the
// left, bio on the right. Stacks (photo above text) on small screens.
import type { BoardMember } from '~/composables/useAboutContent'

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
        class="h-36 w-[120px] shrink-0 rounded-[var(--radius)] object-cover"
      />
      <div class="flex flex-col gap-2.5">
        <h3 class="text-xl font-semibold uppercase leading-tight text-black sm:text-2xl">{{ member.name }}</h3>
        <p class="text-base font-light text-[rgba(0,0,0,0.6)] sm:text-lg">{{ member.role }}</p>
      </div>
    </div>
    <!-- Bio column. When the member has a `bioHover` career timeline, hovering
         the description cross-fades the bio out and the timeline in (they're
         stacked, so no layout shift). The row's photo keeps it tall enough for
         the timeline to reveal in place without pushing into the next row. -->
    <div class="group/bio relative text-sm font-light leading-6 text-[rgba(0,0,0,0.6)] sm:text-base md:max-w-[720px] md:pt-1">
      <p :class="member.bioHover && 'transition-opacity duration-300 group-hover/bio:opacity-0'">
        {{ member.bio }}
      </p>
      <p
        v-if="member.bioHover"
        class="absolute inset-x-0 top-0 whitespace-pre-line opacity-0 transition-opacity duration-300 group-hover/bio:opacity-100 md:pt-1"
      >
        {{ member.bioHover }}
      </p>
    </div>
  </div>
</template>
