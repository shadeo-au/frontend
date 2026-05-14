<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  SOURCES,
  TIER_LABEL,
  GROUP_LABELS,
  evaluateMedicationRisk,
  type MedicationSource,
  type MedicationTier,
} from '@/lib/selfcheck/medication-data';

const props = defineProps<{
  selectedIds: string[];
}>();

const result = computed(() => evaluateMedicationRisk(props.selectedIds));

const tierTone = computed<'sage' | 'sun' | 'peach' | 'cream'>(() => {
  const t = result.value.highestTier;
  if (t === 'A') return 'peach';
  if (t === 'B') return 'sun';
  if (t === 'C') return 'sage';
  return 'cream';
});

const tierBlurb = computed(() => {
  const t = result.value.highestTier;
  switch (t) {
    case 'A':
      return 'Some of your medicines make hot days harder for the body. Bring this list to your pharmacist before the next hot week, and follow the simple tips below.';
    case 'B':
      return 'Some of your medicines add small extra risk on hot days — from losing fluids, low salt, or feeling drowsy. Keep water close and follow the simple tips below.';
    case 'C':
      return 'These medicines do not add known heat-day risk. The usual hot-day rules still apply — drink water, stay cool, rest more.';
    default:
      return 'Tick the medicines you take above. We will show what each one means on hot days and what to do, with the research behind it.';
  }
});

const showSourceModal = ref(false);
const sourceModalEntries = ref<MedicationSource[]>([]);
const sourceModalTitle = ref('');

function openSources(title: string, ids: string[]) {
  sourceModalTitle.value = title;
  sourceModalEntries.value = ids.map((id) => SOURCES[id]).filter(Boolean);
  showSourceModal.value = true;
}
function closeSources() {
  showSourceModal.value = false;
}
</script>

<template>
  <div class="mrp">
    <div :class="['mrp-banner', `mrp-banner--${tierTone}`]">
      <div class="mrp-banner-row">
        <div class="mrp-banner-text">
          <small>Your result</small>
          <strong v-if="result.highestTier">{{ TIER_LABEL[result.highestTier as MedicationTier] }}</strong>
          <strong v-else>No medicines ticked yet</strong>
        </div>
        <div v-if="result.highestTier" class="mrp-banner-badge">{{ result.highestTier }}</div>
      </div>
      <p class="mrp-banner-blurb">{{ tierBlurb }}</p>
    </div>

    <!-- Combination rules go first -->
    <ul v-if="result.firedRules.length" class="mrp-rules">
      <li v-for="rule in result.firedRules" :key="rule.id" class="mrp-rule">
        <div class="mrp-rule-head">
          <span class="mrp-rule-tag">Combined risk</span>
          <strong>{{ rule.label }}</strong>
        </div>
        <p class="mrp-text">{{ rule.message }}</p>
        <div class="mrp-tip">
          <span class="mrp-tip-label">What to do</span>
          <p>{{ rule.tip }}</p>
        </div>
        <button
          type="button"
          class="mrp-source-btn"
          @click="openSources(rule.label, rule.sources)"
        >View source ({{ rule.sources.length }})</button>
      </li>
    </ul>

    <!-- Selected medications -->
    <ul v-if="result.selected.length" class="mrp-meds">
      <li v-for="m in result.selected" :key="m.id" :class="['mrp-med', `mrp-med--tier-${m.tier}`]">
        <div class="mrp-med-head">
          <strong>{{ m.generic }}</strong>
          <span class="mrp-med-tier">{{ TIER_LABEL[m.tier] }}</span>
        </div>
        <small class="mrp-med-group">{{ GROUP_LABELS[m.group] }}</small>
        <p class="mrp-text">{{ m.note }}</p>
        <div class="mrp-tip">
          <span class="mrp-tip-label">What to do</span>
          <p>{{ m.tip }}</p>
        </div>
        <button
          type="button"
          class="mrp-source-btn"
          @click="openSources(m.generic, m.sources)"
        >View source ({{ m.sources.length }})</button>
      </li>
    </ul>

    <!-- Sources modal -->
    <div v-if="showSourceModal" class="mrp-modal" role="dialog" aria-modal="true" @click.self="closeSources">
      <div class="mrp-modal-card">
        <header class="mrp-modal-head">
          <div>
            <small>Sources for</small>
            <strong>{{ sourceModalTitle }}</strong>
          </div>
          <button class="mrp-modal-close" aria-label="Close" @click="closeSources">×</button>
        </header>
        <ol class="mrp-modal-list">
          <li v-for="s in sourceModalEntries" :key="s.id">
            <strong>{{ s.id }}.</strong>
            <span>{{ s.citation }}</span>
            <a :href="s.url" target="_blank" rel="noopener">Open ↗</a>
          </li>
        </ol>
        <p class="mrp-modal-note">
          You can read the full evidence summary in our research notes.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mrp { display: flex; flex-direction: column; gap: 16px; }

