<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import AppButton from '@/components/AppButton.vue';
import riskSceneHigh from '@/assets/heat-risk-high.png';
import riskSceneLow from '@/assets/heat-risk-low.png';
import riskSceneModerate from '@/assets/heat-risk-moderate.png';
import type { SelfCheckAnswers } from '@/lib/selfcheck/types';

const props = defineProps<{
  result: unknown;
  area: unknown;
  suburb: unknown;
  snapshot: unknown;
  answers: SelfCheckAnswers;
}>();

defineEmits<{
  (e: 'back'): void;
  (e: 'restart'): void;
}>();

type RiskClass = 'risk-low' | 'risk-medium' | 'risk-high';
type DimKey = 'env' | 'body' | 'home' | 'social';

interface Dimension {
  key: DimKey;
  label: string;
  score: number;
  max: number;
  icon: string;
}

interface Recommendation {
  icon: string;
  text: string;
}

const dimensions = computed<Dimension[]>(() => {
  const env = coolPlaceScore.value + outdoorScore.value;
  const body = ageScore.value + heatDiscomfortScore.value;
  const home = coolingScore.value + homeHeatScore.value + coolDestinationScore.value;
  const social = livingScore.value + checkInScore.value;

  return [
    { key: 'env', label: 'Living Area', score: env, max: 4, icon: 'material-symbols:park' },
    { key: 'body', label: 'Body Sensitivity', score: body, max: 4, icon: 'material-symbols:thermometer' },
    { key: 'home', label: 'Home Cooling', score: home, max: 6, icon: 'material-symbols:home' },
    { key: 'social', label: 'Social Support', score: social, max: 4, icon: 'material-symbols:groups' },
  ];
});

const rawScore = computed(() => dimensions.value.reduce((sum, dim) => sum + dim.score, 0));
const score20 = computed(() => Math.round((rawScore.value / 18) * 20));

const primaryDimension = computed(() => (
  dimensions.value.reduce((best, dim) => (
    dim.score > best.score || (dim.score === best.score && dim.score / dim.max > best.score / best.max)
      ? dim
      : best
  ))
));

const hasMainConcern = computed(() => primaryDimension.value.score > 0);

const risk = computed<{ label: string; className: RiskClass; descLines: string[] }>(() => {
  if (score20.value <= 6) {
    return {
      label: 'Low Risk',
      className: 'risk-low',
      descLines: [
        'You appear well-prepared for hot weather overall.',
        'Keep up your healthy habits.',
      ],
    };
  }

  if (score20.value <= 13) {
    return {
      label: 'Moderate Risk',
      className: 'risk-medium',
      descLines: [
        'On hot days you may occasionally feel unwell.',
        'Some targeted steps will help keep you safe.',
      ],
    };
  }

  return {
    label: 'High Risk',
    className: 'risk-high',
    descLines: [
      'Your main risk comes from the highest-scoring area of your answers.',
      'Follow the targeted recommendations below.',
    ],
  };
});

const showAlert = computed(() => (
  score20.value >= 14 || dimensions.value.some((dim) => dim.score >= 4)
));

const scoreThumbLeft = computed(() => `${Math.min(94, Math.max(5, score20.value * 4.7))}%`);

const scoreSeverity = computed(() => severityClass(score20.value / 20));

const riskVisual = computed(() => {
  if (score20.value <= 6) {
    return { className: 'scene-low', image: riskSceneLow, alt: 'Low heat risk scene' };
  }

  if (score20.value <= 13) {
    return { className: 'scene-moderate', image: riskSceneModerate, alt: 'Moderate heat risk scene' };
  }

  return { className: 'scene-high', image: riskSceneHigh, alt: 'High heat risk scene' };
});

const recommendationsIntro = computed(() => {
  if (score20.value <= 6) {
    return "You are generally adapting well in hot weather. Keep these simple habits going:";
  }

  if (score20.value <= 13) {
    return 'In hot weather, you may occasionally feel uncomfortable. These cooling steps are worth paying attention to:';
  }

  return hasMainConcern.value
    ? `Your main risk comes from: ${primaryRiskCopy.value.title}. ${primaryRiskCopy.value.explanation}`
    : 'Here are your most important steps:';
});

