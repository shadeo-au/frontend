<script setup lang="ts">
import { computed } from 'vue';
import type { HeatSnapshot, HeatAlertLevel, SuburbIndexEntry } from '@/lib/selfcheck/types';
import { alertLabel, uvBand } from '@/lib/selfcheck/open-meteo';
import LocationPicker from './LocationPicker.vue';

const props = defineProps<{
  suburb: SuburbIndexEntry | null;
  snapshot: HeatSnapshot | null;
  loading: boolean;
  error: string | null;
}>();

defineEmits<{
  (e: 'change-location', s: SuburbIndexEntry): void;
}>();

const alertTone = computed<'sage' | 'sun' | 'peach' | 'ink'>(() => {
  const lvl: HeatAlertLevel | undefined = props.snapshot?.alert_level;
  if (!lvl) return 'ink';
  if (lvl === 'extreme') return 'peach';
  if (lvl === 'severe') return 'sun';
  if (lvl === 'low') return 'sun';
  return 'sage';
});

const uvInfo = computed(() => uvBand(props.snapshot?.uv_max_today ?? null));

const ratingDots = computed(() => {
  const lvl = props.snapshot?.alert_level;
  if (!lvl) return 0;
  return ({ none: 1, low: 2, severe: 3, extreme: 4 } as const)[lvl];
});
</script>

<template>
  <div class="snapshot">
    <div class="snapshot__head">
      <span class="snapshot__kicker">Today in your area</span>
      <h1 class="snapshot__title">
        Heat plan, tailored to <em>{{ suburb?.name ?? 'your suburb' }}</em>
      </h1>
      <p class="snapshot__lede">
        Hot weather can affect older adults more strongly. A 3-minute self-check turns
        today's forecast into clear, personal steps.
      </p>

      <LocationPicker
        :current="suburb"
        @select="(s) => $emit('change-location', s)"
      />
    </div>

    <div class="snapshot__panel" :data-state="loading ? 'loading' : error ? 'error' : 'ready'">
      <header class="snapshot__panel-head">
        <span :class="['snapshot__alert', `snapshot__alert--${alertTone}`]">
          <span class="snapshot__alert-dots" aria-hidden="true">
            <span v-for="i in 4" :key="i" :class="{ 'is-on': i <= ratingDots }" />
          </span>
          {{ snapshot ? alertLabel(snapshot.alert_level) : 'Live forecast' }}
        </span>
        <small v-if="suburb">{{ suburb.name }}, {{ suburb.state }} {{ suburb.postcode }}</small>
      </header>

      <div v-if="loading" class="snapshot__loading">Loading forecast for your area…</div>
      <div v-else-if="error" class="snapshot__loading snapshot__loading--err">
        Couldn't load live weather. You can still continue the self-check below.
      </div>
      <div v-else-if="snapshot" class="snapshot__metrics">
        <div class="metric">
          <small>Today's max</small>
          <strong>{{ snapshot.max_today != null ? Math.round(snapshot.max_today) : '–' }}<span>°C</span></strong>
          <span class="metric__hint" v-if="snapshot.apparent_max_today != null">
            Feels like {{ Math.round(snapshot.apparent_max_today) }}°C
          </span>
        </div>
        <div class="metric metric--accent">
          <small>PEAK UV TODAY</small>
          <strong>{{ snapshot.uv_max_today != null ? Math.round(snapshot.uv_max_today) : '–' }}</strong>
          <span class="metric__hint">{{ uvInfo.label }}</span>
        </div>
        <div class="metric">
          <small>Now</small>
          <strong>{{ snapshot.current_temp != null ? Math.round(snapshot.current_temp) : '–' }}<span>°C</span></strong>
          <span class="metric__hint">Updated just now</span>
        </div>
      </div>

      <div class="snapshot__forecast" v-if="snapshot && snapshot.daily.length">
        <div v-for="(d, i) in snapshot.daily.slice(0, 5)" :key="d.date" class="forecast-day">
          <small>{{ i === 0 ? 'Today' : weekdayShort(d.date) }}</small>
          <div class="forecast-day__bar" :style="{ '--h': `${(d.max - 16) * 4}px` }">
            <span :data-hot="d.max >= 32" :data-very-hot="d.max >= 36"></span>
          </div>
          <strong>{{ Math.round(d.max) }}°</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function weekdayShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short' });
}
</script>

