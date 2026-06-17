<script setup lang="ts">
// Password field with a reveal toggle.
const model = defineModel<string>()
const props = defineProps<{ id?: string; placeholder?: string; required?: boolean }>()
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :required="required"
      class="w-full rounded-[var(--radius-sm)] border border-input bg-white px-3 py-2.5 pr-10 outline-none transition-colors focus:border-primary"
    >
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      :aria-label="visible ? 'Hide' : 'Show'"
      @click="visible = !visible"
    >
      <Icon :name="visible ? 'lucide:eye-off' : 'lucide:eye'" class="size-5" />
    </button>
  </div>
</template>
