<script setup lang="ts">
// Exam login — SEPARATE candidate credential (registry no. + password), NOT the
// Firebase user session. Backend endpoint stubbed in P7.5.
definePageMeta({ layout: 'minimal' })

const { t } = useI18n()
const registryNo = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/exam/login', {
      method: 'POST',
      body: { registryNo: registryNo.value, password: password.value },
    })
    // navigateTo to the exam start on success (wired in P7.5)
  }
  catch {
    error.value = t('exam.error')
  }
  finally {
    pending.value = false
  }
}

useSeoMeta({ title: () => t('exam.title'), robots: 'noindex' })
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12">
    <PageHero
      class="!bg-transparent"
      :breadcrumb="[{ label: t('nav.home'), to: '/' }, { label: t('nav.careers'), to: '/careers' }]"
    />
    <div class="grid items-start gap-12 lg:grid-cols-2">
      <!-- Intro + duration -->
      <div class="pt-2">
        <h1 class="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {{ t('exam.headline') }} <span class="text-accent">{{ t('exam.headlineAccent') }}</span>
        </h1>
        <p class="mt-4 max-w-md text-muted-foreground">{{ t('exam.subtitle') }}</p>

        <div class="mt-10 flex items-center gap-4">
          <span class="flex size-14 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-black/5">
            <Icon name="lucide:timer" class="size-7" />
          </span>
          <div>
            <div class="font-display font-semibold text-foreground">{{ t('exam.durationLabel') }}</div>
            <div class="text-muted-foreground">{{ t('exam.durationValue') }}</div>
          </div>
        </div>
      </div>

      <!-- Login card -->
      <div class="rounded-[1.25rem] bg-secondary p-6 ring-1 ring-black/5 sm:p-8">
        <p class="text-sm text-muted-foreground">{{ t('exam.prompt') }}</p>
        <form class="mt-5 space-y-3" @submit.prevent="submit">
          <input
            v-model="registryNo"
            type="text"
            :placeholder="t('exam.registryNo')"
            required
            class="w-full rounded-[var(--radius-sm)] border border-input bg-white px-3 py-2.5 outline-none transition-colors focus:border-primary"
          >
          <PasswordInput v-model="password" :placeholder="t('exam.password')" required />
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <AppButton type="submit" :disabled="pending" block size="lg" class="!mt-4">
            {{ t('nav.login') }}
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>
