<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import AppNav from '@/components/AppNav.vue';
import AppButton from '@/components/AppButton.vue';
import SectionKicker from '@/components/SectionKicker.vue';
import HeatSnapshot from '@/components/selfcheck/HeatSnapshot.vue';
import AreaProfileGrid from '@/components/selfcheck/AreaProfileGrid.vue';
import CoolPlaceStrip from '@/components/selfcheck/CoolPlaceStrip.vue';
import Wizard from '@/components/selfcheck/Wizard.vue';
import ResultDashboard from '@/components/selfcheck/ResultDashboard.vue';
import ModeSwitcher, { type SelfCheckMode } from '@/components/selfcheck/ModeSwitcher.vue';
import HousePlanner from '@/components/selfcheck/houseplanner/HousePlanner.vue';

import {
  findSuburbByKey,
  getAreaProfile,
  getCoolPlaces,
  listSuburbs,
} from '@/lib/selfcheck/area-profiles';
import { fetchHeatSnapshot } from '@/lib/selfcheck/open-meteo';
import { calculateScores, emptyAnswers } from '@/lib/selfcheck/scoring';
import type {
  HeatSnapshot as HeatSnapshotData,
  SelfCheckAnswers,
  SuburbIndexEntry,
} from '@/lib/selfcheck/types';

const DEFAULT_KEY = 'carlton-vic-3053';

const suburb = ref<SuburbIndexEntry | null>(findSuburbByKey(DEFAULT_KEY) ?? listSuburbs()[0] ?? null);
const area = computed(() => (suburb.value ? getAreaProfile(suburb.value.key) : null));
const coolPlaces = computed(() => (suburb.value ? getCoolPlaces(suburb.value.key) : []));

const snapshot = ref<HeatSnapshotData | null>(null);
const snapshotLoading = ref(false);
const snapshotError = ref<string | null>(null);

const answers = reactive<SelfCheckAnswers>(emptyAnswers());
const hasResult = ref(false);
const mode = ref<SelfCheckMode>('wizard');

const result = computed(() => calculateScores(area.value, answers));

const wizardRef = ref<HTMLElement | null>(null);
const resultRef = ref<HTMLElement | null>(null);

async function loadSnapshot(s: SuburbIndexEntry) {
  snapshotLoading.value = true;
  snapshotError.value = null;
  try {
    snapshot.value = await fetchHeatSnapshot(s.lat, s.lng);
  } catch (err) {
    snapshotError.value = err instanceof Error ? err.message : 'unknown';
    snapshot.value = null;
  } finally {
    snapshotLoading.value = false;
  }
}

function onChangeLocation(s: SuburbIndexEntry) {
  suburb.value = s;
}

watch(
  () => suburb.value?.key,
  (key) => {
    if (!suburb.value || !key) return;
    void loadSnapshot(suburb.value);
  }
);

onMounted(() => {
  if (suburb.value) void loadSnapshot(suburb.value);
});

function onAnswersChange(next: SelfCheckAnswers) {
  Object.assign(answers, next);
}

