<script setup lang="ts">
// NET-NEW: Contact feedback form. No Figma source — built from the existing
// design tokens and the ApplicationForm input styling (rounded-[--radius-sm],
// border-input, focus:border-primary). Client-side validation + inline errors,
// posts to the /api/contact stub, shows success / error states.
const { t } = useI18n()

type Field = 'name' | 'email' | 'phone' | 'message'

const form = reactive<Record<Field, string>>({ name: '', email: '', phone: '', message: '' })
const errors = reactive<Record<Field, string>>({ name: '', email: '', phone: '', message: '' })

const pending = ref(false)
const done = ref(false)
const serverError = ref('')
const successRef = ref<HTMLElement | null>(null)

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Allows +, spaces, dashes, parens; 8–15 digits total.
const phoneRe = /^\+?[\d\s().-]{8,20}$/

function validateField(f: Field): string {
  const v = form[f].trim()
  if (!v) return t('contactPage.form.errors.required')
  if (f === 'email' && !emailRe.test(v)) return t('contactPage.form.errors.email')
  if (f === 'phone' && !phoneRe.test(v)) return t('contactPage.form.errors.phone')
  return ''
}

function validateAll(): boolean {
  let ok = true
  for (const f of ['name', 'email', 'phone', 'message'] as Field[]) {
    errors[f] = validateField(f)
    if (errors[f]) ok = false
  }
  return ok
}

function clearError(f: Field) {
  if (errors[f]) errors[f] = ''
}

async function submit() {
  serverError.value = ''
  if (!validateAll()) {
    // Move focus to the first invalid field for keyboard/SR users.
    await nextTick()
    const first = (['name', 'email', 'phone', 'message'] as Field[]).find(f => errors[f])
    if (first) document.getElementById(`contact-${first}`)?.focus()
    return
  }

  pending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { name: form.name, email: form.email, phone: form.phone, message: form.message },
    })
    done.value = true
    await nextTick()
    successRef.value?.focus()
  }
  catch {
    serverError.value = t('contactPage.form.errors.server')
  }
  finally {
    pending.value = false
  }
}

const fieldClass
  = 'w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2.5 text-base outline-none transition-colors focus:border-primary'
</script>

<template>
  <div
    v-if="done"
    ref="successRef"
    tabindex="-1"
    class="flex h-full flex-col items-start justify-center rounded-[var(--radius)] border border-teal/30 bg-teal/5 p-6 outline-none sm:p-8"
  >
    <Icon name="lucide:check-circle" class="size-10 text-teal" />
    <h2 class="mt-4 font-display text-2xl font-medium text-foreground">
      {{ t('contactPage.form.success.title') }}
    </h2>
    <p class="mt-2 text-muted-foreground">{{ t('contactPage.form.success.body') }}</p>
  </div>

  <form
    v-else
    novalidate
    class="rounded-[var(--radius)] border border-input bg-white p-6 ring-1 ring-black/5 sm:p-8"
    @submit.prevent="submit"
  >
    <h2 class="font-display text-2xl font-medium text-foreground">
      {{ t('contactPage.form.heading') }}
    </h2>

    <div class="mt-6 space-y-5">
      <!-- Name -->
      <div>
        <label for="contact-name" class="mb-1 block text-sm font-medium text-foreground">
          {{ t('contactPage.form.name') }} <span class="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          v-model="form.name"
          type="text"
          :placeholder="t('contactPage.form.namePlaceholder')"
          :class="[fieldClass, errors.name ? 'border-red-400' : 'border-input']"
          :aria-invalid="!!errors.name"
          :aria-describedby="errors.name ? 'contact-name-error' : undefined"
          @blur="errors.name = validateField('name')"
          @input="clearError('name')"
        >
        <p v-if="errors.name" id="contact-name-error" role="alert" class="mt-1 text-sm text-red-600">
          {{ errors.name }}
        </p>
      </div>

      <!-- Email -->
      <div>
        <label for="contact-email" class="mb-1 block text-sm font-medium text-foreground">
          {{ t('contactPage.form.email') }} <span class="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          v-model="form.email"
          type="email"
          :placeholder="t('contactPage.form.emailPlaceholder')"
          :class="[fieldClass, errors.email ? 'border-red-400' : 'border-input']"
          :aria-invalid="!!errors.email"
          :aria-describedby="errors.email ? 'contact-email-error' : undefined"
          @blur="errors.email = validateField('email')"
          @input="clearError('email')"
        >
        <p v-if="errors.email" id="contact-email-error" role="alert" class="mt-1 text-sm text-red-600">
          {{ errors.email }}
        </p>
      </div>

      <!-- Phone -->
      <div>
        <label for="contact-phone" class="mb-1 block text-sm font-medium text-foreground">
          {{ t('contactPage.form.phone') }} <span class="text-red-500">*</span>
        </label>
        <input
          id="contact-phone"
          v-model="form.phone"
          type="tel"
          :placeholder="t('contactPage.form.phonePlaceholder')"
          :class="[fieldClass, errors.phone ? 'border-red-400' : 'border-input']"
          :aria-invalid="!!errors.phone"
          :aria-describedby="errors.phone ? 'contact-phone-error' : undefined"
          @blur="errors.phone = validateField('phone')"
          @input="clearError('phone')"
        >
        <p v-if="errors.phone" id="contact-phone-error" role="alert" class="mt-1 text-sm text-red-600">
          {{ errors.phone }}
        </p>
      </div>

      <!-- Message -->
      <div>
        <label for="contact-message" class="mb-1 block text-sm font-medium text-foreground">
          {{ t('contactPage.form.message') }} <span class="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          v-model="form.message"
          rows="4"
          :placeholder="t('contactPage.form.messagePlaceholder')"
          :class="[fieldClass, 'resize-y', errors.message ? 'border-red-400' : 'border-input']"
          :aria-invalid="!!errors.message"
          :aria-describedby="errors.message ? 'contact-message-error' : undefined"
          @blur="errors.message = validateField('message')"
          @input="clearError('message')"
        />
        <p v-if="errors.message" id="contact-message-error" role="alert" class="mt-1 text-sm text-red-600">
          {{ errors.message }}
        </p>
      </div>
    </div>

    <p v-if="serverError" role="alert" class="mt-4 text-sm text-red-600">{{ serverError }}</p>

    <AppButton type="submit" :disabled="pending" block size="lg" arrow class="mt-6">
      {{ pending ? t('contactPage.form.submitting') : t('contactPage.form.submit') }}
    </AppButton>
  </form>
</template>
