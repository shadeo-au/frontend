<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import BrandWatermark from '../components/BrandWatermark.vue';
import SectionKicker from '../components/SectionKicker.vue';
import HeroFullSection from '../components/HeroFullSection.vue';
import HviCanvasMap from '../components/awareness/HviCanvasMap.vue';

type ExplainerKey = 'shows' | 'built' | 'use';
type ConcernScore = 1 | 2 | 3 | 4 | 5;

const root = ref<HTMLElement | null>(null);
const activeConcern = ref<ConcernScore>(1);
const showFollowupSections = ref(false);
const riskSection = ref<HTMLElement | null>(null);
let riseObserver: IntersectionObserver | undefined;
const flippedExplainers = ref<Record<ExplainerKey, boolean>>({
  shows: false,
  built: false,
  use: false,
});

const mapExplainers: Array<{
  key: ExplainerKey;
  number: string;
  title: string;
  eyebrow: string;
  body: string;
}> = [
  {
    key: 'shows',
    number: '01',
    title: 'What it shows',
    eyebrow: 'What it shows',
    body: 'Each suburb is grouped from one to five. Higher scores mean hot days may be harder for more people in that area.',
  },
  {
    key: 'built',
    number: '02',
    title: 'How it is built',
    eyebrow: 'How it is built',
    body: 'The index combines heat exposure, people who may be more sensitive to heat, and local ability to prepare or get support.',
  },
  {
    key: 'use',
    number: '03',
    title: 'How to use it',
    eyebrow: 'How to use it',
    body: 'Search or tap a suburb, then use the result to plan cooler routes, check personal risk, or arrange earlier check-ins.',
  },
];

const toggleExplainer = (key: ExplainerKey) => {
  flippedExplainers.value = {
    ...flippedExplainers.value,
    [key]: !flippedExplainers.value[key],
  };
};

const concernLevels: Array<{
  score: ConcernScore;
  label: string;
  badge: string;
  title: string;
  body: string;
  imageSrc: string;
  dot: string;
  background: string;
  border: string;
  active: string;
  badgeBackground: string;
  badgeText: string;
}> = [
  {
    score: 1,
    label: '1 — Lower concern',
    badge: 'Score 1 — Lower concern',
    title: 'Your suburb is well-supported for hot days.',
    body: 'Residents here generally have good access to shade, green space, and cooling facilities. Older adults are less likely to face serious heat-related health risks, as the local environment and community infrastructure provide solid support during hot weather.',
    imageSrc: '/risk-score-1.png',
    dot: '#4f982e',
    background: 'rgba(228, 248, 213, 0.62)',
    border: 'rgba(79, 152, 46, 0.28)',
    active: 'rgba(155, 224, 111, 0.24)',
    badgeBackground: 'rgba(155, 224, 111, 0.28)',
    badgeText: '#3c701d',
  },
  {
    score: 2,
    label: '2 — Low concern',
    badge: 'Score 2 — Low concern',
    title: 'Mostly comfortable, with some gaps to watch.',
    body: 'These suburbs have reasonable tree cover and access to cool places, but some gaps exist. Older adults may still need to plan outdoor activities carefully on very hot days, particularly if they live alone or have limited mobility.',
    imageSrc: '/risk-score-2.png',
    dot: '#94c657',
    background: 'rgba(241, 250, 225, 0.72)',
    border: 'rgba(148, 198, 87, 0.3)',
    active: 'rgba(155, 224, 111, 0.22)',
    badgeBackground: 'rgba(155, 224, 111, 0.24)',
    badgeText: '#4b7a25',
  },
  {
    score: 3,
    label: '3 — Moderate concern',
    badge: 'Score 3 — Moderate concern',
    title: 'Take extra care during heatwaves.',
    body: 'A mix of environmental and social factors creates a noticeable heat risk for older residents. Streets may have limited shade, and some residents may lack access to air conditioning or nearby cool spaces. Community check-ins are recommended during heatwaves.',
    imageSrc: '/risk-score-3.png',
    dot: '#f2a51f',
    background: 'rgba(255, 244, 223, 0.86)',
    border: 'rgba(239, 166, 43, 0.34)',
    active: 'rgba(239, 166, 43, 0.18)',
    badgeBackground: 'rgba(239, 166, 43, 0.2)',
    badgeText: '#7a4b09',
  },
  {
    score: 4,
    label: '4 — High concern',
    badge: 'Score 4 — High concern',
    title: 'Seek cool spaces early on hot days.',
    body: 'These suburbs face significant heat vulnerability. Hard surfaces, low tree canopy, and a higher proportion of older residents living alone make extreme heat particularly dangerous. Residents are strongly encouraged to seek cool environments early and stay connected with family, neighbours, or community services.',
    imageSrc: '/risk-score-4.png',
    dot: '#df5f34',
    background: 'rgba(255, 239, 232, 0.88)',
    border: 'rgba(223, 95, 52, 0.3)',
    active: 'rgba(223, 95, 52, 0.14)',
    badgeBackground: 'rgba(223, 95, 52, 0.16)',
    badgeText: '#88331d',
  },
  {
    score: 5,
    label: '5 — Highest concern',
    badge: 'Score 5 — Highest concern',
    title: 'Immediate action needed during heatwaves.',
    body: 'This suburb faces the greatest combination of heat exposure, population sensitivity, and limited adaptive capacity. During heatwaves, residents — especially older adults — are at serious risk of heat exhaustion or heatstroke. Immediate access to cool places, regular welfare checks, and early action are essential.',
    imageSrc: '/risk-score-5.png',
    dot: '#b52b31',
    background: 'rgba(255, 235, 236, 0.88)',
    border: 'rgba(181, 43, 49, 0.3)',
    active: 'rgba(181, 43, 49, 0.14)',
    badgeBackground: 'rgba(181, 43, 49, 0.16)',
    badgeText: '#792027',
  },
];