const recommendations = computed<Recommendation[]>(() => {
  if (score20.value <= 6) return allRecommendations.low;
  if (score20.value <= 13) return allRecommendations.medium;
  return allRecommendations[primaryDimension.value.key];
});

const primaryRiskCopy = computed(() => riskSourceCopy[primaryDimension.value.key]);

function severityClass(ratio: number): string {
  if (ratio < 0.35) return 'severity-green';
  if (ratio < 0.6) return 'severity-yellow';
  if (ratio < 0.8) return 'severity-orange';
  return 'severity-red';
}

const coolPlaceScore = computed(() => {
  const value = props.answers.social.knows_local_services;
  if (value === 'yes') return 0;
  if (value === 'unsure') return 1;
  return 2;
});

const outdoorScore = computed(() => {
  const value = props.answers.personal.mobility;
  if (value === 'no') return 0;
  if (value === 'a_little') return 1;
  return 2;
});

const ageScore = computed(() => {
  const value = props.answers.personal.age_band;
  if (value === '65-74') return 0;
  if (value === '75-84') return 1;
  return 2;
});

const heatDiscomfortScore = computed(() => {
  const value = props.answers.personal.prior_heat_discomfort;
  if (value === 'never') return 0;
  if (value === 'sometimes') return 1;
  return 2;
});

const coolingScore = computed(() => {
  const value = props.answers.home.has_ac;
  if (value === 'yes') return 0;
  if (value === 'fan_only') return 1;
  return 2;
});

const homeHeatScore = computed(() => {
  const value = props.answers.home.keeps_cool;
  if (value === 'usually') return 0;
  if (value === 'sometimes') return 1;
  return 2;
});

const coolDestinationScore = computed(() => {
  const value = props.answers.home.knows_cool_place;
  if (value === 'yes') return 0;
  if (value === 'unsure') return 1;
  return 2;
});

const livingScore = computed(() => {
  const value = props.answers.social.lives_alone;
  if (value === 'no') return 0;
  if (value === 'sometimes') return 1;
  return 2;
});

const checkInScore = computed(() => {
  const value = props.answers.social.check_in;
  if (value === 'yes') return 0;
  if (value === 'sometimes') return 1;
  return 2;
});

const allRecommendations: Record<'low' | 'medium' | DimKey, Recommendation[]> = {
  low: [
    { icon: 'material-symbols:check-circle', text: 'Keep your normal daily routine.' },
    { icon: 'material-symbols:water-drop', text: 'Drink enough water during summer, even when you do not feel thirsty.' },
  ],
  medium: [
    { icon: 'material-symbols:schedule', text: 'Avoid going outdoors between 11am and 4pm on hot days when the sun is at its strongest.' },
    { icon: 'material-symbols:water-drop', text: "Drink water regularly throughout the day - don't wait until you feel thirsty." },
    { icon: 'material-symbols:home', text: 'On hot days, spend some time at a cool location such as a library, shopping centre, or community hall.' },
  ],
  env: [
    { icon: 'material-symbols:wb-sunny', text: 'Plan your outdoor trips for early morning (before 10am) or early evening when temperatures are lower.' },
    { icon: 'material-symbols:location-on', text: 'Find and save the address of your nearest cool public place (library, shopping centre) so you know where to go.' },
    { icon: 'material-symbols:checkroom', text: 'Wear loose, light-coloured clothing when you go out to help your body stay cooler.' },
  ],
  body: [
    { icon: 'material-symbols:water-drop', text: 'Drink at least 8 glasses of water spread through the day, even before you feel thirsty.' },
    { icon: 'material-symbols:warning', text: 'Watch for early warning signs: dizziness, headache, feeling unusually tired, or dry mouth. These mean you need to cool down and rest right away.' },
    { icon: 'material-symbols:fitness-center', text: 'Avoid strenuous physical activity during the hottest parts of the day. Save exercise for the cooler morning hours.' },
  ],
  home: [
    { icon: 'material-symbols:mode-fan', text: 'Use your air conditioner or fan - even on a low setting, it makes a real difference. If yours is hard to operate, ask someone to help you set it up.' },
    { icon: 'material-symbols:blinds', text: 'Close curtains or blinds on windows facing the sun during the day to block heat - this alone can lower indoor temperature significantly.' },
    { icon: 'material-symbols:power-settings-new', text: "Turn off appliances and lights you're not using - they generate heat inside your home." },
  ],
  social: [
    { icon: 'material-symbols:chat', text: 'Arrange for a friend, neighbour, or family member to call or message you once a day during a heatwave.' },
    { icon: 'material-symbols:phone-iphone', text: "Set a reminder on your phone or clock for daily check-ins on very hot days - it's a simple habit that keeps you safe." },
    { icon: 'material-symbols:groups', text: 'Contact your local council or community centre - many offer free welfare-check programmes for older residents during summer.' },
  ],
};

