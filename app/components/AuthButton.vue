<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const { t } = useI18n()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
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
      class="text-muted transition-colors hover:text-ink"
      @click="logout"
    >
      {{ t('nav.logout') }}
    </button>
  </div>

  <!-- Logged out: full-page nav to the server OAuth route -->
  <a
    v-else
    href="/auth/google"
    class="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
  >
    {{ t('nav.login') }}
  </a>
</template>
