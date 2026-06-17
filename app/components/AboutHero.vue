<script setup lang="ts">
// About hero (Figma 1:12190) — full-bleed dark office photo with a vertical
// dark gradient; centred headline (white→#d8d8d8 gradient text) + intro
// paragraph sitting in the lower third. The transparent overlay nav floats on
// top (page opts in via `definePageMeta({ transparentHeader: true })`).
defineProps<{ headline: string; intro: string; photo: string }>()
</script>

<template>
  <section
    class="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[#080a12] text-white"
  >
    <NuxtImg
      :src="photo"
      :alt="headline"
      width="1920"
      height="1228"
      fetchpriority="high"
      class="absolute inset-0 -z-20 size-full object-cover object-center"
    />
    <!-- Legibility gradient: solid dark bottom → lightly tinted top (Figma) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(to top, #080a12 14.7%, rgba(8,10,18,0.8) 50.3%, rgba(8,10,18,0.2) 85.9%);"
    />

    <div class="mx-auto w-full max-w-5xl px-4 pb-[12vh] pt-32 text-center sm:pb-[14vh]">
      <MotionReveal :y="28">
        <h1
          class="mx-auto max-w-4xl bg-gradient-to-b from-white to-[#d8d8d8] bg-clip-text font-display text-[1.75rem] font-medium leading-[1.2] tracking-tight text-transparent sm:text-[2.25rem] lg:text-[2.5rem] lg:leading-[1.25]"
          style="text-shadow: 0 0 10px rgba(255,255,255,0.12);"
        >
          {{ headline }}
        </h1>
      </MotionReveal>
      <MotionReveal :y="24" :delay="0.12">
        <p
          class="mx-auto mt-8 max-w-4xl text-sm font-thin leading-6 tracking-[0.2px] text-white/60 sm:mt-10 sm:text-lg sm:leading-7"
        >
          {{ intro }}
        </p>
      </MotionReveal>
    </div>
  </section>
</template>
