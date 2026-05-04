<script setup lang="ts">
import { ref } from 'vue';
import { CATEGORY_LABEL, type ActionCard } from '@/lib/selfcheck/today-actions';

defineProps<{ actions: ActionCard[] }>();

const checked = ref(new Set<string>());
const expanded = ref(new Set<string>());

function toggle(id: string) {
  const next = new Set(checked.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  checked.value = next;
}

function toggleWhy(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}
</script>

<template>
  <ul class="actions">
    <li
      v-for="(card, i) in actions"
      :key="card.id"
      :class="['action', { 'is-pinned': card.pinned, 'is-checked': checked.has(card.id) }]"
    >
      <button
        type="button"
        class="action__check"
        :aria-pressed="checked.has(card.id)"
        :aria-label="checked.has(card.id) ? 'Mark as not done' : 'Mark as done for today'"
        @click="toggle(card.id)"
      >
        <span></span>
      </button>
      <div class="action__body">
        <div class="action__head">
          <span class="action__rank">{{ card.pinned ? '!' : i + (actions.findIndex(a => !a.pinned) >= 0 ? 1 : 0) }}</span>
          <small>{{ card.pinned ? 'Priority' : CATEGORY_LABEL[card.category] }}</small>
        </div>
        <strong class="action__title">{{ card.title }}</strong>
        <p class="action__text">{{ card.body }}</p>
        <button
          v-if="card.why"
          type="button"
          class="action__why-toggle"
          @click="toggleWhy(card.id)"
        >
          {{ expanded.has(card.id) ? 'Hide reason' : 'Why this for me?' }}
        </button>
        <p v-if="card.why && expanded.has(card.id)" class="action__why">{{ card.why }}</p>
      </div>
    </li>
  </ul>

  <p v-if="!actions.length" class="actions__empty">
    No specific actions for today's conditions and your profile. Keep an eye on weather alerts and stay connected.
  </p>
</template>

<style scoped>
.actions {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
  transition: opacity var(--d-fast) ease;
}
.action.is-pinned {
  background: linear-gradient(165deg, var(--peach-soft), rgba(255, 255, 255, 0.96));
  border-color: rgba(192, 90, 55, 0.35);
}
.action.is-checked { opacity: 0.55; }

.action__check {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--brand-paper);
  border: 2px solid rgba(35, 45, 39, 0.18);
  display: grid;
  place-items: center;
  cursor: pointer;
  align-self: flex-start;
  margin-top: 4px;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.action__check span {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: transparent;
  transition: background var(--d-fast) ease;
}
.action.is-checked .action__check {
  background: var(--brand-lime-soft);
  border-color: var(--brand-sage);
}
.action.is-checked .action__check span {
  background: var(--brand-sage);
}

.action__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.action__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.action__rank {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--brand-ink-soft);
  color: var(--brand-paper-white);
  font-weight: 900;
  font-size: 0.95rem;
}
.action.is-pinned .action__rank {
  background: #b83a2c;
}
.action__head small {
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.action__title {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.25;
  text-wrap: balance;
}
.action__text {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.55;
}

.action__why-toggle {
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: var(--shade-deep);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  padding: 6px 0;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}
.action__why {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--shade-mist);
  color: var(--brand-ink-soft);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.5;
}

.actions__empty {
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.55;
  border: 1px dashed var(--brand-line);
}
</style>
