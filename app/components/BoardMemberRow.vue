<script setup lang="ts">
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
        <h3 class="text-xl font-semibold uppercase leading-tight text-black sm:text-[20px]">{{ member.name }}</h3>
        <p class="text-base font-light text-[rgba(0,0,0,0.6)] sm:text-lg">{{ member.role }}</p>
      </div>
    </div>
    <div class="bio relative flex flex-col justify-center text-sm font-light leading-6 text-[rgba(0,0,0,0.6)] sm:text-base md:max-w-[720px] md:self-stretch">
      <p class="bio-main">
        {{ member.bio }}
      </p>
      <p v-if="member.bioHover" class="bio-alt text-[14px] leading-[24px]">
        {{ member.bioHover }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.bio-main,
.bio-alt {
  transition: opacity 300ms;
}
.bio-alt {
  position: absolute;
  inset-inline: 0;
  top: 50%;
  translate: 0 -50%;
  opacity: 0;
  white-space: pre-line;
}

@media (hover: hover) {
  .bio:hover .bio-main {
    opacity: 0;
  }
  .bio:hover .bio-alt {
    opacity: 1;
  }
}

@media (hover: none) {
  .bio-alt {
    position: static;
    translate: none;
    margin-top: 0.75rem;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bio-main,
  .bio-alt {
    transition: none;
  }
}
</style>
