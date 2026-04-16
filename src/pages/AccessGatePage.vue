<template>
  <main class="site-gate-shell">
    <section class="site-gate-card" role="dialog" aria-modal="true" aria-labelledby="site-gate-title">
      <p class="site-gate-kicker">Restricted Access</p>
      <h1 id="site-gate-title">Welcome to GreenPath.</h1>
      <p class="site-gate-copy">Enter the site password to continue.</p>

      <form class="site-gate-form" @submit.prevent="unlockSite">
        <label class="site-gate-label" for="site-password">Password</label>
        <input
          id="site-password"
          v-model="sitePasswordInput"
          class="site-gate-input"
          type="password"
          autocomplete="current-password"
          placeholder="Enter password"
        />
        <p v-if="accessError" class="site-gate-error">{{ accessError }}</p>
        <button class="btn btn-primary site-gate-button" type="submit" :disabled="isUnlocking">
          {{ isUnlocking ? 'Checking…' : 'Unlock Site' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const DEFAULT_SITE_PASSWORD_HASH = '348a1f0bf99cad5a994150e7ba43d109a1b9a3ee8d442950570519bacfd0f934'
const ACCESS_STORAGE_KEY = 'greenpath-site-access'

const configuredSitePasswordHash = (import.meta.env.VITE_SITE_PASSWORD_HASH || DEFAULT_SITE_PASSWORD_HASH).trim().toLowerCase()

const router = useRouter()
const route = useRoute()
const sitePasswordInput = ref('')
const accessError = ref('')
const isUnlocking = ref(false)

const sha256 = async (value) => {
  const encoded = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

const unlockSite = async () => {
  if (!configuredSitePasswordHash) {
    router.replace('/')
    return
  }

  accessError.value = ''
  isUnlocking.value = true

  try {
    const inputHash = await sha256(sitePasswordInput.value)
    if (inputHash === configuredSitePasswordHash) {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, configuredSitePasswordHash)
      const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      router.replace(redirectTarget)
      return
    }
    accessError.value = 'Incorrect password.'
  } catch {
    accessError.value = 'Password check is unavailable in this browser.'
  } finally {
    isUnlocking.value = false
  }
}
</script>

<style scoped>
.site-gate-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background:
    radial-gradient(circle at top, rgba(122, 181, 125, 0.22), transparent 32%),
    linear-gradient(180deg, #f2f7f0 0%, #e6efe2 100%);
}

.site-gate-card {
  width: min(520px, 100%);
  padding: 2rem;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 70px rgba(16, 33, 22, 0.14);
  border: 1px solid rgba(49, 88, 58, 0.12);
}

.site-gate-kicker {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 800;
  color: #4f7e59;
}

.site-gate-card h1 {
  margin: 0;
  font-size: clamp(1.9rem, 5vw, 2.6rem);
  line-height: 1.08;
  color: #11291a;
}

.site-gate-copy {
  margin: 1rem 0 0;
  color: #446153;
}

.site-gate-form {
  display: grid;
  gap: 0.8rem;
  margin-top: 1.4rem;
}

.site-gate-label {
  font-weight: 700;
  color: #1f3a28;
}

.site-gate-input {
  width: 100%;
  min-height: 3.35rem;
  border-radius: 16px;
  border: 1px solid #c9d8ca;
  padding: 0.85rem 1rem;
  font: inherit;
  color: #102116;
  background: #fff;
}

.site-gate-input:focus {
  outline: 2px solid rgba(46, 123, 69, 0.24);
  border-color: #2e7b45;
}

.site-gate-error {
  margin: 0;
  color: #a43535;
  font-weight: 700;
}

.site-gate-button {
  width: 100%;
}
</style>