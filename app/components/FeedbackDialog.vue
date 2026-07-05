<script setup lang="ts">
// Feedback popup (Figma 464:10744 form / 464:10952 success state). Opened by
// clicking the Spline card scene in HomeContactCta. Posts to /api/contact and
// swaps the form for the quill success illustration in the same dialog.
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const { t } = useI18n()
const uid = useId()

const TYPES = ['cooperation', 'business', 'marketing', 'suggestion', 'complaint', 'other'] as const

const blank = { name: '', phone: '', email: '', type: '', message: '' }
const form = reactive({ ...blank })
const pending = ref(false)
const done = ref(false)
const leaving = ref(false) // form playing its exit before the success swap
const serverError = ref('')
const formRef = ref<HTMLFormElement | null>(null)
// Success state inherits the form's measured height so the card doesn't jump.
const successMinH = ref(0)
let swapTimer: ReturnType<typeof setTimeout> | null = null

const SWAP_DUR = 150 // keep in sync with .feedback-leave transition

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s().-]{8,20}$/

// Figma keeps the submit at 50% opacity until the form is complete — the
// disabled state doubles as validation, so no inline error plumbing.
const valid = computed(() =>
  form.name.trim() !== ''
  && phoneRe.test(form.phone.trim())
  && emailRe.test(form.email.trim())
  && form.type !== ''
  && form.message.trim() !== '',
)

async function submit() {
  if (!valid.value || pending.value) return
  serverError.value = ''
  pending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { name: form.name, email: form.email, phone: form.phone, type: form.type, message: form.message },
    })
    // Fade the form out (150ms), then mount the success state, which plays
    // its own keyframe enter.
    successMinH.value = formRef.value?.offsetHeight ?? 0
    leaving.value = true
    swapTimer = setTimeout(() => {
      leaving.value = false
      done.value = true
    }, SWAP_DUR)
  }
  catch {
    serverError.value = t('feedback.error')
  }
  finally {
    pending.value = false
  }
}

// Fresh form on the next open after a successful submission.
watch(() => props.open, (isOpen) => {
  if (isOpen && done.value) {
    done.value = false
    serverError.value = ''
    Object.assign(form, blank)
  }
})

onBeforeUnmount(() => {
  if (swapTimer) clearTimeout(swapTimer)
})

const fieldClass
  = 'h-10 w-full rounded-[12px] bg-[rgba(0,0,0,0.03)] px-4 text-sm font-light text-foreground outline-none placeholder:text-foreground/40 focus:ring-1 focus:ring-accent/40'
</script>

<template>
  <AppDialog
    :open="open"
    max-width="640px"
    :label-close="t('feedback.close')"
    @update:open="emit('update:open', $event)"
  >
    <!-- Success state -->
    <div
      v-if="done"
      class="feedback-enter flex min-h-[420px] flex-col items-center justify-center text-center"
      :style="successMinH ? { minHeight: `${successMinH}px` } : undefined"
    >
      <img
        src="/images/home/feedback-success.png"
        alt=""
        width="403"
        height="366"
        class="w-[202px]"
      >
      <p class="mt-8 font-display text-[28px] font-semibold leading-none text-teal sm:text-[32px]">
        {{ t('feedback.success.title') }}
      </p>
      <p class="mt-5 text-sm font-extralight tracking-[0.01em] text-black/60">
        {{ t('feedback.success.body') }}
      </p>
    </div>

    <!-- Form state -->
    <form
      v-else
      ref="formRef"
      novalidate
      class="feedback-swap flex flex-col gap-6"
      :class="{ 'feedback-leave': leaving }"
      @submit.prevent="submit"
    >
      <div class="flex flex-col gap-1 pr-12">
        <h2 class="font-display text-base font-light text-[#5756e1]">{{ t('feedback.title') }}</h2>
        <p class="text-sm font-extralight tracking-[0.01em] text-black/60">{{ t('feedback.subtitle') }}</p>
      </div>

      <div class="flex flex-col gap-3">
        <div class="grid gap-3 sm:grid-cols-2 sm:gap-6">
          <div class="flex flex-col gap-2">
            <label :for="`${uid}-name`" class="text-sm text-foreground">{{ t('feedback.name') }}</label>
            <input :id="`${uid}-name`" v-model="form.name" type="text" name="name" placeholder="-" :class="fieldClass">
          </div>
          <div class="flex flex-col gap-2">
            <label :for="`${uid}-phone`" class="text-sm text-foreground">{{ t('feedback.phone') }}</label>
            <input :id="`${uid}-phone`" v-model="form.phone" type="tel" name="phone" placeholder="-" :class="fieldClass">
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 sm:gap-6">
          <div class="flex flex-col gap-2">
            <label :for="`${uid}-email`" class="text-sm text-foreground">{{ t('feedback.email') }}</label>
            <input :id="`${uid}-email`" v-model="form.email" type="email" name="email" placeholder="-" :class="fieldClass">
          </div>
          <div class="flex flex-col gap-2">
            <label :for="`${uid}-type`" class="text-sm text-foreground">{{ t('feedback.type') }}</label>
            <div class="relative">
              <select
                :id="`${uid}-type`"
                v-model="form.type"
                class="h-10 w-full appearance-none rounded-[12px] bg-white px-4 pr-10 text-sm font-light shadow-[0_0_5px_rgba(0,0,0,0.1)] outline-none focus:ring-1 focus:ring-accent/40"
                :class="form.type === '' ? 'text-foreground/60' : 'text-foreground'"
              >
                <option value="" disabled>{{ t('feedback.typePlaceholder') }}</option>
                <option v-for="k in TYPES" :key="k" :value="k">{{ t(`feedback.types.${k}`) }}</option>
              </select>
              <Icon name="lucide:chevron-down" class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-teal" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label :for="`${uid}-message`" class="text-sm text-foreground">{{ t('feedback.message') }}</label>
          <textarea
            :id="`${uid}-message`"
            v-model="form.message"
            name="message"
            :placeholder="t('feedback.messagePlaceholder')"
            class="h-[120px] w-full resize-none rounded-[12px] bg-[rgba(0,0,0,0.03)] p-4 text-sm font-light text-foreground outline-none placeholder:text-foreground/40 focus:ring-1 focus:ring-accent/40"
          />
        </div>

        <p v-if="serverError" role="alert" class="text-sm text-red-600">{{ serverError }}</p>

        <button
          type="submit"
          :disabled="!valid || pending"
          class="flex h-10 w-full items-center justify-center rounded-[24px] bg-accent font-display text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {{ pending ? t('feedback.submitting') : t('feedback.submit') }}
        </button>
      </div>
    </form>
  </AppDialog>
</template>

<style scoped>
/* Form → success swap. The form eases out via transition (removed by a JS
   timer, so frozen-rAF renderers still swap); the success state enters via
   @keyframes so it plays on mount, like .mega-pop / the old modal enter. */
.feedback-swap {
  transition:
    opacity 150ms var(--modal-ease),
    transform 150ms var(--modal-ease);
}
.feedback-leave {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
@keyframes feedback-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.feedback-enter {
  animation: feedback-in 300ms var(--modal-ease) both;
}
@media (prefers-reduced-motion: reduce) {
  .feedback-swap {
    transition: none;
  }
  .feedback-enter {
    animation: none;
  }
}
</style>
