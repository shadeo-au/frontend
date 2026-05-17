<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import BrandWatermark from '../components/BrandWatermark.vue';
import SectionKicker from '../components/SectionKicker.vue';
import HeroFullSection from '../components/HeroFullSection.vue';
import HviCanvasMap from '../components/awareness/HviCanvasMap.vue';
import AppFooter from '../components/AppFooter.vue';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/gsap';

type ExplainerKey = 'shows' | 'built' | 'use';
type ConcernScore = 1 | 2 | 3 | 4 | 5;

type ShviFeatureProps = {
  sal_code: string;
  suburb_name: string;
  shvi_score: number | null;
  shvi_raw: number | null;
  shvi_band_label: string | null;
  older_population: number;
  total_population: number;
  sa1_count: number;
  no_seniors: boolean;
  low_confidence: boolean;
};

type ShviFeature = { properties: ShviFeatureProps };

const root = ref<HTMLElement | null>(null);
const activeConcern = ref<ConcernScore>(1);
const showFollowupSections = ref(false);
const riskSection = ref<HTMLElement | null>(null);
const mapSection = ref<HTMLElement | null>(null);
const mapRef = ref<InstanceType<typeof HviCanvasMap> | null>(null);
const suburbFeatures = ref<ShviFeature[]>([]);
const rankingMode = ref<'sensitive' | 'cooler'>('sensitive');
const includeLowConfidence = ref(false);
let riseTriggers: ScrollTrigger[] = [];
let patternsTrigger: ScrollTrigger | undefined;
let pageCtx: gsap.Context | undefined;
let patternBarsRevealed = false;

const concernColorsMap: Record<number, string> = {
  1: '#5a9b68',
  2: '#a9cc67',
  3: '#efb447',
  4: '#df8740',
  5: '#c95949',
};

const handleMapDataLoaded = (features: ShviFeature[]) => {
  suburbFeatures.value = features;
};

const rankedSuburbs = computed(() => {
  const eligible = suburbFeatures.value.filter((f) => {
    const p = f.properties;
    if (p.shvi_raw == null || p.shvi_score == null) return false;
    if (!includeLowConfidence.value && p.low_confidence) return false;
    return true;
  });
  const sorted = [...eligible].sort((a, b) => {
    const av = a.properties.shvi_raw ?? 0;
    const bv = b.properties.shvi_raw ?? 0;
    return rankingMode.value === 'sensitive' ? bv - av : av - bv;
  });
  return sorted.slice(0, 10);
});

const rankingMaxValue = computed(() => {
  if (!rankedSuburbs.value.length) return 1;
  const values = rankedSuburbs.value.map((f) => f.properties.shvi_raw ?? 0);
  // Use absolute max so positive and negative SHVI both scale comparably
  return Math.max(...values.map((v) => Math.abs(v))) || 1;
});

// "Where do older residents live?" — aggregate older_population by band
const seniorsByBand = computed(() => {
  const buckets: Record<number, { count: number; suburbs: number }> = {
    1: { count: 0, suburbs: 0 },
    2: { count: 0, suburbs: 0 },
    3: { count: 0, suburbs: 0 },
    4: { count: 0, suburbs: 0 },
    5: { count: 0, suburbs: 0 },
  };
  suburbFeatures.value.forEach((f) => {
    const b = f.properties.shvi_score;
    if (b && b >= 1 && b <= 5) {
      buckets[b].count += f.properties.older_population || 0;
      buckets[b].suburbs += 1;
    }
  });
  const total = Object.values(buckets).reduce((s, x) => s + x.count, 0);
  return [1, 2, 3, 4, 5].map((b) => ({
    band: b,
    count: buckets[b].count,
    suburbs: buckets[b].suburbs,
    pct: total > 0 ? (buckets[b].count / total) * 100 : 0,
  }));
});

const seniorsBandMax = computed(() => Math.max(...seniorsByBand.value.map((b) => b.count)) || 1);

