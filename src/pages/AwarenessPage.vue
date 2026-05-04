<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import BrandWatermark from '../components/BrandWatermark.vue';
import SectionKicker from '../components/SectionKicker.vue';
import HeroFullSection from '../components/HeroFullSection.vue';
import HviCanvasMap from '../components/awareness/HviCanvasMap.vue';

type StoryKey = 'shade' | 'support' | 'places';

const root = ref<HTMLElement | null>(null);
const activeStory = ref<StoryKey>('shade');

const stories: Record<StoryKey, {
  label: string;
  title: string;
  body: string;
  bars: Array<{ label: string; value: number }>;
}> = {
  shade: {
    label: 'Local conditions',
    title: 'Heat is shaped by streets, shade, and hard surfaces.',
    body: 'This companion view will compare tree shade, built-up surfaces, and surface heat so the map explains what may be driving local concern.',
    bars: [
      { label: 'Tree shade gaps', value: 72 },
      { label: 'Hard surfaces', value: 64 },
      { label: 'Afternoon heat', value: 58 },
    ],
  },
  support: {
    label: 'Community care',
    title: 'Some places may need earlier check-ins.',
    body: 'This view will connect older residents, care needs, and people living alone so outreach is framed as support, not blame.',
    bars: [
      { label: 'Older residents', value: 66 },
      { label: 'Daily care needs', value: 48 },
      { label: 'Check-in priority', value: 76 },
    ],
  },
  places: {
    label: 'Cool options',
    title: 'Awareness should lead to somewhere cooler.',
    body: 'This view will show libraries, community centres, parks, and other cooler places near higher-concern areas.',
    bars: [
      { label: 'Cool places nearby', value: 44 },
      { label: 'Green space access', value: 61 },
      { label: 'Route readiness', value: 69 },
    ],
  },
};

const activeStoryData = computed(() => stories[activeStory.value]);

onMounted(() => {
  const els = root.value?.querySelectorAll('[data-rise]') ?? [];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
});

onBeforeUnmount(() => {/* io cleaned up via unobserve */});
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

        <div class="map-section__intro">
          <SectionKicker>Suburb heat vulnerability view</SectionKicker>
          <h2>Heat vulnerability<br />map.</h2>
          <p>
            Heat vulnerability shows where hot places and people who may need extra care
            overlap. This map helps turn a broad heat warning into a local pattern.
          </p>
        </div>

        <div class="map-explainer" aria-label="How to read the heat vulnerability map">
          <article>
            <span>What it shows</span>
            <p>
              Each suburb is grouped from one to five. Higher scores mean hot days may be
              harder for more people in that area.
            </p>
          </article>
          <article>
            <span>How it is built</span>
            <p>
              The index combines heat exposure, people who may be more sensitive to heat,
              and local ability to prepare or get support.
            </p>
          </article>
          <article>
            <span>How to use it</span>
            <p>
              Search or tap a suburb, then use the result to plan cooler routes, check
              personal risk, or arrange earlier check-ins.
            </p>
          </article>
        </div>

        <HviCanvasMap />
      </section>

      <section class="story-section">
        <BrandWatermark />
        <span class="story-section__side">Section 03 - Linked Views</span>

        <div class="story-section__copy">
          <SectionKicker>What comes next</SectionKicker>
          <h2>One map, three follow-up views.</h2>
          <p>
            The page should not become a pile of separate charts. These views will explain
            the same pattern from three angles: local conditions, community care, and
            cooler options nearby.
          </p>
        </div>

        <div class="story-shell">
          <div class="story-shell__tabs" role="tablist" aria-label="Awareness story views">
            <button
              v-for="(story, key) in stories"
              :key="key"
              type="button"
              :class="{ 'is-active': activeStory === key }"
              @click="activeStory = key as StoryKey"
            >
              {{ story.label }}
            </button>
          </div>

          <div class="story-shell__content">
            <div class="story-shell__text">
              <h3>{{ activeStoryData.title }}</h3>
              <p>{{ activeStoryData.body }}</p>
              <small>Interactive placeholder. This will use the same selected area as the map later.</small>
            </div>

            <div class="story-placeholder" aria-label="Interactive placeholder chart">
              <div
                v-for="bar in activeStoryData.bars"
                :key="bar.label"
                class="story-placeholder__row"
              >
                <span>{{ bar.label }}</span>
                <div>
                  <i :style="{ width: `${bar.value}%` }" />
                </div>
                <strong>{{ bar.value }}%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="action-section">
        <BrandWatermark />
        <span class="action-section__side">Section 04 - From Awareness To Action</span>

        <div class="action-section__copy">
          <SectionKicker>Use the insight</SectionKicker>
          <h2>Awareness should lead to a next step.</h2>
          <p>
            After someone sees a higher-concern area, Shadeo should help them choose a
            cooler route, check personal readiness, or arrange support.
          </p>
        </div>

        <div class="action-grid">
          <article>
            <span>01</span>
            <h3>Plan a cooler route</h3>
            <p>Use shade, rest stops, distance, and cooler places to compare daily walks.</p>
            <AppButton href="/#navigation" variant="feature">Cool Routes</AppButton>
          </article>

          <article>
            <span>02</span>
            <h3>Check personal risk</h3>
            <p>Combine area conditions with health, home cooling, mobility, and support.</p>
            <AppButton href="/#self-check" variant="feature">Self-Check</AppButton>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.awareness-page {
  min-height: 100vh;
  background: var(--brand-paper-white);
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

.map-explainer {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: -18px 0 clamp(26px, 4vw, 42px);
}

.map-explainer article {
  min-height: 170px;
  padding: clamp(18px, 2.4vw, 26px);
  border: 1px solid var(--brand-line);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.62);
}