const activeConcernData = computed(() => (
  concernLevels.find((level) => level.score === activeConcern.value) ?? concernLevels[0]
));

const toConcernScore = (score: number): ConcernScore => (
  Math.min(5, Math.max(1, Math.round(score))) as ConcernScore
);

const handleMapLearnMore = async (score: number) => {
  activeConcern.value = toConcernScore(score);
  showFollowupSections.value = true;

  await nextTick();
  observeRiseTargets();
  riskSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

const observeRiseTargets = () => {
  if (!riseObserver) return;

  const els = root.value?.querySelectorAll('[data-rise]') ?? [];
  els.forEach((el) => {
    if (!el.classList.contains('is-in')) riseObserver?.observe(el);
  });
};

onMounted(() => {
  riseObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          riseObserver?.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '-8% 0px -10% 0px',
      threshold: 0.14,
    }
  );
  observeRiseTargets();
});

onBeforeUnmount(() => {
  riseObserver?.disconnect();
});
</script>

<template>
  <div ref="root" class="awareness-page">
    <AppNav />

    <main>
      <HeroFullSection
        id="awareness-hero"
        image-src="/awarenesspage.png"
        image-alt="A heat vulnerability map of Melbourne suburbs overlaid with community icons, representing how Shadeo helps older adults, carers, and community workers plan support during hot days."
      >
        <h1>See where hot days may be harder.</h1>
      </HeroFullSection>

      <section id="hvi-map" class="map-section">
        <BrandWatermark />
        <span class="map-section__side">Section 02 - Suburb Map</span>

        <div class="map-section__intro" data-rise="section-head">
          <SectionKicker>Suburb heat vulnerability view</SectionKicker>
          <h2>
            Heat
            <span class="awareness-script">vulnerability</span>
            map.
          </h2>
          <div class="map-section__description">
            <img src="/awareness-map-overview.png" alt="" aria-hidden="true" />
            <p>
              Heat vulnerability shows where hot places and people who may need extra care
              overlap. This map helps turn a broad heat warning into a local pattern.
            </p>
          </div>
        </div>

        <div class="map-explainer" data-rise="cards" aria-label="How to read the heat vulnerability map">
          <button
            v-for="item in mapExplainers"
            :key="item.key"
            type="button"
            class="map-explainer__card"
            :class="{ 'is-flipped': flippedExplainers[item.key] }"
            :aria-pressed="flippedExplainers[item.key]"
            @click="toggleExplainer(item.key)"
          >
            <span class="map-explainer__inner">
              <span class="map-explainer__face map-explainer__face--front">
                <span class="map-explainer__number">{{ item.number }}</span>
                <strong>{{ item.title }}</strong>
                <small>
                  <i aria-hidden="true">⇄</i>
                  tap to learn more
                </small>
              </span>

              <span class="map-explainer__face map-explainer__face--back">
                <span class="map-explainer__eyebrow">{{ item.eyebrow }}</span>
                <span class="map-explainer__body">{{ item.body }}</span>
                <small>
                  <i aria-hidden="true">⇄</i>
                  tap to flip back
                </small>
              </span>
            </span>
          </button>
        </div>

        <HviCanvasMap data-rise="map" @learn-more="handleMapLearnMore" />
      </section>

      <section v-if="showFollowupSections" ref="riskSection" class="story-section">
        <BrandWatermark />
        <span class="story-section__side">Section 03 - Linked Views</span>

        <div class="story-section__copy" data-rise="section-head">
          <SectionKicker>Concern levels</SectionKicker>
          <h2>
            <span>Understanding your <em>heat</em></span>
            <small>vulnerability score.</small>
          </h2>
          <p>
            Scores run from 1 to 5 and combine environmental conditions, population
            sensitivity, and local support capacity. Tap a level to see what it means for
            residents in that area.
          </p>
        </div>

        <div
          class="story-shell"
          data-rise="panel"
          :style="{
            '--story-bg': activeConcernData.background,
            '--story-border': activeConcernData.border,
            '--story-active': activeConcernData.active,
            '--story-dot': activeConcernData.dot,
            '--story-badge-bg': activeConcernData.badgeBackground,
            '--story-badge-text': activeConcernData.badgeText,
          }"
        >
          <div class="story-shell__levels" role="tablist" aria-label="Heat vulnerability concern levels">
            <button
              v-for="level in concernLevels"
              :key="level.score"
              type="button"
              :class="{ 'is-active': activeConcern === level.score }"
              role="tab"
              :aria-selected="activeConcern === level.score"
              @click="activeConcern = level.score"
            >
              <i :style="{ background: level.dot }" aria-hidden="true" />
              <span>{{ level.label }}</span>
            </button>
          </div>

          <div class="story-shell__content">
            <div class="story-shell__text">
              <h3>{{ activeConcernData.title }}</h3>
              <p>{{ activeConcernData.body }}</p>
            </div>
            <div class="story-shell__visual" aria-hidden="true">
              <img :src="activeConcernData.imageSrc" alt="" />
            </div>
          </div>
        </div>
      </section>

      <section v-if="showFollowupSections" class="action-section">
        <BrandWatermark />
        <span class="action-section__side">Section 04 - From Awareness To Action</span>

        <div class="action-section__copy" data-rise="section-head">
          <SectionKicker>Use the insight</SectionKicker>
          <h2>Awareness should <span>lead</span> to a next step.</h2>
          <p>
            After someone sees a higher-concern area, Shadeo should help them choose a
            cooler route, check personal readiness, or arrange support.
          </p>
        </div>

        <div class="action-grid">
          <article data-rise="card" style="--rise-delay: 120ms">
            <span>01</span>
            <h3>Plan a cooler route</h3>
            <p>Use shade, rest stops, distance, and cooler places to compare daily walks.</p>
            <AppButton href="/walk-planner" variant="feature">Cool Routes</AppButton>
          </article>

          <article data-rise="card" style="--rise-delay: 220ms">
            <span>02</span>
            <h3>Check personal risk</h3>
            <p>Combine area conditions with health, home cooling, mobility, and support.</p>
            <AppButton href="/self-check" variant="feature">Start Self-Check</AppButton>
          </article>
        </div>
      </section>

      <footer class="awareness-footer">
        <div class="awareness-footer__inner">
          <p class="awareness-footer__safety">
            <strong>Safety:</strong> This map is for awareness and planning only. It does not predict
            individual health outcomes or replace official heat-health advice. If you feel dizzy,
            confused, weak, very thirsty, or unwell during hot weather, seek medical help. In an
            emergency, call <strong>000</strong>.
          </p>
          <p>
            <strong>Data source:</strong> DELWP Urban Heat Islands and Heat Vulnerability Assessment
            in Melbourne, 2018.
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.awareness-page {
  min-height: 100vh;
  background: var(--brand-paper-white);
}

