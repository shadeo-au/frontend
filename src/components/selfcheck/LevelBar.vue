<script setup lang="ts">
import type { Level3 } from '@/lib/selfcheck/types';

withDefaults(
  defineProps<{
    level: Level3;
    invert?: boolean;
  }>(),
  { invert: false }
);

const ORDER: Level3[] = ['Low', 'Moderate', 'High'];
</script>

<template>
  <div class="level-bar" :data-level="level" :data-invert="invert">
    <span
      v-for="step in ORDER"
      :key="step"
      :class="['level-bar__seg', { 'is-on': ORDER.indexOf(step) <= ORDER.indexOf(level) }]"
    />
    <span class="level-bar__label">{{ level }}</span>
  </div>
</template>

<style scoped>
.level-bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.level-bar__seg {
  display: block;
  width: 22px;
  height: 8px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.10);
  transition: background var(--d-fast) ease;
}
.level-bar__label {
  margin-left: 6px;
  color: var(--brand-ink-soft);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

/* Tone by level — for "exposure" indicators (higher = warmer/worse) */
.level-bar[data-invert='false'][data-level='Low']      .level-bar__seg.is-on:nth-child(1) { background: var(--brand-lime); }
.level-bar[data-invert='false'][data-level='Moderate'] .level-bar__seg.is-on:nth-child(-n+2) { background: var(--brand-gold); }
.level-bar[data-invert='false'][data-level='High']     .level-bar__seg.is-on { background: #d77252; }

/* For "good things" (canopy, cool place access) — flip so High = green */
.level-bar[data-invert='true'][data-level='Low']      .level-bar__seg.is-on { background: #d77252; }
.level-bar[data-invert='true'][data-level='Moderate'] .level-bar__seg.is-on { background: var(--brand-gold); }
.level-bar[data-invert='true'][data-level='High']     .level-bar__seg.is-on { background: var(--brand-lime); }
</style>
