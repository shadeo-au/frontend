<script setup lang="ts">
export type SelfCheckMode = 'wizard' | 'planner';

defineProps<{
  mode: SelfCheckMode;
}>();

const emit = defineEmits<{
  (e: 'update:mode', v: SelfCheckMode): void;
}>();

const OPTIONS: Array<{ value: SelfCheckMode; label: string; help: string }> = [
  { value: 'wizard',  label: '3-min self-check', help: 'Answer four short groups of questions' },
  { value: 'planner', label: 'Home heat planner', help: 'Sketch your rooms and windows for room-by-room tips' },
];
</script>

<template>
  <div class="ms" role="tablist" aria-label="Self-check mode">
    <button
      v-for="o in OPTIONS"
      :key="o.value"
      type="button"
      role="tab"
      :aria-selected="mode === o.value"
      :class="['ms-tab', { 'is-active': mode === o.value }]"
      @click="emit('update:mode', o.value)"
    >
      <strong>{{ o.label }}</strong>
      <small>{{ o.help }}</small>
    </button>
  </div>
</template>

<style scoped>
.ms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 8px;
  border-radius: 28px;
  background: rgba(35, 45, 39, 0.05);
  border: 1.5px solid var(--brand-line);
  width: 100%;
  max-width: 600px;
}
.ms-tab {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 12px 18px;
  border-radius: 22px;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--brand-ink-muted);
  transition: background var(--d-fast) ease, color var(--d-fast) ease, box-shadow var(--d-fast) ease;
}
.ms-tab strong {
  color: inherit;
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 900;
}
.ms-tab small {
  color: inherit;
  opacity: 0.8;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
}
.ms-tab:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--brand-ink-soft);
}
.ms-tab.is-active {
  background: var(--surface);
  color: var(--brand-ink);
  box-shadow: var(--sh-clay-sm);
}
.ms-tab.is-active strong { color: var(--brand-ink); }
.ms-tab.is-active small { color: var(--brand-ink-muted); opacity: 1; }

@media (max-width: 540px) {
  .ms { grid-template-columns: 1fr; }
}
</style>