.mrp-banner {
  padding: 22px 24px;
  border-radius: 24px;
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
}
.mrp-banner--cream { background: var(--canvas-warm); }
.mrp-banner--sage { background: var(--shade-mist); border-color: rgba(91, 140, 97, 0.18); }
.mrp-banner--sun { background: var(--sun-soft); border-color: rgba(232, 165, 58, 0.32); }
.mrp-banner--peach { background: var(--peach-soft); border-color: rgba(184, 58, 44, 0.32); }

.mrp-banner-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}
.mrp-banner-text small {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.mrp-banner-text strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.4rem;
  font-weight: 950;
  line-height: 1.2;
}
.mrp-banner-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.4rem;
  font-weight: 950;
}
.mrp-banner--peach .mrp-banner-badge { color: #b83a2c; }
.mrp-banner--sun .mrp-banner-badge { color: #8b5e1a; }
.mrp-banner-blurb {
  margin: 12px 0 0;
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.mrp-rules, .mrp-meds {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mrp-rule {
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(160deg, var(--peach-soft), rgba(255, 255, 255, 0.96));
  border: 1.5px solid rgba(184, 58, 44, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mrp-rule-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mrp-rule-tag {
  background: #b83a2c;
  color: white;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
}
.mrp-rule strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 900;
}
.mrp-rule p {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
}

.mrp-med {
  padding: 14px 16px;
  background: var(--surface);
  border: 1.5px solid var(--brand-line);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mrp-med--tier-A { border-left: 6px solid #b83a2c; }
.mrp-med--tier-B { border-left: 6px solid var(--brand-gold); }
.mrp-med--tier-C { border-left: 6px solid var(--brand-sage); }

.mrp-med-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mrp-med-head strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 900;
}
.mrp-med-tier {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--brand-ink-muted);
}
.mrp-med-group {
  color: var(--brand-ink-muted);
  font-size: 0.88rem;
  font-weight: 700;
}
.mrp-med p {
  color: var(--brand-ink-soft);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}

.mrp-text {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.55;
  margin: 0;
}

.mrp-tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px 14px;
  border-radius: 14px;
  background: var(--brand-lime-soft);
  border: 1px solid rgba(98, 133, 107, 0.30);
  border-left: 4px solid var(--brand-sage);
}
.mrp-tip-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--shade-deep);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mrp-tip-label::before {
  content: '✓';
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand-sage);
  color: var(--brand-paper-white);
  font-size: 0.7rem;
  font-weight: 900;
}
.mrp-tip p {
  color: var(--brand-ink-soft);
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
}

.mrp-source-btn {
  align-self: flex-start;
  padding: 6px 12px;
  background: transparent;
  border: 1.5px solid var(--brand-line);
  border-radius: 999px;
  color: var(--shade-deep);
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
}
.mrp-source-btn:hover { background: var(--brand-lime-soft); border-color: var(--brand-sage); }

/* Modal */
.mrp-modal {
  position: fixed;
  inset: 0;
  background: rgba(16, 19, 15, 0.45);
  display: grid;
  place-items: center;
  padding: var(--gutter);
  z-index: var(--z-modal);
}
.mrp-modal-card {
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-clay-lg);
  max-width: 720px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mrp-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.mrp-modal-head small {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mrp-modal-head strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 950;
}
.mrp-modal-close {
  background: transparent;
  border: 0;
  font-size: 1.8rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--brand-ink-muted);
}
.mrp-modal-close:hover { background: rgba(35, 45, 39, 0.06); }
.mrp-modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mrp-modal-list li {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: start;
  color: var(--brand-ink-soft);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.5;
}
.mrp-modal-list strong { color: var(--brand-ink); font-weight: 900; }
.mrp-modal-list a {
  color: var(--shade-deep);
  font-weight: 800;
  white-space: nowrap;
  text-decoration: underline;
}
.mrp-modal-note {
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 700;
  font-style: italic;
  margin: 0;
}
</style>
