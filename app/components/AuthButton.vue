<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const { signInWithGoogle, logout } = useFirebaseAuth()
const { t } = useI18n()

const pending = ref(false)

async function login() {
  pending.value = true
  try {
    await signInWithGoogle()
  }
  catch (e) {
    // Popup closed/blocked or network error — surface quietly for now.
    console.error('Sign-in failed:', e)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <!-- Logged in: avatar + logout -->
  <div v-if="loggedIn" class="flex items-center gap-3 text-sm">
    <img
      v-if="user?.avatar"
      :src="user.avatar"
      :alt="user?.name"
      class="size-7 rounded-full"
      referrerpolicy="no-referrer"
    >
    <button
      type="button"
      class="text-muted-foreground transition-colors hover:text-foreground"
      @click="logout"
    >
      {{ t('nav.logout') }}
    </button>
  </div>

  <!-- Logged out: trigger Firebase sign-in -->
  <button
    v-else
    type="button"
    :disabled="pending"
    class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    @click="login"
  >
    {{ t('nav.login') }}
  </button>
</template>
