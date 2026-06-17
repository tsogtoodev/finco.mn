<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{ branch: Collections['branches']; active: boolean }>()
defineEmits<{ select: [] }>()

const { t } = useI18n()
const detailsId = computed(() => `branch-details-${props.branch.slug}`)
// tel: links want digits only (keep a leading +)
const telHref = computed(() => props.branch.phone?.replace(/[^\d+]/g, ''))
</script>

<template>
  <li
    class="relative rounded-[24px] border border-[#8a5df2]/20 bg-white p-6 transition-colors"
    :class="active ? 'shadow-[0_8px_24px_-12px_rgba(76,65,216,0.25)]' : 'hover:border-[#8a5df2]/40'"
  >
    <!-- Stretched select button (sits under the content so the whole card is clickable) -->
    <button
      type="button"
      class="absolute inset-0 z-0 rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :aria-expanded="active"
      :aria-controls="detailsId"
      :aria-label="t('branchesPage.selectAria', { name: branch.name })"
      @click="$emit('select')"
    />

    <div class="pointer-events-none relative z-10 flex items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p
          class="truncate"
          :class="active
            ? 'text-xl font-semibold leading-7 tracking-[0.2px] text-accent'
            : 'text-lg font-normal leading-7 tracking-[0.18px] text-black/80'"
        >
          {{ branch.name }}
        </p>

        <Transition name="branch-details">
          <div
            v-if="active"
            :id="detailsId"
            class="mt-3 space-y-2 text-base leading-[22px] tracking-[0.16px] text-black/80"
          >
            <p v-if="branch.hours">{{ branch.hours }}</p>
            <p v-if="branch.phone">
              <a
                :href="`tel:${telHref}`"
                class="pointer-events-auto relative z-20 transition-colors hover:text-accent"
              >{{ branch.phone }}</a>
            </p>
            <p>{{ branch.address }}</p>
          </div>
        </Transition>
      </div>

      <Icon
        name="lucide:arrow-right"
        class="size-4 shrink-0"
        :class="active ? 'text-accent' : 'text-black/40'"
      />
    </div>
  </li>
</template>

<style scoped>
.branch-details-enter-active,
.branch-details-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.branch-details-enter-from,
.branch-details-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .branch-details-enter-active,
  .branch-details-leave-active {
    transition: none;
  }
}
</style>
