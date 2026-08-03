<script setup lang="ts">
// The white dropdown panel for a nav mega-menu (Figma 1:11916 Иргэнд /
// 1:11775 Бизнесд). Generic + config-driven: promo card on the left plus a
// link grid chunked column-major into columns of at most five links
// (Иргэнд: 5, Бизнесд: 5 + 3). The panel is content-sized; the caller
// centers it under the nav bar.
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
  links: MenuLink[]
  promo: MenuPromo
}>()

const PER_COLUMN = 5
const columns = computed<MenuLink[][]>(() => {
  const cols: MenuLink[][] = []
  for (let i = 0; i < props.links.length; i += PER_COLUMN)
    cols.push(props.links.slice(i, i + PER_COLUMN))
  return cols
})
</script>

<template>
  <!-- Card chrome (bg/rounding/shadow/ring/overflow) is applied by the caller's
       resizing frame in SiteHeader so `.t-resize` can clip + tween it; here we
       only lay out the promo + link columns. -->
  <div class="flex gap-3 p-6">
    <!-- <NavPromoCard v-bind="promo" /> -->

    <!-- fixed 440px columns per Figma; min-w-0 lets them shrink (text wraps)
         when the viewport caps the panel below its natural width -->
    <div
      v-for="(col, ci) in columns"
      :key="ci"
      class="flex w-[440px] min-w-0 flex-col gap-1"
    >
      <NavMenuLink
        v-for="link in col"
        :key="link.to + link.title"
        :to="link.to"
        :title="link.title"
        :desc="undefined"
      />
    </div>
  </div>
</template>