const riskSourceCopy: Record<DimKey, { title: string; explanation: string }> = {
  home: {
    title: 'limited home cooling conditions',
    explanation: 'Your home may become hot and may not cool down easily.',
  },
  env: {
    title: 'frequent outdoor exposure or limited cool places',
    explanation: 'In hot weather, you may come into contact with high-temperature environments more often.',
  },
  body: {
    title: 'higher body sensitivity to heat',
    explanation: 'When the weather becomes hot, you may be more likely to feel uncomfortable.',
  },
  social: {
    title: 'limited social support',
    explanation: 'During hot weather, fewer people may be available to contact or check in on you.',
  },
};
</script>

<template>
  <div class="result-html">
    <header class="result-page-title">
      <div>
        <p>Your self-check result</p>
        <h2>Your heat safety profile</h2>
      </div>
    </header>

    <section class="result-hero">
      <div class="result-header">
        <div :class="['risk-badge-large', risk.className]">
          <div class="risk-icon" aria-hidden="true">
            <svg v-if="risk.className === 'risk-low'" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2" />
              <path d="M10 16L14 20L22 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="risk.className === 'risk-medium'" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L29 26H3L16 4Z" fill="currentColor" opacity="0.22" />
              <path d="M16 13V19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="16" cy="23" r="1.5" fill="currentColor" />
            </svg>
            <svg v-else width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2" />
              <path d="M16 10V17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="16" cy="22" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div class="risk-label">Risk Level</div>
          <div class="risk-level">{{ risk.label }}</div>
        </div>

        <div class="score-copy">
          <div class="score-kicker">
            <Icon icon="material-symbols:monitoring" aria-hidden="true" />
            Your Heat Risk Score
          </div>
          <div class="score-display">
            <div>
              <div class="score-num">{{ score20 }}</div>
              <div class="score-denom">out of 20</div>
            </div>
          </div>
          <p class="risk-desc">
            <span v-for="line in risk.descLines" :key="line" class="risk-desc-line">{{ line }}</span>
          </p>
        </div>

        <div
          :class="['risk-scene', riskVisual.className]"
          aria-hidden="true"
        >
          <img :src="riskVisual.image" :alt="riskVisual.alt" />
        </div>
      </div>

      <div class="score-bar-wrap">
        <div :class="['score-bar-track', scoreSeverity]">
          <div class="score-bar-thumb" :style="{ left: scoreThumbLeft }"></div>
        </div>
        <div class="bar-labels"><span>Lower risk</span><span>Higher risk</span></div>
      </div>
    </section>

    <section class="dimensions-card">
      <h3>Your Risk by Area</h3>
      <div class="dimRows">
        <div
          v-for="dim in dimensions"
          :key="dim.key"
          :class="['dim-row', hasMainConcern && dim.key === primaryDimension.key ? 'primary-dim' : 'normal-dim']"
        >
          <div class="dim-top">
            <div class="dim-name">
              <span class="dim-icon" aria-hidden="true">
                <Icon :icon="dim.icon" />
              </span>
              {{ dim.label }}
              <span v-if="hasMainConcern && dim.key === primaryDimension.key" class="primary-tag">Main concern</span>
            </div>
            <div class="dim-score">{{ dim.score }} / {{ dim.max }}</div>
          </div>
          <div class="dim-bar-track">
            <div
              :class="['dim-bar-fill', severityClass(dim.score / dim.max)]"
              :style="{ width: `${Math.round((dim.score / dim.max) * 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="showAlert" class="alert-box">
      <div class="alert-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3L26 24H2L14 3Z" fill="currentColor" opacity="0.28" />
          <path d="M14 11V16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="14" cy="20" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <p class="alert-text">
        <strong>Safety Reminder:</strong> If you feel dizzy, nauseous, or unusually unwell in the heat, move to a cool place and drink water right away. Don't wait to see if it passes.
      </p>
    </section>

    <section class="recs-card">
      <h3>Your Personal Recommendations</h3>
      <p class="recs-intro">{{ recommendationsIntro }}</p>
      <div class="recs-list">
        <div v-for="rec in recommendations" :key="rec.text" class="rec-item">
          <div class="rec-icon-wrap" aria-hidden="true">
            <Icon :icon="rec.icon" />
          </div>
          <p class="rec-text">{{ rec.text }}</p>
        </div>
      </div>
    </section>

    <div class="result-actions">
      <AppButton variant="secondary" @click="$emit('back')">Back</AppButton>
      <AppButton variant="primary" @click="$emit('restart')">Retake self-check</AppButton>
    </div>
  </div>