const totalSeniorsHigher = computed(() => {
  const buckets = seniorsByBand.value;
  const upper = buckets[3].count + buckets[4].count;  // band 4 + 5 (idx 3, 4)
  const total = buckets.reduce((s, x) => s + x.count, 0);
  return total ? Math.round((upper / total) * 100) : 0;
});

const handleRankingSelect = async (salCode: string) => {
  if (!mapSection.value) return;
  mapSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  await nextTick();
  // Give scroll a moment so map redraws on the right viewport
  setTimeout(() => {
    mapRef.value?.selectByCode(salCode);
  }, 350);
};
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
    body: 'Every Greater Melbourne suburb gets a heat-sensitivity score from 1 to 5. A higher score means older residents living there may need more support on hot days. Scores compare suburbs with each other — they are not an absolute danger rating.',
  },
  {
    key: 'built',
    number: '02',
    title: 'How it is built',
    eyebrow: 'How it is built',
    body: 'Each suburb\'s score combines three things: how hot the area gets, how many older residents may be more affected by heat, and how much local support is available. Suburbs with more residents aged 65+ count for more in the score.',
  },
  {
    key: 'use',
    number: '03',
    title: 'How to use it',
    eyebrow: 'How to use it',
    body: 'Use it to spot suburbs where older residents may need more attention on hot days. It can help families, community groups, and councils plan ahead — but it does not replace personal health or cooling advice.',
  },
];

const toggleExplainer = async (key: ExplainerKey) => {
  const nextValue = !flippedExplainers.value[key];
  flippedExplainers.value = {
    ...flippedExplainers.value,
    [key]: nextValue,
  };

  await nextTick();
  const inner = root.value?.querySelector<HTMLElement>(`[data-explainer-key="${key}"] .map-explainer__inner`);
  if (!inner) return;

  gsap.to(inner, {
    rotationY: nextValue ? 180 : 0,
    duration: prefersReducedMotion() ? 0 : 0.7,
    ease: 'power3.inOut',
  });
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
    label: '1 — Cooler area',
    badge: 'Score 1 — Cooler area',
    title: 'A cooler patch of the city.',
    body: 'Generous tree cover, cooler surfaces, and a strong baseline of local support put residents here in good shape during heat. Older neighbours benefit from the usual care — hydration reminders and a friendly check-in for anyone living alone.',
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
    label: '2 — Generally manageable',
    badge: 'Score 2 — Generally manageable',
    title: 'Comfortable, with a few gaps to plan around.',
    body: 'Mostly green and well-connected, but some pockets run warmer or have older residents living independently. On heat days a quick check-in with elderly neighbours and a clear plan for cool places to spend the afternoon goes a long way.',
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
    label: '3 — Watch on hot days',
    badge: 'Score 3 — Watch on hot days',
    title: 'Worth keeping an eye on during heatwaves.',
    body: 'Some streets run hot, a moderate share of residents are aged 65+, and access to support varies block by block. Planning ahead pays off — know the nearest cool place (library, community centre), schedule errands for cooler hours, and check in on older neighbours.',
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
    label: '4 — Heat-sensitive area',
    badge: 'Score 4 — Heat-sensitive area',
    title: 'Cool spaces and check-ins matter here.',
    body: 'Heat sits longer in this area, and a substantial share of older residents would benefit from extra community contact during heatwaves. Pre-identify cooling spots, make sure family and neighbours know who lives alone, and follow up on the second hot day of a streak.',
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
    label: '5 — Most heat-sensitive',
    badge: 'Score 5 — Most heat-sensitive area',
    title: 'Where extra community attention helps the most.',
    body: 'Three challenging factors meet here: hotter local conditions, a high share of older residents (including many living alone), and limited local support resources. Welfare check-ins, council cooling programs, and family scheduling reach a lot of people on heat days.',
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
  setupRiseAnimations();
  ScrollTrigger.refresh();
  riskSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

const riseFromVars = (el: HTMLElement) => {
  const type = el.dataset.rise;
  if (type === 'section-head') return { y: 34, scale: 1, filter: 'saturate(1)' };
  if (type === 'cards') return { y: 22, scale: 0.985, filter: 'saturate(0.9)' };
  if (type === 'map' || type === 'panel') return { y: 28, scale: 0.99, filter: 'saturate(0.92)' };
  return { y: 24, scale: 1, filter: 'saturate(1)' };
};

const animateRiseTarget = (el: HTMLElement) => {
  const delay = Number.parseFloat(getComputedStyle(el).getPropertyValue('--rise-delay')) || 0;

  if (prefersReducedMotion()) {
    gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, filter: 'none' });
    return;
  }

  gsap.fromTo(
    el,
    { autoAlpha: 0, ...riseFromVars(el) },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'none',
      duration: 0.88,
      delay: delay / 1000,
      ease: 'power3.out',
    }
  );

  if (el.dataset.rise === 'cards') {
    const cards = el.querySelectorAll<HTMLElement>('.map-explainer__card');
    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 22, rotationX: 2 },
      { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.72, stagger: 0.11, ease: 'power3.out' }
    );
  }
};