.awareness-footer {
  background: var(--brand-ink-soft);
  color: var(--brand-paper);
  padding: clamp(40px, 6vw, 72px) 0;
}

.awareness-footer__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.awareness-footer p {
  max-width: 88ch;
  color: rgba(248, 241, 227, 0.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
}

.awareness-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}

.awareness-footer__safety {
  padding: 18px 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.18);
}

.map-section,
.story-section,
.action-section {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding-inline: max(var(--gutter), calc((100vw - 1240px) / 2));
}

.map-section,
.story-section,
.action-section {
  padding-top: calc(var(--nav-h) + 42px);
  padding-bottom: clamp(56px, 8vw, 92px);
  background:
    radial-gradient(circle at 80% 24%, rgba(155, 224, 111, 0.12), transparent 34%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, #f7f2e8 100%);
}

.story-section {
  background:
    radial-gradient(circle at 20% 30%, rgba(168, 212, 226, 0.18), transparent 32%),
    linear-gradient(180deg, var(--brand-paper) 0%, var(--brand-paper-white) 100%);
}

.action-section {
  background:
    radial-gradient(circle at 76% 42%, rgba(155, 224, 111, 0.22), transparent 30%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, rgba(228, 248, 213, 0.42) 100%);
}

.map-section__side,
.story-section__side,
.action-section__side {
  position: absolute;
  left: 16px;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left center;
  color: rgba(35, 45, 39, 0.36);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.map-section__intro,
.story-section__copy,
.action-section__copy {
  position: relative;
  z-index: 2;
}

.map-section h2,
.story-section h2,
.action-section h2 {
  max-width: 12ch;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: var(--brand-fs-h2);
  font-weight: 950;
  line-height: var(--brand-lh-heading);
  letter-spacing: 0;
  text-wrap: balance;
}

.map-section__intro p,
.story-section__copy p,
.action-section__copy p {
  max-width: var(--brand-copy-width);
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

.map-section__intro,
.story-section__copy,
.action-section__copy {
  max-width: 960px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(280px, 0.8fr);
  gap: clamp(24px, 5vw, 68px);
  align-items: end;
  margin-bottom: clamp(28px, 5vw, 52px);
}

.map-section__intro {
  max-width: none;
  grid-template-columns: minmax(0, 0.82fr) minmax(380px, 0.76fr);
  column-gap: clamp(68px, 11vw, 150px);
}

.map-section__intro p {
  justify-self: end;
}

.map-section__description {
  position: relative;
  justify-self: end;
  width: min(100%, 620px);
}

.map-section__description img {
  position: absolute;
  left: 0;
  bottom: calc(100% + clamp(2px, 0.8vw, 12px));
  display: block;
  width: min(100%, 600px);
  height: auto;
  opacity: 0.76;
  filter: saturate(0.82) contrast(0.92) brightness(1.05);
  mix-blend-mode: multiply;
  -webkit-mask-image:
    radial-gradient(ellipse 72% 58% at 50% 48%, #000 0 56%, rgba(0, 0, 0, 0.5) 74%, transparent 100%);
  mask-image:
    radial-gradient(ellipse 72% 58% at 50% 48%, #000 0 56%, rgba(0, 0, 0, 0.5) 74%, transparent 100%);
}

.map-section__description p {
  margin: 0;
}

.action-section__copy {
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 3vw, 34px);
  text-align: center;
  margin-inline: auto;
}

.action-section h2 {
  max-width: 980px;
  margin: 0;
  font-family: var(--font-editorial);
  font-size: clamp(3rem, 4.7vw, 5.25rem);
  font-weight: 500;
  line-height: 1.02;
}

.action-section__copy p {
  max-width: 76ch;
  margin: 0;
  padding: 0;
  font-family: var(--font-body);
  font-size: clamp(1.14rem, 1.26vw, 1.32rem);
  font-weight: 600;
  line-height: 1.68;
}

.action-section h2 span {
  display: inline-block;
  margin-inline: 0.05em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.08em;
  font-weight: 700;
  line-height: 0.82;
  transform: translateY(0.04em) rotate(-1.5deg);
  transform-origin: center;
}

.story-section__copy h2 {
  max-width: none;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.7rem, 4vw, 4.45rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: nowrap;
}

.story-section__copy {
  max-width: none;
  grid-template-columns: minmax(560px, 1.05fr) minmax(420px, 0.8fr);
  column-gap: clamp(54px, 8vw, 118px);
  row-gap: clamp(10px, 1.4vw, 18px);
}

.story-section__copy h2 span,
.story-section__copy h2 small {
  display: block;
  font: inherit;
  white-space: nowrap;
}

.story-section__copy h2 em {
  display: inline-block;
  margin-inline: 0.06em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.02em;
  font-style: normal;
  font-weight: 700;
  line-height: 0.76;
  transform: rotate(-1.5deg);
  transform-origin: left center;
}

.story-section__copy p {
  color: var(--brand-ink-muted);
  font-size: clamp(1.125rem, 1.18vw, 1.28rem);
  font-weight: 600;
  line-height: 1.68;
  justify-self: end;
}

.map-section__intro h2 {
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.65rem, 4.25vw, 4.7rem);
  font-weight: 500;
  line-height: 1.04;
  text-wrap: balance;
}

.map-section__intro p {
  color: var(--brand-ink-muted);
  font-size: clamp(1.05rem, 1.16vw, 1.22rem);
  font-weight: 600;
  line-height: 1.58;
}

.awareness-script {
  display: block;
  width: fit-content;
  margin-top: 0.02em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.18em;
  font-weight: 700;
  line-height: 0.76;
  letter-spacing: 0;
  transform: rotate(-1.5deg);
  transform-origin: left center;
}

.awareness-script--inline {
  display: inline-block;
  margin-inline: 0.06em;
  vertical-align: -0.02em;
}

.map-explainer {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 20px);
  margin: -18px 0 clamp(26px, 4vw, 42px);
  perspective: 1400px;
}

.map-explainer__card {
  min-width: 0;
  min-height: clamp(220px, 21vw, 250px);
  border-radius: 22px;
  text-align: left;
  outline: none;
  perspective: inherit;
}

.map-explainer__card:focus-visible {
  box-shadow: var(--brand-focus-ring);
}

.map-explainer__inner {
  position: relative;
  width: 100%;
  min-height: inherit;
  display: block;
  transform-style: preserve-3d;
  transition: transform 700ms var(--ease-out-expo);
}

.map-explainer__card.is-flipped .map-explainer__inner {
  transform: rotateY(180deg);
}

.map-explainer__face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: inherit;
  padding: clamp(22px, 2.5vw, 28px);
  border: 1px solid rgba(35, 45, 39, 0.14);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(251, 250, 247, 0.9)),
    var(--brand-paper-white);
  color: var(--brand-ink-soft);
  box-shadow: 0 24px 58px -48px rgba(35, 45, 39, 0.44);
  backface-visibility: hidden;
  transform: translateZ(0);
  transition:
    border-color var(--d-fast) ease,
    box-shadow var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.map-explainer__card:hover .map-explainer__face,
.map-explainer__card:focus-visible .map-explainer__face {
  border-color: rgba(98, 133, 107, 0.34);
  box-shadow: 0 28px 68px -46px rgba(35, 45, 39, 0.48);
}

.map-explainer__face--back {
  transform: rotateY(180deg);
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.86), rgba(228, 248, 213, 0.28)),
    var(--brand-paper-white);
}

