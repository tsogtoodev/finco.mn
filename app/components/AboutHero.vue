<script setup lang="ts">
// About hero (Figma 1:12190) — full-bleed dark office photo with a vertical
// dark gradient; centred headline (white→#d8d8d8 gradient text) + intro
// paragraph sitting in the lower third. The transparent overlay nav floats on
// top (page opts in via `definePageMeta({ transparentHeader: true })`).
defineProps<{ headline: string; intro: string; photo: string }>()

// Reveal WITHOUT the blur step, unlike the other five heroes.
// BlurText's default keyframes go blur(10px) → blur(5px) → blur(0). That reads as
// a quick fade on a short subtitle, but this hero's intro is 63 words: at 20ms of
// stagger per word the last one doesn't start until ~1.34s, so the paragraph
// spends the better part of two seconds as a word-by-word smear. On desktop the
// whole block sits in view at once, so all of it smears together — which is why
// this hero looked wrong and the others didn't. Keeping the fade + slide preserves
// the staggered reveal; only the blur goes.
const FADE_FROM = { opacity: 0, y: -20 }
const FADE_TO = [
  { opacity: 0.5, y: 5 },
  { opacity: 1, y: 0 },
]
</script>

<template>
  <section
    class="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[#080a12] text-white"
  >
    <HeroBackgroundImage
      :src="photo"
      :alt="headline"
      :width="1920"
      :height="1228"
      fetchpriority="high"
      wrapper-class="-z-20"
      img-class="size-full object-cover object-center"
    />
    <!-- Legibility gradient: solid dark bottom → lightly tinted top (Figma) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(to top, #080A12 14.7%, rgba(8,10,18,0.8) 50.3%, rgba(8,10,18,0.2) 85.9%);"
    />

    <div class="mx-auto w-full max-w-5xl px-4 pb-[12vh] pt-32 text-center sm:pb-[14vh]">
      <BlurText
        :text="headline"
        as="h1"
        animate-by="words"
        :delay="60"
        :animation-from="FADE_FROM"
        :animation-to="FADE_TO"
        class="mx-auto max-w-4xl justify-center font-display text-[1.75rem] font-medium leading-[1.2] tracking-tight text-white sm:text-[2.25rem] lg:text-[2.5rem] lg:leading-[1.25]"
        style="text-shadow: 0 0 10px rgba(255,255,255,0.12);"
      />
      <BlurText
        :text="intro"
        as="p"
        animate-by="words"
        :delay="20"
        :start-delay="0.1"
        :animation-from="FADE_FROM"
        :animation-to="FADE_TO"
        class="mx-auto mt-8 max-w-[1200px] justify-center text-sm font-thin leading-6 tracking-[0.2px] text-white/60 sm:mt-10 sm:text-lg sm:leading-7"
      />
    </div>
  </section>
</template>