const resetRiseTarget = (el: HTMLElement) => {
  if (prefersReducedMotion()) {
    gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, filter: 'none' });
    return;
  }

  gsap.set(el, { autoAlpha: 0, ...riseFromVars(el) });
};

const setupRiseAnimations = () => {
  riseTriggers.forEach((trigger) => trigger.kill());
  riseTriggers = [];

  const els = gsap.utils.toArray<HTMLElement>(root.value?.querySelectorAll('[data-rise]') ?? []);
  els.forEach((el) => {
    resetRiseTarget(el);
    riseTriggers.push(ScrollTrigger.create({
      trigger: el,
      start: 'top 86%',
      end: 'bottom 12%',
      onEnter: () => animateRiseTarget(el),
      onEnterBack: () => animateRiseTarget(el),
      onLeaveBack: () => resetRiseTarget(el),
    }));
  });
};

const animateBars = (selector: string, delay = 0) => {
  const bars = gsap.utils.toArray<HTMLElement>(root.value?.querySelectorAll(selector) ?? []);
  if (!bars.length) return;

  gsap.killTweensOf(bars);
  gsap.set(bars, { transformOrigin: 'left center' });

  if (prefersReducedMotion()) {
    gsap.set(bars, { scaleX: 1 });
    return;
  }

  gsap.fromTo(
    bars,
    { scaleX: 0 },
    {
      scaleX: 1,
      duration: 0.74,
      delay,
      ease: 'power3.out',
      stagger: 0.045,
    }
  );
};

const hideBars = (selector: string) => {
  const bars = gsap.utils.toArray<HTMLElement>(root.value?.querySelectorAll(selector) ?? []);
  if (!bars.length) return;
  gsap.killTweensOf(bars);
  gsap.set(bars, {
    scaleX: prefersReducedMotion() ? 1 : 0,
    transformOrigin: 'left center',
  });
};

const animateRankingBars = (delay = 0) => animateBars('.ranking-row__bar i', delay);
const animateSeniorsBars = (delay = 0) => animateBars('.seniors-chart__bar i', delay);
const hideRankingBars = () => hideBars('.ranking-row__bar i');
const hideSeniorsBars = () => hideBars('.seniors-chart__bar i');
const animatePatternBars = () => {
  patternBarsRevealed = true;
  animateRankingBars();
  animateSeniorsBars();
};

const getPatternDataEls = () => gsap.utils.toArray<HTMLElement>(
  root.value?.querySelectorAll(
    '.patterns-card__filter, .ranking-list, .seniors-chart, .patterns-card__finding, .patterns-card__caveat, .patterns-card__loading'
  ) ?? []
);

const hidePatternDataEls = () => {
  const dataEls = getPatternDataEls();
  if (!dataEls.length) return;
  gsap.killTweensOf(dataEls);
  gsap.set(dataEls, {
    autoAlpha: prefersReducedMotion() ? 1 : 0,
    y: prefersReducedMotion() ? 0 : 12,
  });
};

