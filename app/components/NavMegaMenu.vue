<script setup lang="ts">
// The white dropdown panel for a nav mega-menu (Figma 1:11916 Иргэнд /
// 1:11775 Бизнесд). Generic + config-driven: one promo card on `promoSide`, a
// section label, and a 2-column link grid. Links are split column-major
// (ceil(n/2) in the first column) to match the Figma layout.
interface MenuLink {
  to: string
  title: string
  desc?: string
}
interface MenuPromo {
  variant: 'beep' | 'fincobiz'
  logo: string
  logoAlt: string
  tagline: string
  ctaLabel: string
  ctaTo: string
}

const props = defineProps<{
  sectionLabel: string
  links: MenuLink[]
  promoSide: 'left' | 'right'
  promo: MenuPromo
}>()

const columns = computed<MenuLink[][]>(() => {
  const per = Math.ceil(props.links.length / 2)
  return [props.links.slice(0, per), props.links.slice(per)]
})
</script>

<template>
  <div
    class="flex gap-10 overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.04]"
  >
    <NavPromoCard
      v-if="promoSide === 'left'"
      v-bind="promo"
    />

    <div
      v-if="promoSide === 'left'"
      aria-hidden="true"
      class="w-px shrink-0 self-stretch bg-black/10"
    />

    <!-- link grid + section label -->
    <div class="flex min-w-0 flex-1 flex-col gap-8 py-2">
      <p class="text-sm font-extralight leading-5 text-black/60">{{ sectionLabel }}</p>
      <div class="grid grid-cols-2 gap-x-12">
        <div
          v-for="(col, ci) in columns"
          :key="ci"
          class="flex flex-col gap-8"
        >
          <NavMenuLink
            v-for="link in col"
            :key="link.to + link.title"
            :to="link.to"
            :title="link.title"
            :desc="link.desc"
          />
        </div>
      </div>
    </div>

    <div
      v-if="promoSide === 'right'"
      aria-hidden="true"
      class="w-px shrink-0 self-stretch bg-black/10"
    />

    <NavPromoCard
      v-if="promoSide === 'right'"
      v-bind="promo"
    />
  </div>
</template>