</template>

<style>
.result-html {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.result-page-title {
  display: flex;
  align-items: center;
  padding: 24px 28px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 92% 10%, rgba(155, 224, 111, 0.18), transparent 35%),
    var(--brand-paper-white);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--brand-shadow-panel);
}

.result-page-title p {
  margin-bottom: 4px;
  color: var(--brand-sage);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.result-page-title h2 {
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2rem, 3.3vw, 2.9rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0;
}

.result-hero,
.dimensions-card,
.recs-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  box-shadow: var(--brand-shadow-panel);
}

.result-hero {
  position: relative;
  isolation: isolate;
}

.result-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 154px minmax(260px, 1fr) minmax(280px, 34%);
  align-items: flex-start;
  gap: 22px;
  min-height: 250px;
  padding: clamp(26px, 4vw, 38px);
}

.risk-badge-large {
  position: relative;
  z-index: 3;
  flex: 0 0 124px;
  min-height: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 16px;
  text-align: center;
}

.risk-low {
  color: var(--shade-deep);
  background: rgba(228, 248, 213, 0.72);
}
.risk-medium {
  color: #986014;
  background: rgba(239, 166, 43, 0.16);
}
.risk-high {
  color: var(--alert);
  background: var(--alert-soft);
}

.risk-label,
.score-kicker {
  color: currentColor;
  opacity: 0.72;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.risk-level {
  font-family: var(--font-editorial);
  font-size: 1.28rem;
  font-weight: 700;
  line-height: 1.05;
}

.score-copy {
  position: relative;
  z-index: 3;
  min-width: 0;
  max-width: 36rem;
}

.risk-scene {
  position: relative;
  z-index: 1;
  align-self: center;
  width: 100%;
  min-width: 0;
  height: clamp(190px, 22vw, 250px);
  pointer-events: none;
  transform: translateZ(0);
}

.risk-scene img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  opacity: 0.94;
  filter: saturate(0.92) brightness(1.07) contrast(0.96);
  mix-blend-mode: multiply;
}

.risk-scene::before {
  content: none;
}

.risk-scene::after {
  content: none;
}

.scene-low {
}

.scene-low img {
  opacity: 0.92;
  filter: saturate(0.86) brightness(1.1) contrast(0.94);
}

.scene-moderate {
}

.scene-moderate img {
  opacity: 0.94;
  filter: saturate(0.92) brightness(1.08) contrast(0.94);
}

.scene-high {
}

.scene-high img {
  opacity: 0.88;
  filter: saturate(0.78) brightness(1.12) contrast(0.9);
  mix-blend-mode: normal;
}

.score-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--brand-ink-muted);
  margin-bottom: 8px;
}