const resetPatternSequence = () => {
  const grid = root.value?.querySelector<HTMLElement>('.patterns-grid');
  if (!grid) return;

  patternBarsRevealed = false;
  const cards = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll('.patterns-card'));
  const headers = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll('.patterns-card__head'));
  const dataEls = getPatternDataEls();

  if (prefersReducedMotion()) {
    gsap.set([grid, ...cards, ...headers, ...dataEls], { autoAlpha: 1, y: 0, scale: 1 });
    hideRankingBars();
    hideSeniorsBars();
    return;
  }

  gsap.killTweensOf([grid, ...cards, ...headers, ...dataEls]);
  gsap.set(grid, { autoAlpha: 1, y: 0, scale: 1 });
  gsap.set(cards, { autoAlpha: 0, y: 24 });
  gsap.set(headers, { autoAlpha: 0, y: 14 });
  gsap.set(dataEls, { autoAlpha: 0, y: 12 });
  hideRankingBars();
  hideSeniorsBars();
};

const playPatternSequence = () => {
  const grid = root.value?.querySelector<HTMLElement>('.patterns-grid');
  if (!grid) return;

  const cards = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll('.patterns-card'));
  const headers = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll('.patterns-card__head'));
  const dataEls = getPatternDataEls();

  if (prefersReducedMotion()) {
    gsap.set([...cards, ...headers, ...dataEls], { autoAlpha: 1, y: 0 });
    animatePatternBars();
    return;
  }

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to(cards, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08 })
    .to(headers, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.06 }, '-=0.24')
    .to(dataEls, {
      autoAlpha: 1,
      y: 0,
      duration: 0.34,
      stagger: 0.03,
      onStart: () => {
        patternBarsRevealed = true;
        animateRankingBars(0.02);
        animateSeniorsBars(0.06);
      },
    }, '-=0.12');
};

const setupPatternBarTrigger = () => {
  patternsTrigger?.kill();
  resetPatternSequence();
  const grid = root.value?.querySelector<HTMLElement>('.patterns-grid');
  if (!grid) return;

  patternsTrigger = ScrollTrigger.create({
    trigger: grid,
    start: 'top 82%',
    end: 'bottom 18%',
    onEnter: playPatternSequence,
    onEnterBack: playPatternSequence,
    onLeaveBack: resetPatternSequence,
  });
};

watch([rankedSuburbs, rankingMode, includeLowConfidence], async () => {
  await nextTick();
  if (patternBarsRevealed) animateRankingBars();
  else {
    hidePatternDataEls();
    hideRankingBars();
  }
  ScrollTrigger.refresh();
}, { flush: 'post' });

watch(seniorsByBand, async () => {
  await nextTick();
  if (patternBarsRevealed) animateSeniorsBars();
  else {
    hidePatternDataEls();
    hideSeniorsBars();
  }
  ScrollTrigger.refresh();
}, { flush: 'post' });

watch(activeConcern, async () => {
  await nextTick();
  const content = root.value?.querySelectorAll<HTMLElement>('.story-shell__text > *, .story-shell__visual img') ?? [];
  if (!content.length || prefersReducedMotion()) return;

  gsap.fromTo(
    content,
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.08, ease: 'power3.out' }
  );
});

onMounted(() => {
  pageCtx = gsap.context(() => {
    gsap.set('.map-explainer__inner', { transformStyle: 'preserve-3d', rotationY: 0 });
  }, root.value ?? undefined);

  setupRiseAnimations();
  setupPatternBarTrigger();
});

