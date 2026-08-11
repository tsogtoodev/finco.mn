<script setup lang="ts">
defineProps<{ headline: string; intro: string; photo: string }>()

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
      preload
      wrapper-class="-z-20"
      img-class="size-full object-cover object-center"
    />
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
        class="mx-auto max-w-4xl justify-center font-display text-[1.75rem] font-medium leading-[1.2] tracking-tight text-white sm:text-[28px] lg:text-[28px] lg:leading-[1.25]"
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
        class="mx-auto mt-8 max-w-[1200px] justify-center text-sm font-thin leading-6 tracking-[0.2px] text-white/60 sm:mt-6 sm:text-[14px] sm:leading-[24px]"
      />
    </div>
  </section>
</template>