.map-explainer span {
  display: block;
  margin-bottom: 10px;
  color: var(--brand-ink);
  font-size: 1rem;
  font-weight: 950;
}

.map-explainer p {
  color: var(--brand-ink-muted);
  font-size: 1.04rem;
  font-weight: 650;
  line-height: 1.5;
}

.map-section__intro :deep(.section-kicker),
.story-section__copy :deep(.section-kicker),
.action-section__copy :deep(.section-kicker) {
  grid-column: 1 / -1;
}

.story-shell {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  gap: 18px;
  padding: clamp(18px, 3vw, 30px);
  border: 1px solid var(--brand-line);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: var(--brand-shadow-panel);
}

.story-shell__tabs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.story-shell__tabs button {
  min-height: 64px;
  padding: 0 20px;
  border: 1.5px solid var(--brand-line);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--brand-ink-muted);
  font-size: 1.05rem;
  font-weight: 900;
  text-align: left;
}

.story-shell__tabs button.is-active {
  border-color: transparent;
  background: var(--brand-lime);
  color: var(--brand-ink);
}

.story-shell__content {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(300px, 1fr);
  gap: clamp(20px, 4vw, 48px);
  align-items: center;
  padding: clamp(18px, 3vw, 28px);
  border-radius: 28px;
  background: rgba(251, 250, 247, 0.74);
}

.story-shell__text h3 {
  max-width: 14ch;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.9rem, 3.2vw, 3rem);
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: 0;
}

.story-shell__text p {
  margin-top: 18px;
  color: var(--brand-ink-muted);
  font-size: 1.125rem;
  font-weight: 650;
  line-height: 1.55;
}

.story-shell__text small {
  display: block;
  margin-top: 18px;
  color: rgba(79, 88, 80, 0.78);
  font-size: 1rem;
  font-weight: 750;
}

.story-placeholder {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.story-placeholder__row {
  display: grid;
  grid-template-columns: minmax(130px, 0.7fr) minmax(160px, 1fr) 54px;
  gap: 14px;
  align-items: center;
}

.story-placeholder__row span,
.story-placeholder__row strong {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 900;
}

.story-placeholder__row div {
  height: 22px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.08);
}

.story-placeholder__row i {
  height: 100%;
  display: block;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand-lime), var(--brand-gold));
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
  gap: 18px;
  padding: clamp(22px, 3vw, 34px);
  border: 1px solid var(--brand-line);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: var(--brand-shadow-panel);
}

.action-grid span {
  color: var(--brand-lime);
  font-size: clamp(2.6rem, 5vw, 4.8rem);
  font-weight: 950;
  line-height: 0.9;
  text-shadow: 0 2px 0 rgba(35, 45, 39, 0.42);
}

.action-grid h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.65rem, 2.4vw, 2.3rem);
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: 0;
}

.action-grid p {
  flex: 1;
  color: var(--brand-ink-muted);
  font-size: 1.08rem;
  font-weight: 650;
  line-height: 1.5;
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

  .story-shell__tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .story-shell__tabs button {
    flex: 1 1 190px;
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

  .story-placeholder__row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .action-grid article {
    min-height: auto;
  }
}
</style>