onBeforeUnmount(() => {
  riseTriggers.forEach((trigger) => trigger.kill());
  patternsTrigger?.kill();
  pageCtx?.revert();
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

      <section id="hvi-map" ref="mapSection" class="map-section">
        <BrandWatermark />
        <span class="map-section__side">Section 02 - Suburb Map</span>

        <div class="map-section__intro" data-rise="section-head">
          <SectionKicker>Senior heat-sensitivity view</SectionKicker>
          <h2>
            Senior heat
            <span class="awareness-script">sensitivity</span>
          </h2>
          <div class="map-section__description">
            <img src="/awareness-map-overview.png" alt="" aria-hidden="true" />
            <p>
              This map shows which Greater Melbourne suburbs may be harder for older
              residents on hot days — so a city-wide heat warning becomes a local
              picture you can act on.
            </p>
          </div>
        </div>

        <div class="map-explainer" data-rise="cards" aria-label="How to read the heat vulnerability map">
          <button
            v-for="item in mapExplainers"
            :key="item.key"
            type="button"
            class="map-explainer__card"
            :data-explainer-key="item.key"
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

        <HviCanvasMap
          ref="mapRef"
          data-rise="map"
          @learn-more="handleMapLearnMore"
          @data-loaded="handleMapDataLoaded"
        />
      </section>

      <!-- Bottom: patterns across Greater Melbourne - top suburbs and key finding chart -->
      <!-- Always rendered (not gated by Learn More) — shows loading state until map data loads -->
      <section class="patterns-section">
        <BrandWatermark />
        <span class="patterns-section__side">Section 02b - Patterns</span>

        <div class="patterns-section__intro" data-rise="section-head">
          <SectionKicker>Patterns across Greater Melbourne</SectionKicker>
          <h2>Across <span class="awareness-script awareness-script--inline">Greater Melbourne</span></h2>
          <p>
            Two views of the same data: which suburbs are the most and least
            heat-sensitive for older residents, and where residents aged 65+ live
            across all five score levels.
          </p>
        </div>

        <div class="patterns-grid">
          <!-- LEFT: Top suburbs ranking with toggle -->
          <article class="patterns-card">
            <header class="patterns-card__head">
              <div>
                <h3>Top 10 suburbs</h3>
                <p>Click a row to view its full breakdown on the map.</p>
              </div>
              <div class="patterns-toggle" role="tablist" aria-label="Switch ranking direction">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="rankingMode === 'sensitive'"
                  :class="{ 'is-active': rankingMode === 'sensitive' }"
                  @click="rankingMode = 'sensitive'"
                >Most heat-sensitive</button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="rankingMode === 'cooler'"
                  :class="{ 'is-active': rankingMode === 'cooler' }"
                  @click="rankingMode = 'cooler'"
                >Cooler areas</button>
              </div>
            </header>

            <label class="patterns-card__filter">
              <input type="checkbox" v-model="includeLowConfidence" />
              <span>Include small suburbs (less certain scores)</span>
            </label>

            <ol v-if="suburbFeatures.length" class="ranking-list" aria-label="Suburb ranking">
              <li
                v-for="(feature, i) in rankedSuburbs"
                :key="feature.properties.sal_code"
                class="ranking-row"
                :class="{ 'is-low-conf': feature.properties.low_confidence }"
              >
                <button
                  type="button"
                  class="ranking-row__btn"
                  @click="handleRankingSelect(feature.properties.sal_code)"
                  :aria-label="`Open ${feature.properties.suburb_name} on the map`"
                >
                  <span class="ranking-row__rank">{{ i + 1 }}</span>
                  <span class="ranking-row__name">
                    {{ feature.properties.suburb_name }}
                    <small v-if="feature.properties.low_confidence" title="Small sample">small</small>
                  </span>
                  <span class="ranking-row__bar">
                    <i
                      :style="{
                        width: (Math.abs((feature.properties.shvi_raw ?? 0) / rankingMaxValue) * 100) + '%',
                        background: concernColorsMap[feature.properties.shvi_score ?? 0] ?? '#cccccc',
                      }"
                    />
                  </span>
                  <span class="ranking-row__value" :title="`${feature.properties.suburb_name}: heat-sensitivity score ${feature.properties.shvi_score} of 5`">
                    {{ feature.properties.shvi_score }}
                    <small>/5</small>
                  </span>
                </button>
              </li>
              <li v-if="!rankedSuburbs.length" class="ranking-row ranking-row--empty">
                <span>No suburbs match the current filter.</span>
              </li>
            </ol>
            <div v-else class="patterns-card__loading" aria-live="polite">
              <div v-for="i in 6" :key="i" class="skeleton-row" />
              <span>Loading suburb data…</span>
            </div>
          </article>

          <!-- RIGHT: "Where do older residents live?" key finding -->
          <article class="patterns-card">
            <header class="patterns-card__head">
              <div>
                <h3>Where older residents live</h3>
                <p>How many residents aged 65+ live at each score level — showing where support on hot days could reach the most older people.</p>
              </div>
            </header>

            <div v-if="suburbFeatures.length" class="seniors-chart" aria-label="Older residents at each heat-sensitivity score">
              <div
                v-for="row in seniorsByBand"
                :key="row.band"
                class="seniors-chart__row"
                :title="`Score ${row.band}: ${row.suburbs} suburbs, ${row.count.toLocaleString()} residents aged 65+`"
              >
                <span class="seniors-chart__label">
                  Score {{ row.band }}
                </span>
                <span class="seniors-chart__bar">
                  <i
                    :style="{
                      width: ((row.count / seniorsBandMax) * 100) + '%',
                      background: concernColorsMap[row.band],
                    }"
                  />
                </span>
                <span class="seniors-chart__value">
                  {{ row.count >= 1000 ? (row.count / 1000).toFixed(0) + 'k' : row.count.toLocaleString() }}
                  <small>{{ row.pct.toFixed(0) }}%</small>
                </span>
              </div>
            </div>
            <div v-else class="patterns-card__loading">
              <div v-for="i in 5" :key="i" class="skeleton-row skeleton-row--wide" />
              <span>Loading band distribution…</span>
            </div>

            <div v-if="suburbFeatures.length" class="patterns-card__finding">
              <strong>{{ totalSeniorsHigher }}%</strong>
              <span>of Greater Melbourne residents aged 65+ live in the most heat-sensitive suburbs (scored 4 or 5).</span>
            </div>

            <p class="patterns-card__caveat">
              A suburb's score reflects more than temperature. Where older residents
              have fewer local resources and services nearby, the score can be higher
              even when the area is not the hottest.
            </p>
          </article>
        </div>
      </section>

      <section v-if="showFollowupSections" ref="riskSection" class="story-section">
        <BrandWatermark />
        <span class="story-section__side">Section 03 - Linked Views</span>

        <div class="story-section__copy" data-rise="section-head">
          <SectionKicker>Concern levels</SectionKicker>
          <h2>
            Reading
            <span class="awareness-script">the scores.</span>
          </h2>
          <p>
            Scores run from 1 to 5 across Greater Melbourne suburbs. A higher score
            points to places where older residents may benefit from more planning and
            check-ins on hot days. Tap a score to see what a hot day may look like there.
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

      <AppFooter />
    </main>
  </div>