.score-display {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.score-num {
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(3rem, 5vw, 4.2rem);
  font-weight: 700;
  line-height: 0.95;
}

.score-denom {
  margin-top: 6px;
  color: var(--brand-ink-muted);
  font-size: 1.02rem;
  font-weight: 650;
}

.risk-desc {
  position: relative;
  z-index: 3;
  margin-top: 18px;
  color: var(--brand-ink-muted);
  font-size: 1.02rem;
  font-weight: 500;
  line-height: 1.6;
  inline-size: min(100%, 25rem);
  max-inline-size: 25rem;
  text-wrap: pretty;
  white-space: normal;
}

.risk-desc-line {
  display: block !important;
  max-inline-size: 100%;
  overflow-wrap: break-word;
}

.score-bar-wrap {
  position: relative;
  z-index: 2;
  padding: 0 clamp(26px, 4vw, 38px) 34px;
}

.score-bar-track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  border: 1px solid var(--brand-line);
  background: linear-gradient(90deg, #70d657 0%, #f4d35e 36%, #f0a12f 66%, #d64b35 100%);
}

.score-bar-thumb {
  position: absolute;
  top: 50%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--shade-deep);
  border: 3px solid #fff;
  box-shadow: 0 8px 18px rgba(35, 45, 39, 0.22);
  transform: translate(-50%, -50%);
  transition: left 700ms var(--ease-out-expo);
}

.bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--brand-ink-muted);
  font-size: 0.82rem;
  font-weight: 650;
}

.dimensions-card,
.recs-card {
  padding: clamp(26px, 4vw, 34px);
}

.dimensions-card h3,
.recs-card h3 {
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(1.45rem, 2.2vw, 1.8rem);
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 22px;
}

.dim-row {
  margin-bottom: 20px;
}
.dim-row:last-child {
  margin-bottom: 0;
}

.dim-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.dim-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--brand-ink-soft);
  font-size: 0.98rem;
  font-weight: 800;
}

.primary-dim .dim-name {
  color: var(--brand-gold);
}

.dim-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(98, 133, 107, 0.12);
  color: currentColor;
  font-size: 0.72rem;
  font-weight: 950;
}

.primary-tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(239, 166, 43, 0.18);
  color: #8a4f0e;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dim-score {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 800;
}

.dim-bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--brand-paper);
}

.dim-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 800ms var(--ease-out-expo);
}

.severity-green {
  background: #72d75a;
}

.severity-yellow {
  background: #f4d35e;
}

.severity-orange {
  background: #f0a12f;
}

.severity-red {
  background: #d64b35;
}

.score-bar-track.severity-green,
.score-bar-track.severity-yellow,
.score-bar-track.severity-orange,
.score-bar-track.severity-red {
  background: linear-gradient(90deg, #72d75a 0%, #f4d35e 36%, #f0a12f 66%, #d64b35 100%);
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1.5px solid rgba(239, 166, 43, 0.44);
  background: rgba(239, 166, 43, 0.14);
  color: #6b4a08;
}

.alert-icon {
  flex: 0 0 auto;
}

.alert-text {
  color: inherit;
  font-size: 1rem;
  font-weight: 550;
  line-height: 1.6;
}

.alert-text strong {
  font-weight: 900;
}

.recs-intro {
  margin-top: -12px;
  margin-bottom: 20px;
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.55;
}

.rec-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--brand-line-soft);
}
.rec-item:last-child {
  border-bottom: 0;
}

.rec-icon-wrap {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--brand-paper);
  color: var(--shade-deep);
  font-size: 1.35rem;
  font-weight: 950;
}

.rec-text {
  padding-top: 8px;
  color: var(--brand-ink-soft);
  font-size: 1.02rem;
  font-weight: 500;
  line-height: 1.55;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

@media (max-width: 680px) {
  .result-page-title {
    padding: 20px;
    align-items: flex-start;
  }

  .result-header {
    grid-template-columns: 1fr;
  }

  .risk-badge-large {
    width: 100%;
    min-height: auto;
  }

  .risk-scene {
    height: 210px;
    width: 100%;
    margin: 0;
  }

  .risk-scene img {
    opacity: 0.72;
  }

  .dim-top {
    align-items: flex-start;
  }

  .result-actions {
    flex-direction: column-reverse;
  }

  .result-actions .btn {
    width: 100%;
  }
}
</style>
