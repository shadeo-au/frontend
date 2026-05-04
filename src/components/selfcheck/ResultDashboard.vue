<script setup lang="ts">
import { computed } from 'vue';
import ClayCard from '@/components/ClayCard.vue';
import AppButton from '@/components/AppButton.vue';
import ScoreBars from './ScoreBars.vue';
import TodayActionList from './TodayActionList.vue';
import type {
  AreaProfile,
  HeatSnapshot,
  ScoreResult,
  SelfCheckAnswers,
  SuburbIndexEntry,
} from '@/lib/selfcheck/types';
import { riskLevelCopy } from '@/lib/selfcheck/scoring';
import { pickTodayActions } from '@/lib/selfcheck/today-actions';

const props = defineProps<{
  result: ScoreResult;
  area: AreaProfile | null;
  suburb: SuburbIndexEntry | null;
  snapshot: HeatSnapshot | null;
  answers: SelfCheckAnswers;
}>();

defineEmits<{ (e: 'restart'): void }>();

const copy = computed(() => riskLevelCopy(props.result.riskLevel));

const actions = computed(() => {
  if (!props.snapshot) return [];
  return pickTodayActions(props.snapshot, props.area, props.answers, props.result);
});

const riskTone = computed<'sage' | 'sun' | 'peach'>(() => {
  if (props.result.riskLevel === 'Lower') return 'sage';
  if (props.result.riskLevel === 'Moderate') return 'sun';
  return 'peach';
});

function printPage() {
  window.print();
}
</script>

<template>
  <div class="result">
    <ClayCard :tone="riskTone" radius="2xl" class="result__hero">
      <div class="result__hero-row">
        <div>
          <span class="result__kicker">Your result</span>
          <h2 class="result__title">{{ copy.title }}</h2>
          <p class="result__lede">{{ copy.body }}</p>
        </div>
        <div class="result__hero-score">
          <strong>{{ result.totalScore }}</strong>
          <small>out of 20</small>
        </div>
      </div>
      <p class="result__disclaimer">
        This result is for awareness and preparation only. It does not replace medical advice.
        If you feel unwell during hot weather, contact a health professional or call 000.
      </p>
    </ClayCard>

    <ClayCard tone="white" radius="xl" class="result__panel">
      <div class="result__panel-head">
        <h3>How your four dimensions add up</h3>
        <p>Each dimension can score from 0 to 5. Higher scores point to factors worth planning around.</p>
      </div>
      <ScoreBars :result="result" />
    </ClayCard>

    <ClayCard tone="cream" radius="xl" class="result__panel result__today">
      <div class="result__panel-head">
        <span class="result__panel-kicker">Today's plan</span>
        <h3>What today's heat means for you</h3>
        <p v-if="snapshot && suburb">
          Forecast peak <strong>{{ snapshot.max_today != null ? Math.round(snapshot.max_today) : '–' }}°C</strong>
          in {{ suburb.name }} matched against your profile.
        </p>
        <p v-else>Live forecast unavailable — these suggestions use your profile only.</p>
      </div>
      <TodayActionList :actions="actions" />
    </ClayCard>

    <ClayCard tone="white" radius="xl" class="result__panel">
      <div class="result__panel-head">
        <span class="result__panel-kicker">Why your score</span>
        <h3>The factors behind your result</h3>
        <p>Plain-language explanations for the answers that pushed your score upward.</p>
      </div>
      <ul v-if="result.contributors.length" class="contributors">
        <li v-for="c in result.contributors" :key="c.id">
          <strong>{{ c.label }}</strong>
          <p>{{ c.explanation }}</p>
        </li>
      </ul>
      <p v-else class="result__empty">
        No specific risk contributors stood out — your answers suggest a generally well-prepared profile.
      </p>
    </ClayCard>

    <ClayCard tone="sage" radius="xl" class="result__nextsteps">
      <h3>Take it with you</h3>
      <p>You don't need to fix everything at once. Start with one small action — maybe choosing a cool place nearby, or a check-in person.</p>
      <div class="result__actions">
        <AppButton variant="primary" @click="printPage">Save or print my plan</AppButton>
        <AppButton variant="secondary" @click="$emit('restart')">Retake the self-check</AppButton>
      </div>
    </ClayCard>
  </div>
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.result__hero { background: var(--surface); }

.result__hero-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  align-items: center;
}

.result__kicker {
  display: inline-block;
  margin-bottom: 8px;
  color: #1d371f;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result__title {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2rem, 3.6vw, 3rem);
  font-weight: 950;
  line-height: 1.1;
  letter-spacing: 0;
  margin-bottom: 10px;
  text-wrap: balance;
}

.result__lede {
  color: var(--brand-ink-muted);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.55;
  max-width: 60ch;
}

.result__hero-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 18px 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--brand-line);
}
.result__hero-score strong {
  font-family: var(--font-body);
  font-size: clamp(2.6rem, 5vw, 4rem);
  font-weight: 950;
  color: var(--brand-ink);
  line-height: 1;
}
.result__hero-score small {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.result__disclaimer {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed rgba(35, 45, 39, 0.18);
  color: var(--brand-ink-soft);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.5;
}

.result__panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result__panel-head h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 950;
  line-height: 1.15;
  letter-spacing: 0;
  margin-bottom: 6px;
}
.result__panel-head p {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.5;
}
.result__panel-kicker {
  display: inline-block;
  margin-bottom: 6px;
  color: #1d371f;
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result__today { background: linear-gradient(180deg, rgba(252, 247, 235, 0.85), rgba(255, 255, 255, 0.75)); }

.contributors {
  list-style: none;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.contributors li {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(252, 247, 235, 0.6);
  border: 1px solid var(--brand-line-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.contributors strong {
  color: var(--brand-ink-soft);
  font-size: 1.0625rem;
  font-weight: 900;
  line-height: 1.25;
}
.contributors p {
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

.result__empty {
  padding: 16px 18px;
  border-radius: 16px;
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
  font-weight: 700;
  font-size: 1.0625rem;
  line-height: 1.5;
}

.result__nextsteps h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.5rem, 2.2vw, 1.95rem);
  font-weight: 950;
  margin-bottom: 6px;
  line-height: 1.15;
  letter-spacing: 0;
}
.result__nextsteps p {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 650;
  line-height: 1.5;
  margin-bottom: 14px;
}
.result__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media print {
  .result__nextsteps,
  .result__actions { display: none; }
}

@media (max-width: 640px) {
  .result__hero-row { grid-template-columns: 1fr; }
  .result__hero-score { align-items: flex-start; }
  .result__actions { flex-direction: column; }
  .result__actions :deep(.btn) { width: 100%; }
}
</style>