<style scoped>
.snapshot {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
  gap: clamp(36px, 5vw, 64px);
  align-items: center;
}

.snapshot__head {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
}
.snapshot__kicker {
  color: #1d371f;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.snapshot__title {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2.4rem, 4.5vw, 4.2rem);
  font-weight: 950;
  line-height: 1.04;
  letter-spacing: 0;
  text-wrap: balance;
}
.snapshot__title em {
  font-style: normal;
  color: var(--brand-sage);
  background: linear-gradient(180deg, transparent 64%, rgba(155, 224, 111, 0.55) 64%);
  padding: 0 0.1em;
}
.snapshot__lede {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: 1.55;
  max-width: 50ch;
}

/* Right-side live panel */
.snapshot__panel {
  position: relative;
  padding: clamp(22px, 3vw, 34px);
  border-radius: 32px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(252, 247, 235, 0.78));
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--brand-shadow-panel);
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 360px;
}

.snapshot__panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}
.snapshot__panel-head small {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 700;
}

.snapshot__alert {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 12px;
  border-radius: var(--r-pill);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.snapshot__alert--sage  { background: var(--shade-mist); color: var(--shade-deep); }
.snapshot__alert--sun   { background: var(--sun-soft); color: #8a5a14; }
.snapshot__alert--peach { background: var(--peach-soft); color: #8b3f25; }
.snapshot__alert--ink   { background: rgba(31,42,30,0.08); color: var(--brand-ink-soft); }

.snapshot__alert-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.snapshot__alert-dots span {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.25;
}
.snapshot__alert-dots span.is-on { opacity: 0.95; }

.snapshot__loading {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--brand-ink-muted);
  font-size: 1.05rem;
  font-weight: 700;
  text-align: center;
  padding: 30px;
}
.snapshot__loading--err { color: #8b3f25; }

.snapshot__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--brand-line-soft);
}
.metric--accent {
  background: var(--brand-lime-soft);
  border-color: rgba(91, 140, 97, 0.18);
}
.metric small {
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.metric strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.85rem, 3vw, 2.4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.01em;
}
.metric strong span {
  font-size: 0.6em;
  font-weight: 800;
  margin-left: 2px;
  color: var(--brand-ink-muted);
}
.metric__hint {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 600;
  margin-top: 2px;
}

.snapshot__forecast {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px;
  border-radius: 22px;
  background: rgba(252, 247, 235, 0.72);
  border: 1px dashed rgba(35, 45, 39, 0.12);
}
.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.forecast-day small {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--brand-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.forecast-day strong {
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--brand-ink);
}
.forecast-day__bar {
  position: relative;
  width: 14px;
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.forecast-day__bar span {
  width: 100%;
  height: clamp(8px, var(--h, 24px), 78px);
  border-radius: 8px;
  background: var(--brand-lime);
  transition: height var(--d-base) var(--ease-out-expo);
}
.forecast-day__bar span[data-hot='true']      { background: var(--brand-gold); }
.forecast-day__bar span[data-very-hot='true'] { background: #d77252; }

@media (max-width: 980px) {
  .snapshot {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .snapshot__title {
    font-size: clamp(2.1rem, 8vw, 3.4rem);
  }
}

@media (max-width: 640px) {
  .snapshot__metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .snapshot__forecast {
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    padding: 10px;
  }
  .forecast-day__bar { width: 10px; height: 56px; }
}
</style>