async function onSubmit() {
  hasResult.value = true;
  await nextTick();
  resultRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onRestart() {
  Object.assign(answers, emptyAnswers());
  hasResult.value = false;
  nextTick(() => wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function scrollToWizard() {
  wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onModeChange(next: SelfCheckMode) {
  mode.value = next;
  nextTick(() => wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function scrollToArea() {
  document.getElementById('area-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const coolPlaceTitle = computed(() => {
  const lvl = snapshot.value?.alert_level;
  if (lvl === 'severe' || lvl === 'extreme') return 'Cool places to head to today';
  return 'Cool places near you';
});
</script>

<template>
  <div class="sc">
    <AppNav />

    <main>
      <!-- §1 Hero / Live Heat Snapshot -->
      <section id="hero" class="sc-section sc-section--hero">
        <div class="sc-section__inner">
          <HeatSnapshot
            :suburb="suburb"
            :snapshot="snapshot"
            :loading="snapshotLoading"
            :error="snapshotError"
            @change-location="onChangeLocation"
          />
          <div class="sc-section__cta">
            <AppButton variant="feature" @click="scrollToWizard">Start 3-min self-check</AppButton>
            <AppButton variant="ghost" @click="scrollToArea">Skip to local insights ↓</AppButton>
          </div>
        </div>
      </section>

      <!-- §2 Area Heat Profile -->
      <section id="area-profile" class="sc-section sc-section--area">
        <div class="sc-section__inner">
          <header class="sc-head">
            <SectionKicker>Local insights</SectionKicker>
            <h2>Why your area feels hotter</h2>
            <p>
              Heat affects neighbourhoods differently. These four indicators describe
              {{ suburb?.name ?? 'your suburb' }} so the rest of this page can speak to where you actually live.
            </p>
          </header>
          <AreaProfileGrid :area="area" :suburb="suburb" />
        </div>
      </section>

      <!-- §3 Cool Places -->
      <section id="cool-places" class="sc-section sc-section--places">
        <div class="sc-section__inner">
          <header class="sc-head sc-head--row">
            <div>
              <SectionKicker>Free, air-conditioned, near you</SectionKicker>
              <h2>{{ coolPlaceTitle }}</h2>
              <p>
                Libraries, community centres, shopping centres, and shaded parks — all open today.
                Most welcome people just dropping in for a few hours.
              </p>
            </div>
          </header>
          <CoolPlaceStrip
            :places="coolPlaces"
            view-all-href="/#navigation"
            :highlight-first="snapshot?.alert_level === 'severe' || snapshot?.alert_level === 'extreme'"
          />
        </div>
      </section>

      <!-- §4 Self-Check / Home planner -->
      <section id="wizard" ref="wizardRef" class="sc-section sc-section--wizard">
        <div class="sc-section__inner sc-section__inner--narrow">
          <header class="sc-head sc-head--center">
            <SectionKicker>{{ mode === 'wizard' ? '3-minute self-check' : 'Home heat planner' }}</SectionKicker>
            <h2>{{ mode === 'wizard' ? 'Tell us a little about you' : 'Map your home for room-by-room tips' }}</h2>
            <p v-if="mode === 'wizard'">
              Four short steps about your health, home, and the people around you.
              Your answers turn today's forecast above into clear, personal next steps —
              not generic heat advice.
            </p>
            <p v-else>
              Pick a layout that's close to your home, mark which windows have curtains or fans,
              and we'll combine that with today's forecast and the sun's position to give you
              advice for specific rooms and windows.
            </p>
          </header>
          <div class="sc-mode-switch">
            <ModeSwitcher :mode="mode" @update:mode="onModeChange" />
          </div>
          <Wizard
            v-if="mode === 'wizard'"
            :area="area"
            :suburb="suburb"
            :answers="answers"
            @update:answers="onAnswersChange"
            @submit="onSubmit"
          />
          <HousePlanner
            v-else
            :suburb="suburb"
            :snapshot="snapshot"
          />
        </div>
      </section>

      <!-- §5 Result (wizard only) -->
      <section
        v-if="hasResult && mode === 'wizard'"
        id="result"
        ref="resultRef"
        class="sc-section sc-section--result"
      >
        <div class="sc-section__inner sc-section__inner--narrow">
          <header class="sc-head sc-head--center">
            <SectionKicker>Your personalised plan</SectionKicker>
            <h2>Your heat plan for {{ suburb?.name ?? 'today' }}</h2>
          </header>
          <ResultDashboard
            :result="result"
            :area="area"
            :suburb="suburb"
            :snapshot="snapshot"
            :answers="answers"
            @restart="onRestart"
          />
        </div>
      </section>

      <!-- Footer -->
      <footer class="sc-footer">
        <div class="sc-section__inner">
          <p class="sc-footer__safety">
            <strong>Safety:</strong> This tool does not replace medical advice. If you feel dizzy,
            confused, weak, very thirsty, or unwell during hot weather, seek medical help. In an
            emergency, call <strong>000</strong>.
          </p>
          <p class="sc-footer__privacy">
            Your answers stay on this device only and are cleared when you close this page.
            You do not need to create an account.
          </p>
          <p class="sc-footer__sources">
            Data sources: Open-Meteo (weather), AURIN Heat Vulnerability Index (mock for v1),
            ABS Census 2021 (older population), OpenStreetMap contributors (cool places).
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.sc {
  min-height: 100vh;
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 22% -8%, rgba(155, 224, 111, 0.14), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.sc-section {
  position: relative;
  isolation: isolate;
  padding: clamp(64px, 9vw, 120px) 0;
}

.sc-section--hero {
  padding-top: calc(var(--nav-h) + 80px);
  background:
    radial-gradient(circle at 84% 30%, rgba(155, 224, 111, 0.22), transparent 0 30%, transparent 50%),
    var(--brand-paper-white);
}

.sc-section--area {
  background: linear-gradient(180deg, var(--brand-paper-white), #f7f2e8);
}

.sc-section--places {
  background:
    radial-gradient(circle at 16% 20%, rgba(168, 212, 226, 0.22), transparent 30%),
    linear-gradient(180deg, #f7f2e8, var(--brand-paper-white));
}

.sc-section--wizard {
  background:
    radial-gradient(circle at 80% 80%, rgba(155, 224, 111, 0.16), transparent 40%),
    linear-gradient(180deg, var(--brand-paper-white), #f7f2e8);
}

.sc-section--result {
  background:
    radial-gradient(circle at 20% 10%, rgba(244, 183, 158, 0.18), transparent 35%),
    linear-gradient(180deg, #f7f2e8, var(--brand-paper-white));
}

.sc-section__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(28px, 4vw, 50px);
}

.sc-section__inner--narrow {
  max-width: 880px;
}

.sc-section__cta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.sc-mode-switch {
  display: flex;
  justify-content: center;
  margin: -8px 0 18px;
}

.sc-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
}
.sc-head--center {
  align-items: center;
  text-align: center;
  margin-inline: auto;
}
.sc-head--row {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 22px;
  max-width: none;
}
.sc-head--row > div {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
}

.sc-head h2 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2rem, 3.6vw, 2.95rem);
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: 0;
  text-wrap: balance;
}

.sc-head p {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: 1.55;
  max-width: 60ch;
}
.sc-head--center p { margin-inline: auto; }

.sc-footer {
  background: var(--brand-ink-soft);
  color: var(--brand-paper);
  padding: clamp(40px, 6vw, 72px) 0;
}
.sc-footer .sc-section__inner {
  gap: 14px;
}
.sc-footer p {
  color: rgba(248, 241, 227, 0.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
  max-width: 88ch;
}
.sc-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}
.sc-footer__safety {
  padding: 18px 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.18);
}
.sc-footer__sources {
  font-size: 0.9rem;
  color: rgba(248, 241, 227, 0.6);
}

@media (max-width: 640px) {
  .sc-head--row { flex-direction: column; align-items: flex-start; }
  .sc-section__cta { width: 100%; }
  .sc-section__cta :deep(.btn) { width: 100%; }
}
</style>
