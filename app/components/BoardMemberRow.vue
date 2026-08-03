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
        <h3 class="text-xl font-semibold uppercase leading-tight text-black sm:text-[20px]">{{ member.name }}</h3>
        <p class="text-base font-light text-[rgba(0,0,0,0.6)] sm:text-lg">{{ member.role }}</p>
      </div>
    </div>
    <!-- Bio column. When the member has a `bioHover` career timeline, hovering
         the description cross-fades the bio out and the timeline in (they're
         stacked, so no layout shift). The row's photo keeps it tall enough for
         the timeline to reveal in place without pushing into the next row.
         See the scoped styles for the touch fallback. -->
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
/* The cross-fade is expressed here rather than with `group-hover:` utilities so
   the two states can be scoped to pointer capability explicitly. Every board
   member carries a six-line `bioHover` career history; with a bare :hover rule
   that content was present in the DOM (and announced by screen readers) but
   impossible to reveal on any touch device. */
.bio-main,
.bio-alt {
  transition: opacity 300ms;
}
.bio-alt {
  position: absolute;
  inset-inline: 0;
  /* Centered like .bio-main so the cross-fade swaps in place. */
  top: 50%;
  translate: 0 -50%;
  opacity: 0;
  white-space: pre-line;
}

/* Pointer devices keep the designed cross-fade. */
@media (hover: hover) {
  .bio:hover .bio-main {
    opacity: 0;
  }
  .bio:hover .bio-alt {
    opacity: 1;
  }
}

/* Touch: there is no hover to trigger, so the timeline drops into normal flow
   under the bio and both simply read. Guarding on (hover: none) rather than
   width also avoids iOS' sticky :hover-on-tap fading the bio out underneath it. */
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
