<script setup lang="ts">
import { ref, onMounted } from 'vue';

const SESSION_KEY = 'shadeo_gate_unlocked_v1';
const EXPECTED = (import.meta.env.VITE_GATE_HASH ?? '').toLowerCase();

const emit = defineEmits<{ (e: 'unlock'): void }>();

const password = ref('');
const error = ref('');
const busy = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
});

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function submit() {
  if (busy.value) return;
  error.value = '';

  if (!EXPECTED) {
    error.value = 'Access is not configured. Set VITE_GATE_HASH in .env.local.';
    return;
  }

  busy.value = true;
  try {
    const hash = await sha256Hex(password.value.trim());
    if (hash === EXPECTED) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* sessionStorage unavailable 鈥?still unlock for this view */
      }
      emit('unlock');
    } else {
      error.value = 'Incorrect password. Please try again.';
      password.value = '';
      inputRef.value?.focus();
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="gate">
    <div class="gate__art" aria-hidden="true">
      <span class="gate__sun"></span>
      <span class="gate__leaf gate__leaf--a"></span>
      <span class="gate__leaf gate__leaf--b"></span>
    </div>

    <main class="gate__panel" role="main">
      <span class="gate__brand">Shadeo</span>
      <h1 class="gate__title">Welcome.</h1>
      <p class="gate__lede">
        This is a private preview for our team and reviewers. Please enter the access
        password to continue.
      </p>

      <form class="gate__form" @submit.prevent="submit" novalidate>
        <label class="gate__field">
          <span class="gate__field-label">Access password</span>
          <input
            ref="inputRef"
            v-model="password"
            type="password"
            autocomplete="current-password"
            spellcheck="false"
            class="gate__input"
            :aria-invalid="error ? 'true' : 'false'"
            aria-describedby="gate-error"
          />
        </label>

        <p id="gate-error" class="gate__error" :class="{ 'is-visible': !!error }">
          {{ error || ' ' }}
        </p>

        <button
          type="submit"
          class="gate__submit"
          :disabled="busy || !password"
        >
          {{ busy ? 'Checking...' : 'Continue' }}
        </button>
      </form>

      <p class="gate__hint">
        Course preview - FIT5120 Industry Experience Studio Project, Monash University.
      </p>
    </main>
  </div>
</template>

<style scoped>
.gate {
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  padding: clamp(24px, 6vw, 64px);
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 22% -8%, rgba(142, 199, 210, 0.20), transparent 32%),
    radial-gradient(circle at 80% 110%, rgba(241, 178, 74, 0.18), transparent 38%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
  overflow: hidden;
}

.gate__art {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.gate__sun {
  position: absolute;
  width: 320px;
  height: 320px;
  top: -120px;
  right: -80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(241, 178, 74, 0.42), transparent 70%);
  filter: blur(2px);
}
.gate__leaf {
  position: absolute;
  border-radius: 50% 12% 50% 12%;
  background: var(--brand-lime-soft);
  border: 1px solid rgba(91, 140, 97, 0.18);
}
.gate__leaf--a {
  width: 220px;
  height: 220px;
  bottom: -60px;
  left: -90px;
  transform: rotate(28deg);
}
.gate__leaf--b {
  width: 140px;
  height: 140px;
  top: 18%;
  left: 8%;
  transform: rotate(-12deg);
  background: var(--shade-mist);
}

.gate__panel {
  position: relative;
  z-index: 1;
  width: min(100%, 460px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: clamp(28px, 4vw, 44px);
  border-radius: 28px;
  background: rgba(255, 250, 242, 0.92);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--brand-shadow-panel);
  backdrop-filter: blur(10px);
}

.gate__brand {
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--brand-teal);
}

.gate__title {
  font-family: var(--font-body);
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0;
  color: var(--brand-ink);
}

.gate__lede {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.55;
}

.gate__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.gate__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gate__field-label {
  color: var(--brand-ink-soft);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.gate__input {
  min-height: 56px;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1.5px solid var(--brand-line);
  background: rgba(255, 255, 255, 0.96);
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-ink);
  letter-spacing: 0.04em;
  transition: border-color var(--d-fast) ease, box-shadow var(--d-fast) ease;
  outline: 0;
}
.gate__input:focus-visible {
  border-color: var(--brand-teal);
  box-shadow: inset 0 0 0 2px rgba(13, 111, 114, 0.34);
}

.gate__error {
  min-height: 22px;
  margin: 4px 0 6px;
  color: #8b3f25;
  font-size: 0.95rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity var(--d-fast) ease;
}
.gate__error.is-visible { opacity: 1; }

.gate__submit {
  min-height: 56px;
  padding: 0 24px;
  border-radius: 28px;
  background: var(--brand-teal);
  color: #fff;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 900;
  letter-spacing: 0;
  cursor: pointer;
  border: 0;
  transition: background var(--d-fast) ease, transform var(--d-fast) ease;
}
.gate__submit:hover:not(:disabled) {
  background: #095f62;
}
.gate__submit:active:not(:disabled) { transform: scale(0.99); }
.gate__submit:disabled { opacity: 0.55; cursor: not-allowed; }

.gate__hint {
  margin-top: 6px;
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
}
</style>
