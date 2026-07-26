<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Multi-step accordion form, driven by the job's `applicationSections` content.
const props = defineProps<{
  sections: NonNullable<Collections['jobs']['applicationSections']>
  jobSlug: string
}>()
const { t } = useI18n()

const openId = ref(props.sections[0]?.id)
const form = reactive<Record<string, string>>({})
const pending = ref(false)
const done = ref(false)
const error = ref('')

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/careers/apply', {
      method: 'POST',
      body: { job: props.jobSlug, fields: { ...form } },
    })
    done.value = true
  }
  catch {
    error.value = t('exam.error')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <form v-if="!done" @submit.prevent="submit">
    <div class="divide-y divide-input rounded-[var(--radius)] border border-input">
      <div v-for="section in sections" :key="section.id">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          @click="openId = openId === section.id ? '' : section.id"
        >
          <span class="font-display font-medium text-foreground">{{ section.title }}</span>
          <Icon
            name="lucide:chevron-down"
            class="size-5 text-muted-foreground transition-transform"
            :class="openId === section.id ? 'rotate-180' : ''"
          />
        </button>
        <div v-show="openId === section.id" class="space-y-4 px-5 pb-6">
          <div v-for="f in section.fields" :key="f.name">
            <label :for="f.name" class="mb-1 block text-sm font-medium text-foreground">
              {{ f.label }}<span v-if="f.required" class="text-red-500"> *</span>
            </label>
            <textarea
              v-if="f.type === 'textarea'"
              :id="f.name"
              v-model="form[f.name]"
              :required="f.required"
              rows="3"
              class="w-full rounded-[var(--radius-sm)] border border-input bg-white px-3 py-2 outline-none focus:border-primary"
            />
            <select
              v-else-if="f.type === 'select'"
              :id="f.name"
              v-model="form[f.name]"
              :required="f.required"
              class="w-full rounded-[var(--radius-sm)] border border-input bg-white px-3 py-2 outline-none focus:border-primary"
            >
              <option value="" disabled>—</option>
              <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
            </select>
            <!-- File gets its own branch: the generic text styling put the OS
                 button and the selected filename inline inside a padded, bordered
                 box, so a long filename overflowed it at 375 and the row sat
                 taller than its siblings. `file:` styles the native button,
                 `min-w-0` + `truncate` keep the filename inside the field, and
                 `accept` makes the mobile picker filter to documents.
                 NOTE: no v-model — Vue does not support it on a file input, so
                 the value never bound here anyway. Wiring the upload is the
                 separate P8 task (see server/api/careers/apply.post.ts). -->
            <input
              v-else-if="f.type === 'file'"
              :id="f.name"
              type="file"
              :required="f.required"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="block w-full min-w-0 truncate rounded-[var(--radius-sm)] border border-input bg-white px-3 py-1 text-sm text-foreground outline-none focus:border-primary file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-1.5 file:text-sm file:text-secondary-foreground"
            >
            <input
              v-else
              :id="f.name"
              v-model="form[f.name]"
              :type="f.type"
              :required="f.required"
              class="w-full rounded-[var(--radius-sm)] border border-input bg-white px-3 py-2 outline-none focus:border-primary"
            >
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <AppButton type="submit" :disabled="pending" size="lg" arrow class="mt-6">
      {{ t('common.submit') }}
    </AppButton>
  </form>

  <div v-else class="rounded-[var(--radius)] border border-teal/30 bg-teal/5 p-6 text-foreground">
    <Icon name="lucide:check-circle" class="size-8 text-teal" />
    <p class="mt-3 font-display font-semibold">{{ t('common.submit') }} ✓</p>
  </div>
</template>