.map-explainer__face--front {
  justify-content: flex-end;
}

.map-explainer__number,
.map-explainer__eyebrow {
  display: block;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.map-explainer__number {
  position: absolute;
  top: clamp(22px, 2.5vw, 28px);
  left: clamp(22px, 2.5vw, 28px);
  color: rgba(98, 133, 107, 0.66);
  font-size: clamp(1.35rem, 2.6vw, 2.05rem);
  line-height: 0.9;
}

.map-explainer__eyebrow {
  color: rgba(35, 45, 39, 0.52);
  font-size: 0.85rem;
}

.map-explainer__face strong {
  display: block;
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: clamp(1.35rem, 1.8vw, 1.58rem);
  font-weight: 850;
  line-height: 1.16;
  letter-spacing: 0;
}

.map-explainer__face--front strong {
  margin-top: 0;
  margin-bottom: clamp(34px, 4vw, 44px);
}

.map-explainer__body {
  display: block;
  margin-top: 14px;
  color: var(--brand-ink-muted);
  font-size: clamp(1.05rem, 1.14vw, 1.16rem);
  font-weight: 650;
  line-height: 1.55;
}

.map-explainer__face small {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(79, 88, 80, 0.52);
  font-size: 0.95rem;
  font-weight: 750;
}

.map-explainer__face--back small {
  margin-top: auto;
}

.map-explainer__face small i {
  color: var(--brand-sage);
  font-style: normal;
  font-weight: 900;
}

.map-section__intro :deep(.section-kicker),
.story-section__copy :deep(.section-kicker),
.action-section__copy :deep(.section-kicker) {
  grid-column: 1 / -1;
}

[data-rise] {
  opacity: 0;
  transform: translateY(26px);
  transition:
    opacity 880ms var(--ease-out-expo) var(--rise-delay, 0ms),
    transform 880ms var(--ease-out-expo) var(--rise-delay, 0ms),
    filter 880ms var(--ease-out-expo) var(--rise-delay, 0ms);
  will-change: opacity, transform;
}

[data-rise="section-head"] {
  transform: translateY(34px);
}

[data-rise="cards"] {
  transform: translateY(22px) scale(0.985);
  filter: saturate(0.9);
}

[data-rise="map"],
[data-rise="panel"] {
  transform: translateY(28px) scale(0.99);
  filter: saturate(0.92);
}

[data-rise="card"] {
  transform: translateY(24px);
}

[data-rise].is-in {
  opacity: 1;
  transform: none;
  filter: none;
}

.map-explainer.is-in .map-explainer__card {
  animation: explainer-card-rise 780ms var(--ease-out-expo) both;
}

.map-explainer.is-in .map-explainer__card:nth-child(2) {
  animation-delay: 110ms;
}

.map-explainer.is-in .map-explainer__card:nth-child(3) {
  animation-delay: 210ms;
}

@keyframes explainer-card-rise {
  from {
    opacity: 0;
    transform: translateY(22px) rotateX(2deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.story-shell {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 54px);
  height: clamp(480px, 44vw, 560px);
  min-height: 480px;
  padding: clamp(28px, 3.6vw, 46px);
  border: 1px solid var(--story-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.66), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 44%),
    var(--story-bg);
  box-shadow: var(--brand-shadow-panel);
  transition:
    background var(--d-base) ease,
    border-color var(--d-base) ease;
}

.story-shell__levels {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-height: 100%;
  padding-right: clamp(20px, 2.8vw, 36px);
  border-right: 1px solid rgba(35, 45, 39, 0.12);
}

.story-shell__levels button {
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 18px;
  border: 1.5px solid rgba(35, 45, 39, 0.18);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.32);
  color: rgba(16, 19, 15, 0.78);
  font-size: clamp(1rem, 1.08vw, 1.12rem);
  font-weight: 650;
  line-height: 1.18;
  text-align: left;
  transition:
    background var(--d-fast) ease,
    border-color var(--d-fast) ease,
    color var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.story-shell__levels button i {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.story-shell__levels button:hover,
.story-shell__levels button:focus-visible {
  border-color: var(--story-border);
  background: rgba(255, 255, 255, 0.52);
  transform: translateX(2px);
}

.story-shell__levels button.is-active {
  border-color: var(--story-border);
  background: var(--story-active);
  color: var(--brand-ink);
  font-weight: 900;
  transform: none;
}

.story-shell__content {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(260px, 0.72fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  min-height: 100%;
  padding: 0 clamp(4px, 1.4vw, 16px);
}

.story-shell__text {
  position: relative;
  z-index: 2;
}

.story-shell__text h3 {
  max-width: 24ch;
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2rem, 2.85vw, 3.15rem);
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: 0;
  text-wrap: balance;
}

.story-shell__text p {
  max-width: 66ch;
  margin-top: clamp(20px, 2.4vw, 30px);
  color: var(--brand-ink-muted);
  font-size: clamp(1.12rem, 1.22vw, 1.28rem);
  font-weight: 600;
  line-height: 1.66;
}

.story-shell__visual {
  position: relative;
  height: 100%;
  min-height: 340px;
  align-self: stretch;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  -webkit-mask-image:
    radial-gradient(ellipse 72% 66% at 56% 48%, #000 0 48%, rgba(0, 0, 0, 0.58) 66%, transparent 88%);
  mask-image:
    radial-gradient(ellipse 72% 66% at 56% 48%, #000 0 48%, rgba(0, 0, 0, 0.58) 66%, transparent 88%);
}

.story-shell__visual::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(ellipse 54% 54% at 18% 50%, var(--story-bg) 0%, rgba(255, 255, 255, 0.46) 54%, transparent 82%),
    linear-gradient(90deg, var(--story-bg) 0%, rgba(255, 255, 255, 0.4) 30%, transparent 68%),
    linear-gradient(0deg, var(--story-bg) 0%, transparent 22%, transparent 72%, var(--story-bg) 100%);
  mix-blend-mode: normal;
  pointer-events: none;
}

.story-shell__visual img {
  width: min(110%, 460px);
  height: auto;
  opacity: 0.62;
  filter: saturate(0.82) contrast(0.9) brightness(1.04);
  mix-blend-mode: multiply;
  -webkit-mask-image:
    radial-gradient(ellipse 64% 62% at 50% 50%, #000 0 54%, rgba(0, 0, 0, 0.42) 72%, transparent 100%);
  mask-image:
    radial-gradient(ellipse 64% 62% at 50% 50%, #000 0 54%, rgba(0, 0, 0, 0.42) 72%, transparent 100%);
}

.action-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(18px, 3vw, 28px);
  max-width: 1060px;
  margin-inline: auto;
  width: 100%;
}

.action-grid article {
  min-height: 390px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(26px, 3vw, 38px);
  border: 1px solid var(--brand-line);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: var(--brand-shadow-panel);
}

.action-grid span {
  color: var(--brand-lime);
  font-family: var(--font-body);
  font-size: clamp(3.2rem, 5vw, 5rem);
  font-weight: 900;
  line-height: 0.9;
  text-shadow: 0 2px 0 rgba(35, 45, 39, 0.42);
}

.action-grid h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.75rem, 2.35vw, 2.38rem);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: 0;
  text-wrap: balance;
}

.action-grid p {
  flex: 1;
  color: var(--brand-ink-muted);
  font-family: var(--font-body);
  font-size: clamp(1rem, 1.08vw, 1.12rem);
  font-weight: 650;
  line-height: 1.55;
  max-width: 38ch;
}

.action-grid :deep(.btn--feature) {
  width: 100%;
  min-width: 0;
}

@media (max-width: 980px) {
  .map-section__intro,
  .map-explainer,
  .story-section__copy,
  .action-section__copy,
  .story-shell,
  .story-shell__content,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .map-explainer {
    margin-top: -10px;
  }

  .map-section__description {
    justify-self: start;
  }

  .map-section__description img {
    position: relative;
    bottom: auto;
    margin-bottom: clamp(12px, 3vw, 20px);
  }

  .story-shell__levels {
    border-right: 0;
    border-bottom: 1px solid rgba(35, 45, 39, 0.12);
    padding-right: 0;
    padding-bottom: 18px;
  }

  .story-shell__content {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .story-shell__visual {
    height: 260px;
    min-height: 260px;
  }
}

@media (max-width: 640px) {
  .map-section,
  .story-section,
  .action-section {
    padding-inline: var(--gutter);
  }

  .map-section__side,
  .story-section__side,
  .action-section__side {
    display: none;
  }

  .map-section h2,
  .story-section h2,
  .action-section h2 {
    max-width: 15ch;
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }

  .map-section__intro p,
  .story-section__copy p,
  .action-section__copy p {
    max-width: 34ch;
  }

  .story-shell {
    height: auto;
    min-height: 640px;
    padding: 22px;
    border-radius: 26px;
  }

  .story-shell__levels button {
    min-height: 54px;
  }

  .story-shell__text h3 {
    max-width: 22ch;
    font-size: clamp(1.85rem, 7vw, 2.45rem);
  }

  .story-shell__visual {
    height: 230px;
    min-height: 230px;
  }

  .story-shell__visual img {
    width: min(100%, 320px);
  }

  .map-explainer__card {
    min-height: 214px;
  }

  .action-grid article {
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-rise],
  [data-rise].is-in {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
  }

  .map-explainer.is-in .map-explainer__card {
    animation: none;
  }

  .map-explainer__inner {
    transition: none;
  }
}
</style>
