<script setup lang="ts">
// Language switcher: a pill (globe + the active locale's code) that toggles to
// the *other* locale on click. Hovering reveals a dropdown listing both
// locales; clicking an item switches straight to it. Switching preserves the
// current route via i18n's resolver.
// `variant` restyles the trigger for the white-on-dark overlay nav vs the
// dark-on-light solid nav (Figma nodes 1:2623 / 1:13509). The dropdown panel
// is always solid white so it stays readable over either nav.
// Hover reveal is pure CSS (group-hover) rather than motion-v / Vue
// <Transition>: rAF-driven presence animations strand on hydrated/teleported
// nodes here (see .mega-pop in main.css).
withDefaults(defineProps<{ variant?: 'solid' | 'overlay' }>(), {
  variant: 'solid',
})

const { locale, locales, setLocale } = useI18n()

type LocaleItem = { code: string; name?: string }
const items = computed(() => locales.value as LocaleItem[])

// Only two locales, so "other" is the single target the trigger toggles to.
const other = computed(() => items.value.find((l) => l.code !== locale.value))
</script>

<template>
  <div class="group relative">
    <!-- trigger: shows the active locale, click toggles to the other -->
    <button
      v-if="other"
      type="button"
      class="flex items-center gap-2 rounded-full py-2 pl-2 pr-2 text-sm font-normal transition-colors"
      :class="
        variant === 'overlay'
          ? 'bg-white/10 text-white hover:bg-white/20'
          : 'bg-black/5 text-dark hover:bg-black/10'
      "
      :aria-label="`Switch language to ${other.code.toUpperCase()}`"
      @click="setLocale(other.code)"
    >
      <svg viewBox="0 0 20 20" class="size-5 shrink-0" fill="none" aria-hidden="true">
        <path
          d="M18.3332 9.99984C18.3332 14.6022 14.6022 18.3332 9.99984 18.3332M18.3332 9.99984C18.3332 5.39746 14.6022 1.6665 9.99984 1.6665M18.3332 9.99984C18.3332 8.61912 14.6022 7.49984 9.99984 7.49984C5.39746 7.49984 1.6665 8.61912 1.6665 9.99984M18.3332 9.99984C18.3332 11.3805 14.6022 12.4998 9.99984 12.4998C5.39746 12.4998 1.6665 11.3805 1.6665 9.99984M9.99984 18.3332C5.39746 18.3332 1.6665 14.6022 1.6665 9.99984M9.99984 18.3332C11.8408 18.3332 13.3332 14.6022 13.3332 9.99984C13.3332 5.39746 11.8408 1.6665 9.99984 1.6665M9.99984 18.3332C8.15889 18.3332 6.6665 14.6022 6.6665 9.99984C6.6665 5.39746 8.15889 1.6665 9.99984 1.6665M1.6665 9.99984C1.6665 5.39746 5.39746 1.6665 9.99984 1.6665"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </button>

    <!-- hover dropdown: both locales; each switches straight to itself.
         pt-2 keeps a hover bridge so the cursor doesn't drop out mid-move. -->
    <div
      class="t-dropdown absolute right-0 top-full z-50 pt-2"
      data-origin="top-right"
    >
      <ul
        class="min-w-[9rem] overflow-hidden rounded-[16px] bg-white p-1.5 shadow-[0_16px_44px_-24px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.05] space-y-1"
      >
        <li v-for="item in items" :key="item.code">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm transition-colors"
            :class="
              item.code === locale
                ? 'bg-black/[0.06] font-normal text-dark'
                : 'font-light text-black/70 hover:bg-black/5 hover:text-dark'
            "
            :aria-current="item.code === locale ? 'true' : undefined"
            @click="setLocale(item.code)"
          >
            <span>{{ item.name ?? item.code.toUpperCase() }}</span>
            <Icon
              v-if="item.code === locale"
              name="lucide:check"
              class="size-4 shrink-0 text-dark"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
