<script setup lang="ts">
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
  <div class="flex gap-3 p-6">
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