</template>

<style scoped>
.awareness-page {
  min-height: 100vh;
  background: var(--brand-paper-white);
}

/* Footer styles now live in the shared AppFooter.vue component. */

.map-section,
.patterns-section,
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

.patterns-section {
  padding-top: clamp(40px, 6vw, 80px);
  padding-bottom: clamp(56px, 8vw, 92px);
  background:
    radial-gradient(circle at 20% 30%, rgba(155, 224, 111, 0.12), transparent 36%),
    linear-gradient(180deg, #f7f2e8 0%, var(--brand-paper) 100%);
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
.patterns-section__side,
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
  min-height: clamp(260px, 22vw, 300px);
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
  will-change: transform;
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
  }
}

/* ════════════════════════════════════════════════════════════════════
   Patterns section — Top suburbs ranking + key-finding chart
   ════════════════════════════════════════════════════════════════════ */

.patterns-section__intro {
  max-width: 760px;
  margin-bottom: clamp(28px, 4vw, 48px);
}

.patterns-section__intro h2 {
  margin: 12px 0 14px;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2.4rem, 4.4vw, 3.8rem);
  font-weight: 950;
  line-height: 1.04;
  letter-spacing: -0.01em;
}

.patterns-section__intro p {
  color: var(--brand-ink-muted);
  font-size: 1.08rem;
  font-weight: 650;
  line-height: 1.5;
}

.patterns-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

.patterns-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: clamp(20px, 2.6vw, 28px);
  border: 1px solid var(--brand-line);
  border-radius: 28px;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 14px 32px rgba(35, 45, 39, 0.04);
}

