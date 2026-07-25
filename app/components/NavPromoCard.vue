<script setup lang="ts">
// Promo card inside a NavMegaMenu (Figma 1:11994 Beep / 1:11855 FincoBiz).
// Two variants share one shell: a rounded card with a brand gradient, a logo +
// tagline at the top and a CTA pill at the bottom, plus a variant-specific photo
// (Beep lifestyle shot) or product mockup (FincoBiz platform UI).
const props = defineProps<{
  variant: 'beep' | 'fincobiz'
  logo: string
  logoAlt: string
  tagline: string
  ctaLabel: string
  ctaTo: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(props.ctaTo)"
    class="group relative block w-[245px] shrink-0 self-stretch overflow-hidden rounded-[24px]"
    :class="
      variant === 'beep'
        ? 'bg-[radial-gradient(120%_75%_at_28%_12%,#0f2c23_0%,#071612_50%,#040b09_75%,#000_100%)]'
        : 'bg-[radial-gradient(125%_95%_at_85%_95%,#6695e1_0%,#8aaee9_25%,#aec7f0_50%,#f6f9ff_100%)]'
    "
    :aria-label="logoAlt"
  >
    <!-- Beep: green dot-wave + lifestyle photo -->
    <template v-if="variant === 'beep'">
      <NuxtImg
        src="/images/nav/beep-dots.png"
        alt=""
        aria-hidden="true"
        width="4096"
        height="1622"
        sizes="320px"
        class="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-70 mix-blend-screen"
      />
      <NuxtImg
        src="/images/nav/beep-person.png"
        alt=""
        aria-hidden="true"
        width="1751"
        height="1915"
        sizes="320px"
        class="pointer-events-none absolute bottom-0 right-0 h-[94%] w-auto max-w-none object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <!-- bottom scrim so the CTA reads over the photo -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent to-[#001f16]"
      />
    </template>

    <!-- FincoBiz: laptop render + dark-blue base -->
    <template v-else>
      <NuxtImg
        src="/images/nav/fincobiz-laptop.png"
        alt=""
        aria-hidden="true"
        width="1146"
        height="526"
        sizes="520px"
        class="pointer-events-none absolute bottom-[64px] left-5 w-[500px] max-w-none object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-[33%] bg-gradient-to-b from-transparent to-[#214784]"
      />
    </template>

    <!-- foreground: logo + tagline (top) and CTA (bottom) -->
    <div class="relative flex h-full min-h-[448px] flex-col justify-between p-5">
      <div class="flex flex-col gap-3">
        <NuxtImg
          :src="logo"
          :alt="logoAlt"
          :width="variant === 'beep' ? 356 : 456"
          :height="variant === 'beep' ? 128 : 88"
          :sizes="variant === 'beep' ? '90px' : '115px'"
          class="h-auto w-auto self-start"
          :class="variant === 'beep' ? 'max-h-7' : 'max-h-6'"
        />
        <p
          v-if="false"
          class="text-sm font-extralight leading-5"
          :class="variant === 'beep' ? 'max-w-[130px] text-white/80' : 'max-w-[207px] font-light text-black/60'"
        >
          {{ tagline }}
        </p>
      </div>

      <span
        class="inline-flex h-10 w-fit items-center gap-2 rounded-[24px] px-4 py-2 text-sm font-medium text-dark shadow-2xs transition-transform group-hover:-translate-y-0.5"
        :class="variant === 'beep' ? 'bg-lime' : 'bg-white'"
      >
        {{ ctaLabel }}
        <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
      </span>
    </div>
  </NuxtLink>
</template>
