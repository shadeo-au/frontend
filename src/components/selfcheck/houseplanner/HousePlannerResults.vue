<script setup lang="ts">
import { ref } from 'vue';
import type { HouseActionCard } from '@/lib/selfcheck/types';
import { HOUSE_CATEGORY_LABEL } from '@/lib/selfcheck/house-actions';

defineProps<{
  actions: HouseActionCard[];
  peakSunOrientation: string;
}>();

const expanded = ref(new Set<string>());

function toggleWhy(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}
</script>

<template>
  <div class="hpr">
    <header class="hpr-head">
      <span class="hpr-kicker">Recommendations for your home</span>
      <h3>What today's sun and heat mean for your rooms</h3>
      <p>
        Based on the windows and fans you marked, plus where the sun will sit this afternoon
        (peak direction: <strong>{{ peakSunOrientation }}</strong>).
      </p>
    </header>

    <ul v-if="actions.length" class="hpr-list">
      <li
        v-for="(card, i) in actions"
        :key="card.id"
        :class="['hpr-card', `hpr-card--${card.severity ?? 'info'}`]"
      >
        <div class="hpr-rank">{{ card.severity === 'urgent' ? '!' : i + 1 }}</div>
        <div class="hpr-body">
          <div class="hpr-meta">
            <small>{{ HOUSE_CATEGORY_LABEL[card.category] }}</small>
          </div>
          <strong>{{ card.title }}</strong>
          <p>{{ card.body }}</p>
          <button
            v-if="card.why"
            type="button"
            class="hpr-why-toggle"
            @click="toggleWhy(card.id)"
          >
            {{ expanded.has(card.id) ? 'Hide reason' : 'Why this for me?' }}
          </button>
          <p v-if="card.why && expanded.has(card.id)" class="hpr-why">{{ card.why }}</p>
        </div>
      </li>
    </ul>
    <p v-else class="hpr-empty">
      No specific actions for the conditions you marked. Keep an eye on the forecast above and check back later.
    </p>
  </div>
</template>

<style scoped>
.hpr {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.hpr-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hpr-kicker {
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.hpr-head h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.45rem;
  font-weight: 950;
  line-height: 1.2;
}
.hpr-head p {
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

.hpr-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hpr-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
}
.hpr-card--urgent {
  background: linear-gradient(160deg, var(--peach-soft), rgba(255, 255, 255, 0.96));
  border-color: rgba(192, 90, 55, 0.35);
}
.hpr-card--warn {
  background: linear-gradient(160deg, var(--sun-soft), rgba(255, 255, 255, 0.96));
  border-color: rgba(232, 165, 58, 0.32);
}

.hpr-rank {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand-ink-soft);
  color: var(--brand-paper-white);
  font-weight: 900;
  font-size: 1rem;
  display: grid;
  place-items: center;
  align-self: flex-start;
  margin-top: 2px;
}
.hpr-card--urgent .hpr-rank { background: #b83a2c; }
.hpr-card--warn .hpr-rank { background: var(--brand-gold); color: #142016; }

.hpr-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.hpr-meta small {
  color: var(--brand-ink-muted);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hpr-body strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1.25;
  text-wrap: balance;
}
.hpr-body p {
  color: var(--brand-ink-muted);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.55;
}
.hpr-why-toggle {
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: var(--shade-deep);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 0;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}
.hpr-why {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--shade-mist);
  color: var(--brand-ink-soft);
  font-size: 0.95rem !important;
  font-weight: 700 !important;
}
.hpr-empty {
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.55;
  border: 1px dashed var(--brand-line);
}
</style>