.patterns-card__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.patterns-card__head h3 {
  margin: 0 0 4px;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.4rem, 2vw, 1.7rem);
  font-weight: 950;
  line-height: 1.15;
}

.patterns-card__head p {
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.45;
}

/* — Toggle pills — */
.patterns-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--brand-line);
  border-radius: 999px;
  background: rgba(251, 250, 247, 0.7);
}

.patterns-toggle button {
  padding: 7px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.patterns-toggle button.is-active {
  background: var(--brand-ink);
  color: var(--brand-paper-white);
}

.patterns-toggle button:hover:not(.is-active) {
  background: rgba(228, 248, 213, 0.62);
  color: var(--brand-ink-soft);
}

/* — "Include small suburbs" inline filter — */
.patterns-card__filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: -6px;
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.patterns-card__filter input {
  width: 16px;
  height: 16px;
  accent-color: var(--shade-deep, #4f7a5c);
}

/* — Ranking list rows — */
.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-row {
  position: relative;
}

.ranking-row__btn {
  width: 100%;
  display: grid;
  grid-template-columns: 28px minmax(0, 1.3fr) minmax(120px, 2fr) auto;
  align-items: center;
  gap: 14px;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--brand-ink);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 160ms ease, border-color 160ms ease;
}

.ranking-row__btn:hover,
.ranking-row__btn:focus-visible {
  background: rgba(228, 248, 213, 0.42);
  border-color: rgba(98, 133, 107, 0.22);
}

.ranking-row__rank {
  color: var(--brand-ink-muted);
  font-family: var(--font-body);
  font-size: 1.04rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.ranking-row__name {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--brand-ink);
  font-size: 1rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-row__name small {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(223, 167, 64, 0.18);
  color: rgba(122, 75, 9, 0.96);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ranking-row__bar {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.08);
  overflow: hidden;
}

.ranking-row__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transform-origin: left center;
  will-change: transform;
}

.ranking-row__value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.12rem;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}

.ranking-row__value small {
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.ranking-row--empty {
  padding: 16px;
  border: 1px dashed var(--brand-line);
  border-radius: 12px;
  color: var(--brand-ink-muted);
  font-size: 0.94rem;
  font-weight: 650;
  text-align: center;
}

/* — Right card: seniors-by-band chart — */
.seniors-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.seniors-chart__row {
  display: grid;
  grid-template-columns: 64px minmax(120px, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.seniors-chart__label {
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.seniors-chart__bar {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.06);
  overflow: hidden;
}

.seniors-chart__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transform-origin: left center;
  will-change: transform;
}

.seniors-chart__value {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.seniors-chart__value small {
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.patterns-card__finding {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 6px;
  padding: 16px 20px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 86% 0%, rgba(201, 89, 73, 0.16), transparent 60%),
    rgba(255, 244, 240, 0.86);
}

.patterns-card__finding strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  font-weight: 950;
  line-height: 0.95;
  letter-spacing: -0.02em;
}

.patterns-card__finding span {
  color: var(--brand-ink-muted);
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.42;
}

.patterns-card__caveat {
  margin: 0;
  padding: 0;
  color: var(--brand-ink-muted);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.55;
  font-style: italic;
}

/* — Loading skeleton (shown until map emits dataLoaded) — */
.patterns-card__loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0;
  color: var(--brand-ink-muted);
  font-size: 0.88rem;
  font-weight: 650;
  font-style: italic;
  text-align: center;
}

.patterns-card__loading > span {
  margin-top: 6px;
  color: var(--brand-ink-muted);
}

.skeleton-row {
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(35, 45, 39, 0.06),
    rgba(35, 45, 39, 0.12) 50%,
    rgba(35, 45, 39, 0.06)
  );
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.6s linear infinite;
}

.skeleton-row--wide {
  height: 14px;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (max-width: 920px) {
  .patterns-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .ranking-row__btn {
    grid-template-columns: 24px minmax(0, 1fr) minmax(80px, 1.4fr) auto;
    gap: 10px;
  }
}
</style>
