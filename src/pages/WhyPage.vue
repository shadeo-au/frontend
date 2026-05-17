<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import HeroFullSection from '../components/HeroFullSection.vue';
import SectionKicker from '../components/SectionKicker.vue';
import BrandWatermark from '../components/BrandWatermark.vue';
import AppFooter from '../components/AppFooter.vue';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/gsap';

const root = ref<HTMLElement | null>(null);
const openReason = ref(-1);
let whyCtx: gsap.Context | undefined;

const formatCount = (value: number) => Math.round(value).toLocaleString('en-AU');

const reasonItems = [
  {
    title: 'Personalised Risk Assessment',
    body: 'Based on age, health conditions, and neighbourhood context, Shadeo gives tailored daily heat risk guidance instead of generic public advice.',
  },
  {
    title: 'Safer Walking Routes',
    body: 'Combines tree canopy coverage, public rest facilities, and toilet locations to help older residents find cooler, safer paths through the city.',
  },
  {
    title: 'Simple, Accessible Interface',
    body: 'Designed for older adults with limited digital confidence, using large text, clear steps, and no technical knowledge requirement.',
  },
  {
    title: 'Local Melbourne Data',
    body: 'Uses Melbourne open data including real-time UV index, temperature, and street shade coverage for genuinely local recommendations.',
  },
];

const toggleReason = (index: number) => {
  openReason.value = openReason.value === index ? -1 : index;
};

const animateCount = (el: HTMLElement) => {
  const target = Number(el.dataset.countTo ?? 0);
  const duration = Number(el.dataset.countDuration ?? 1400) / 1000;
  const counter = { value: 0 };

  gsap.killTweensOf(counter);
  gsap.fromTo(
    counter,
    { value: 0 },
    {
      value: target,
      duration,
      ease: 'expo.out',
      onUpdate: () => {
        el.textContent = formatCount(counter.value);
      },
      onComplete: () => {
        el.textContent = formatCount(target);
      },
    }
  );
};

onMounted(() => {
  whyCtx = gsap.context(() => {
    const riseEls = gsap.utils.toArray<HTMLElement>('[data-rise]');
    const fadeEls = gsap.utils.toArray<HTMLElement>('[data-record-text-fade]');
    const countEls = gsap.utils.toArray<HTMLElement>('[data-count-to]');

    if (prefersReducedMotion()) {
      gsap.set([...riseEls, ...fadeEls], { autoAlpha: 1, y: 0 });
      countEls.forEach((el) => {
        el.textContent = formatCount(Number(el.dataset.countTo ?? 0));
      });
      return;
    }

    riseEls.forEach((el) => {
      const delay = Number.parseFloat(getComputedStyle(el).getPropertyValue('--rise-delay')) || 0;
      gsap.set(el, { autoAlpha: 0, y: 28 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.68, delay: delay / 1000, ease: 'power3.out' }),
      });
    });

    fadeEls.forEach((el) => {
      const reset = () => gsap.set(el, { autoAlpha: 0, y: 34 });
      const play = () => gsap.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' });
      reset();
      ScrollTrigger.create({
        trigger: el,
        start: 'top 82%',
        end: 'bottom 8%',
        onEnter: play,
        onEnterBack: play,
        onLeave: reset,
        onLeaveBack: reset,
      });
    });

    countEls.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 72%',
        onEnter: () => animateCount(el),
        onEnterBack: () => animateCount(el),
      });
    });
  }, root.value ?? undefined);
});

onBeforeUnmount(() => {
  whyCtx?.revert();
});
</script>

<template>
  <div ref="root" class="why-page">
    <AppNav />

    <main>


      <HeroFullSection
        class="why-hero"
        id="why-hero"
        image-src="/why-hero-new.png"
        image-alt="An older woman stands in a warm park beside shaded paths, a health checklist, and a local heat map."
      >
        <h1>Heat hits harder as we age.</h1>
      </HeroFullSection>

      <section id="why-risk" class="risk-story">
        <div class="risk-story__copy" data-record-text-fade>
          <SectionKicker>Why this matters</SectionKicker>
          <h2>
            Extreme heat hits
            <span>older residents harder.</span>
          </h2>
          <p>
            In Melbourne, heat can turn everyday errands into serious health decisions.
            Older adults face higher risk, but most public advice is still too broad to
            help someone decide what is safe today.
          </p>
        </div>

        <div class="risk-stats" aria-label="Extreme heat risk statistics">
          <article class="risk-stat risk-stat--rose">
            <div class="risk-stat__content" data-record-text-fade>
              <span>Heat injuries</span>
              <strong><b data-count-to="78">0</b>%</strong>
              <p>of all extreme weather hospitalisations in Australia are caused by heat</p>
              <small>AIHW 2023 - 10 years, 7,104 cases</small>
            </div>
          </article>

          <article class="risk-stat risk-stat--sage">
            <div class="risk-stat__content" data-record-text-fade>
              <span>Most at risk</span>
              <strong><b data-count-to="1">0</b> in <b data-count-to="3">0</b></strong>
              <p>heat-related hospital patients are aged 65 and over</p>
              <small>AIHW Australia's Health 2024</small>
            </div>
          </article>

          <article class="risk-stat risk-stat--sky">
            <div class="risk-stat__content" data-record-text-fade>
              <span>Victoria deaths</span>
              <strong><b data-count-to="374">0</b> / <b data-count-to="167">0</b></strong>
              <p>excess deaths in the 2009 and 2014 Melbourne heatwaves</p>
              <small>Victoria CHO Reports</small>
            </div>
          </article>
        </div>
      </section>

      <section id="melbourne-record" class="record-section" aria-labelledby="melbourne-record-title">
        <article class="record-panel record-panel--gold">
          <div class="record-panel__inner record-panel__inner--intro" data-record-text-fade>
            <SectionKicker>Melbourne on record</SectionKicker>
            <h2 id="melbourne-record-title">
              This isn't hypothetical.
              <span>It's already happened.</span>
            </h2>
            <p>
              In January 2014, Victoria endured its hottest-ever four consecutive days,
              with Melbourne temperatures above 41&deg;C for four days straight.
              Emergency departments treated 621 heat-related patients that week,
              five times the expected number.
            </p>
          </div>
        </article>

        <article class="record-panel record-panel--sage">
          <div class="record-panel__inner record-panel__inner--event" data-record-text-fade>
            <span class="record-year">2009</span>
            <div>
              <strong>374</strong>
              <h3>Excess deaths - Victoria</h3>
              <p>
                Three consecutive days above 43&deg;C, peaking at 45.1&deg;C.
                Ambulance call-outs surged by 45%.
              </p>
              <small>Source: Victorian Chief Health Officer Report</small>
            </div>
          </div>
        </article>

        <article class="record-panel record-panel--sky">
          <div class="record-panel__inner record-panel__inner--event" data-record-text-fade>
            <span class="record-year">2014</span>
            <div>
              <strong>167</strong>
              <h3>Excess deaths - Victoria</h3>
              <p>
                621 ED presentations (expected: 105). Ambulance call-outs up 25%.
                Historic four-day heat record broken.
              </p>
              <small>Source: Victorian CHO Report / AIHW Heat Wave Surveillance System</small>
            </div>
          </div>
        </article>
      </section>

      <section id="why-shadeo" class="why-shadeo">
        <div class="why-shadeo__inner" data-record-text-fade>
          <SectionKicker>Why Shadeo</SectionKicker>
          <h2>
            <span class="why-shadeo__title-line">A heat decision tool designed</span>
            <span class="why-shadeo__title-line">
              <em>specifically</em>
              for Melbourne's older residents
            </span>
          </h2>

          <div class="why-accordion">
            <article
              v-for="(item, index) in reasonItems"
              :key="item.title"
              class="why-accordion__item"
              :class="{ 'is-open': openReason === index }"
            >
              <button
                class="why-accordion__trigger"
                type="button"
                :aria-expanded="openReason === index"
                :aria-controls="`why-reason-${index}`"
                @click="toggleReason(index)"
              >
                <span>{{ item.title }}</span>
                <b aria-hidden="true">{{ openReason === index ? '-' : '+' }}</b>
              </button>

              <div
                v-show="openReason === index"
                :id="`why-reason-${index}`"
                class="why-accordion__body"
              >
                <p>{{ item.body }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>


      <section id="why-features" class="ws-wide ws-wide--resources">
        <BrandWatermark />

        <div class="ws-wide__inner">
          <div class="ws-section-head ws-section-head--narrow" data-record-text-fade>
            <SectionKicker>Three tools</SectionKicker>
            <h2>How <span>Shadeo</span> helps</h2>
            <p class="ws-lead">
              Three connected tools support safer, cooler, and more confident daily decisions.
            </p>
          </div>

          <div class="ws-feature-grid">
            <!-- Feature 1 -->
            <div class="ws-feature-panel" data-record-text-fade>
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/route-icon.png" alt="" class="ws-feature-icon" />
              </div>
              <span class="ws-feature-panel__eyebrow">Walk planner</span>
              <h3>Cooler daily routes</h3>
              <p>
                Compare nearby essential destinations and route comfort using walking distance,
                shade, benches, toilets, water, and slope-related support.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/walk-planner" variant="feature">SEE ROUTE CONCEPT</AppButton>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="ws-feature-panel" data-record-text-fade>
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/awareness.png" alt="" class="ws-feature-icon" />
              </div>
              <span class="ws-feature-panel__eyebrow">Awareness</span>
              <h3>Heat vulnerability awareness</h3>
              <p>
                Show how local heat pressure, tree cover, older residents, and nearby support
                can affect where extra care may be needed.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/awareness" variant="feature">VIEW AWARENESS MAP</AppButton>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="ws-feature-panel" data-record-text-fade>
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/check-icon.png" alt="" class="ws-feature-icon" />
              </div>
              <span class="ws-feature-panel__eyebrow">Self-check</span>
              <h3>Personal risk self-check</h3>
              <p>
                Help users reflect on local heat exposure, personal sensitivity, home cooling,
                mobility, and check-in support in a non-medical way.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/self-check" variant="feature">START SELF-CHECK</AppButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter>
        <p><strong>References</strong></p>
        <ul>
          <li>AIHW (2023). Let's talk about the weather: injuries related to extreme weather. aihw.gov.au</li>
          <li>AIHW (2024). Australia's Health 2024: Extreme weather related injuries. aihw.gov.au</li>
          <li>Department of Health, Victoria (2024). Research and reports — extreme heat and heatwaves. health.vic.gov.au</li>
          <li>Department of Health, Victoria (2026). Increased heat-related health risks — Health Advisory #260127. health.vic.gov.au</li>
          <li>eSafety Commissioner (2018). Digital behaviours of older Australians: digital confidence. esafety.gov.au</li>
        </ul>
      </AppFooter>


    </main>
  </div>
</template>

<style scoped>

.why-page {
  min-height: 100vh;
  color: var(--brand-ink);
  background: var(--brand-paper-white);
}

/* Footer styles now live in the shared AppFooter.vue component. */


.why-hero {
  align-items: center;
  justify-content: flex-end;
  padding:
    var(--nav-h)
    max(var(--gutter), calc((100vw - 1280px) / 2))
    0;
}

.why-hero :deep(.hero-full__art img) {
  object-position: center center;
}

.why-hero :deep(.hero-full__veil) {
  background:
    radial-gradient(ellipse at 66% 50%, rgba(251, 250, 247, 0.94) 0%, rgba(251, 250, 247, 0.78) 20%, rgba(251, 250, 247, 0.42) 38%, rgba(251, 250, 247, 0.12) 56%, transparent 72%);
}

.why-hero :deep(.hero-full__copy) {
  width: min(100%, 980px);
  margin-left: auto;
  margin-right: auto;
  padding: clamp(24px, 4vw, 54px) 0;
  text-align: center;
}

.why-hero :deep(h1) {
  color: #ffffff;
  font-family: var(--font-body);
  font-size: var(--brand-fs-hero);
  font-weight: 950;
  line-height: 1.04;
  letter-spacing: 0;
  text-wrap: balance;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.28);
}


[data-rise] {
  opacity: 0;
  transform: translateY(28px);
  will-change: opacity, transform;
}
[data-rise].is-in {
  opacity: 1;
  transform: translateY(0);
}

[data-record-text-fade] {
  opacity: 0;
  transform: translateY(34px);
  will-change: opacity, transform;
}

[data-record-text-fade].is-in {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  [data-rise],
  [data-record-text-fade] { opacity: 1; transform: none; transition: none; }
}


.risk-story {
  min-height: min(1040px, calc(100vh + 120px));
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(80px, 9vw, 150px);
  padding:
    clamp(72px, 7.2vw, 112px)
    max(var(--gutter), calc((100vw - 1280px) / 2))
    0;
  background:
    radial-gradient(circle at 78% 18%, rgba(239, 166, 43, 0.24), transparent 20%),
    linear-gradient(90deg, rgba(251, 250, 247, 0.98) 0%, rgba(251, 250, 247, 0.88) 28%, rgba(251, 250, 247, 0.42) 58%, rgba(251, 250, 247, 0.02) 100%),
    linear-gradient(180deg, rgba(251, 250, 247, 0.1) 0%, rgba(248, 241, 227, 0.42) 100%),
    url('/why-heat-risk-bg.png') center / cover no-repeat;
}

.risk-story::before {
  content: "SHADEO";
  position: absolute;
  z-index: -1;
  top: clamp(22px, 4vw, 56px);
  left: max(20px, calc((100vw - 1280px) / 2));
  color: var(--brand-watermark);
  font-size: clamp(7rem, 18vw, 19rem);
  font-weight: 950;
  line-height: 0.78;
  letter-spacing: 0;
  pointer-events: none;
  white-space: nowrap;
}

.risk-story__copy {
  width: min(100%, 560px);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.risk-story__copy :deep(.section-kicker) {
  margin-bottom: clamp(18px, 2vw, 30px);
}

.risk-story__copy h2 {
  margin: 0;
  color: var(--brand-ink-soft);
  font-family: var(--font-editorial);
  font-size: clamp(2.85rem, 4.35vw, 4.75rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: balance;
}

.risk-story__copy h2 span {
  display: block;
  margin-top: 0.08em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.22em;
  font-weight: 700;
  line-height: 0.76;
  transform: rotate(-1.5deg);
  transform-origin: left center;
}

.risk-story__copy p {
  max-width: 43ch;
  margin: clamp(24px, 2.4vw, 34px) 0 0;
  color: var(--brand-ink-muted);
  font-size: clamp(1.125rem, 1.18vw, 1.28rem);
  font-weight: 600;
  line-height: 1.68;
}

.risk-stats {
  width: 100vw;
  margin-inline: calc(-1 * max(var(--gutter), calc((100vw - 1280px) / 2)));
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-inline: 0;
  padding-bottom: 0;
}

.risk-stat {
  min-height: clamp(176px, 15vw, 232px);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: clamp(22px, 2.8vw, 42px) clamp(20px, 2.8vw, 46px);
  border: 0;
  border-radius: 0;
  background: var(--stat-bg);
  box-shadow: 0 22px 58px -42px rgba(35, 45, 39, 0.34);
  text-align: center;
}

.risk-stat__content {
  min-height: inherit;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.risk-stat span {
  order: 2;
  margin-top: -4px;
  color: var(--brand-ink-soft);
  font-family: var(--font-editorial);
  font-size: clamp(1.1rem, 1.25vw, 1.45rem);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.12;
  text-transform: none;
}

.risk-stat strong {
  order: 1;
  color: var(--stat-ink);
  font-family: var(--font-script);
  font-size: clamp(4.35rem, 6.2vw, 7.9rem);
  font-weight: 700;
  line-height: 0.82;
  letter-spacing: 0;
  transform: rotate(-1deg);
}

.risk-stat strong b {
  min-width: var(--count-width, 1ch);
  display: inline-block;
  font: inherit;
  text-align: center;
}

.risk-stat strong b[data-count-to="78"] {
  --count-width: 2ch;
}

.risk-stat strong b[data-count-to="167"],
.risk-stat strong b[data-count-to="374"] {
  --count-width: 3ch;
}

.risk-stat p {
  order: 3;
  max-width: 27ch;
  margin: 2px auto 0;
  color: rgba(35, 45, 39, 0.76);
  font-size: clamp(1rem, 1.04vw, 1.12rem);
  font-weight: 600;
  line-height: 1.28;
}

.risk-stat small {
  order: 4;
  margin-top: 8px;
  color: rgba(35, 45, 39, 0.5);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;
}

.risk-stat--rose {
  --stat-bg: linear-gradient(135deg, rgba(239, 166, 43, 0.78), rgba(246, 213, 151, 0.88));
  --stat-ink: #7a5521;
}

.risk-stat--sage {
  --stat-bg: linear-gradient(135deg, rgba(205, 217, 188, 0.94), rgba(226, 226, 194, 0.9));
  --stat-ink: #49613f;
}

.risk-stat--sky {
  --stat-bg: linear-gradient(135deg, rgba(168, 212, 226, 0.94), rgba(181, 198, 226, 0.88));
  --stat-ink: #31475c;
}


.record-section {
  position: relative;
  overflow: hidden;
  background: var(--brand-paper-white);
}

.record-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding:
    clamp(68px, 7vw, 108px)
    max(var(--gutter), calc((100vw - 1280px) / 2));
}

.record-panel--gold {
  background:
    radial-gradient(circle at 78% 14%, rgba(155, 224, 111, 0.08), transparent 28%),
    linear-gradient(135deg, var(--brand-paper-white), rgba(251, 246, 235, 0.92));
}

.record-panel--sage {
  background:
    radial-gradient(circle at 82% 50%, rgba(255, 255, 255, 0.44), transparent 30%),
    linear-gradient(135deg, rgba(228, 248, 213, 0.9), rgba(155, 224, 111, 0.42));
}

.record-panel--sky {
  background:
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.42), transparent 30%),
    linear-gradient(135deg, rgba(168, 212, 226, 0.88), rgba(181, 198, 226, 0.58));
}

.record-panel__inner {
  position: relative;
  z-index: 1;
  max-width: 1120px;
}

.record-panel__inner--intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(28px, 4vw, 56px);
  text-align: center;
}

.record-panel__inner--intro :deep(.section-kicker) {
  margin: 0;
}

.record-panel__inner--intro h2 {
  max-width: 980px;
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.85rem, 4.5vw, 5rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: 0;
}

.record-panel__inner--intro h2 span {
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.08em;
  font-weight: 700;
  line-height: 0.82;
}

.record-panel__inner--intro p {
  max-width: 76ch;
  margin: 0;
  padding: 0;
  color: #263e4a;
  font-size: clamp(1.14rem, 1.26vw, 1.32rem);
  font-weight: 600;
  line-height: 1.68;
}

.record-panel__inner--event {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: clamp(26px, 4vw, 58px);
  align-items: start;
}

.record-year {
  display: block;
  padding-top: 12px;
  border-top: 1px solid rgba(35, 45, 39, 0.18);
  color: var(--brand-ink-muted);
  font-family: var(--font-editorial);
  font-size: clamp(1.15rem, 1.4vw, 1.45rem);
  font-weight: 600;
  line-height: 1;
}

.record-panel__inner--event > div {
  max-width: 880px;
  padding-left: clamp(24px, 3vw, 42px);
  border-left: 1px solid rgba(35, 45, 39, 0.14);
}

.record-panel__inner--event strong {
  display: block;
  color: #2f5c3b;
  font-family: var(--font-script);
  font-size: clamp(4rem, 5.8vw, 6.8rem);
  font-weight: 700;
  line-height: 0.88;
  transform: rotate(-1deg);
}

.record-panel__inner--event h3 {
  margin: 8px 0 18px;
  color: var(--shade-deep);
  font-family: var(--font-body);
  font-size: clamp(1.1rem, 1.25vw, 1.32rem);
  font-weight: 850;
  line-height: 1.2;
}

.record-panel__inner--event p {
  max-width: 76ch;
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: clamp(1.05rem, 1.16vw, 1.22rem);
  font-weight: 600;
  line-height: 1.58;
}

.record-panel__inner--event small {
  display: block;
  margin-top: 18px;
  color: rgba(79, 88, 80, 0.6);
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.4;
}


.why-shadeo {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding:
    clamp(82px, 9vw, 132px)
    max(var(--gutter), calc((100vw - 1180px) / 2));
  background:
    radial-gradient(circle at 84% 18%, rgba(155, 224, 111, 0.14), transparent 28%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, rgba(248, 241, 227, 0.62) 100%);
}

.why-shadeo::before {
  content: "SHADEO";
  position: absolute;
  top: clamp(24px, 5vw, 74px);
  left: 50%;
  color: var(--brand-watermark);
  font-size: clamp(7rem, 18vw, 18rem);
  font-weight: 950;
  line-height: 0.78;
  letter-spacing: 0;
  pointer-events: none;
  transform: translateX(-50%);
  white-space: nowrap;
}

.why-shadeo__inner {
  position: relative;
  z-index: 1;
  max-width: 960px;
  width: min(100%, 960px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.why-shadeo h2 {
  width: min(100%, 1180px);
  max-width: 1180px;
  margin: clamp(18px, 2vw, 28px) 0 clamp(42px, 5vw, 72px);
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.3rem, 3.6vw, 4rem);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: 0;
  text-wrap: balance;
}

.why-shadeo__title-line {
  display: block;
  white-space: nowrap;
}

.why-shadeo__title-line:nth-child(2) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.18em;
}

.why-shadeo h2 em {
  display: inline-block;
  margin-inline: 0;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.14em;
  font-weight: 700;
  font-style: normal;
  line-height: 0.82;
  transform: translateY(0.04em) rotate(-1.5deg);
  transform-origin: left center;
}

.why-accordion {
  width: min(100%, 760px);
  max-width: 760px;
  text-align: left;
}

.why-accordion__item {
  border-top: 1px solid rgba(35, 45, 39, 0.18);
}

.why-accordion__item:first-child {
  border-top: 0;
}

.why-accordion__trigger {
  width: 100%;
  min-height: 84px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--brand-ink-soft);
  font-family: var(--font-editorial);
  font-size: clamp(1.42rem, 1.7vw, 1.82rem);
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
}

.why-accordion__trigger b {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--shade-deep);
  color: #ffffff;
  font-family: var(--font-body);
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
}

.why-accordion__trigger:hover,
.why-accordion__trigger:focus-visible {
  color: var(--shade-deep);
}

.why-accordion__trigger:focus-visible {
  outline: 3px solid rgba(98, 133, 107, 0.32);
  outline-offset: 6px;
}

.why-accordion__body {
  padding: 0 54px 28px 0;
  text-align: left;
}

.why-accordion__body p {
  max-width: 64ch;
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: clamp(1.16rem, 1.24vw, 1.32rem);
  font-weight: 550;
  line-height: 1.68;
}

.why-accordion__item.is-open .why-accordion__trigger {
  color: var(--shade-deep);
}



.ws-wide {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding:
    clamp(72px, 9vw, 120px)
    max(var(--gutter), calc((100vw - 1180px) / 2));
}

.ws-wide--resources {
  background:
    radial-gradient(circle at 88% 24%, rgba(239, 166, 43, 0.42), transparent 24%),
    radial-gradient(circle at 18% 26%, rgba(168, 212, 226, 0.58), transparent 30%),
    radial-gradient(circle at 74% 74%, rgba(155, 224, 111, 0.42), transparent 30%),
    linear-gradient(135deg, rgba(168, 212, 226, 0.46), rgba(228, 248, 213, 0.62) 48%, rgba(246, 213, 151, 0.5));
}

.ws-wide--resources::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(251, 250, 247, 0.08), rgba(251, 250, 247, 0.4) 48%, rgba(251, 250, 247, 0.1)),
    radial-gradient(circle at 50% 50%, transparent 0 34%, rgba(35, 45, 39, 0.08) 100%);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.ws-wide__inner {
  display: flex;
  flex-direction: column;
  gap: clamp(44px, 5.5vw, 76px);
}


.ws-section-head {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 640px;
}

.ws-section-head--narrow {
  max-width: 560px;
}

.ws-section-head h2 {
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.65rem, 4.4vw, 5rem);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: 0;
  text-wrap: balance;
}

.ws-section-head h2 span {
  display: inline-block;
  margin-inline: 0.05em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.12em;
  font-weight: 700;
  line-height: 0.82;
  transform: translateY(0.04em) rotate(-1.5deg);
  transform-origin: left center;
}

.ws-lead {
  max-width: 44ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.16rem, 1.24vw, 1.32rem);
  font-weight: 650;
  line-height: 1.62;
  margin: 0;
}


.ws-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(18px, 2vw, 28px);
  align-items: stretch;
}

.ws-feature-panel {
  min-height: 420px;
  padding: 0;
  border-radius: 0;
  border: 0;
  background:
    linear-gradient(
      180deg,
      #ffffff 0 210px,
      rgba(255, 255, 255, 0.96) 232px,
      rgba(251, 250, 247, 0.92) 272px,
      rgba(244, 250, 237, 0.9) 100%
    );
  box-shadow: 0 28px 78px -54px rgba(35, 45, 39, 0.48);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ws-feature-panel__visual {
  height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.ws-feature-icon {
  width: auto;
  height: 72%;
  max-width: 100%;
  display: block;
}

.ws-feature-panel__eyebrow {
  display: block;
  margin: clamp(20px, 2.2vw, 28px) clamp(22px, 2.4vw, 30px) 8px;
  color: var(--brand-ink-muted);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.ws-feature-panel h3 {
  margin: 0 clamp(22px, 2.4vw, 30px);
  color: var(--brand-ink-soft);
  font-family: var(--font-editorial);
  font-size: clamp(1.45rem, 1.65vw, 1.8rem);
  font-weight: 650;
  line-height: 1.18;
}

.ws-feature-panel p {
  margin: 12px clamp(22px, 2.4vw, 30px) 0;
  flex: 1;
  color: var(--brand-ink-muted);
  font-size: clamp(1rem, 1.04vw, 1.12rem);
  font-weight: 550;
  line-height: 1.58;
}

.ws-feature-panel__action {
  padding: 22px clamp(22px, 2.4vw, 30px) clamp(22px, 2.4vw, 30px);
}


@media (max-width: 980px) {
  .why-hero {
    justify-content: flex-start;
    padding: calc(var(--nav-h) + 44px) var(--gutter) 34px;
  }

  .why-hero :deep(.hero-full__copy) {
    width: min(100%, 680px);
    margin-left: auto;
    margin-right: auto;
    padding: 0;
    text-align: center;
  }

  .why-hero :deep(.hero-full__art img) {
    object-fit: cover;
    object-position: center center;
  }

  .why-hero :deep(h1) {
    font-size: clamp(2.85rem, 11vw, 5.25rem);
    color: var(--brand-ink);
    text-shadow: none;
  }

  .risk-story {
    min-height: auto;
    background:
      linear-gradient(180deg, rgba(251, 250, 247, 0.96) 0%, rgba(251, 250, 247, 0.84) 48%, rgba(248, 241, 227, 0.72) 100%),
      url('/why-heat-risk-bg.png') 62% center / cover no-repeat;
  }

  .risk-story__copy {
    max-width: 620px;
  }

  .risk-story__copy h2 {
    font-size: clamp(2.4rem, 7vw, 4rem);
  }

  .risk-stats {
    width: 100%;
    margin-inline: 0;
    grid-template-columns: 1fr;
    max-width: 620px;
    padding-inline: 0;
    padding-bottom: clamp(28px, 5vw, 44px);
  }

  .risk-stat {
    border-radius: 18px;
  }

  .record-panel__inner--intro,
  .record-panel__inner--event {
    grid-template-columns: 1fr;
  }

  .record-panel__inner--event {
    gap: 18px;
  }

  .record-panel__inner--event > div {
    padding-left: 0;
    border-left: 0;
  }

  .record-year {
    width: fit-content;
    min-width: 120px;
  }

  .why-shadeo__inner,
  .why-accordion {
    max-width: 100%;
  }

  .ws-feature-grid { grid-template-columns: 1fr; }

  .ws-feature-panel {
    min-height: 0;
  }

  .ws-section-head h2 {
    font-size: clamp(2.4rem, 7vw, 4rem);
  }
}

@media (min-width: 981px) and (max-width: 1180px) {
  .ws-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ws-feature-panel {
    min-height: 440px;
  }
}

@media (max-width: 640px) {
  .why-hero {
    padding-inline: var(--gutter);
    padding-bottom: 28px;
  }

  .why-hero :deep(.hero-full__copy) {
    text-align: center;
  }

  .why-hero :deep(h1) {
    font-size: clamp(2.5rem, 12vw, 3.8rem);
    line-height: 1.06;
  }

  .risk-story {
    gap: 36px;
    padding:
      56px
      var(--gutter)
      38px;
    background:
      linear-gradient(180deg, rgba(251, 250, 247, 0.98) 0%, rgba(251, 250, 247, 0.9) 58%, rgba(248, 241, 227, 0.72) 100%),
      url('/why-heat-risk-bg.png') 70% center / cover no-repeat;
  }

  .risk-story__copy {
    gap: 14px;
  }

  .risk-story__copy h2 {
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }

  .risk-stat {
    min-height: 0;
    padding: 20px;
  }

  .record-panel {
    padding:
      clamp(50px, 12vw, 68px)
      var(--gutter);
  }

  .record-panel__inner--intro h2 {
    font-size: clamp(2.3rem, 10vw, 3.4rem);
  }

  .record-panel__inner--intro p {
    padding: 0;
    font-size: clamp(1.05rem, 4.3vw, 1.18rem);
  }

  .record-panel__inner--event strong {
    font-size: clamp(3rem, 14vw, 4.5rem);
  }

  .record-panel__inner--event p {
    font-size: clamp(1rem, 4vw, 1.12rem);
  }

  .why-shadeo {
    padding:
      clamp(58px, 14vw, 82px)
      var(--gutter);
  }

  .why-shadeo h2 {
    font-size: clamp(2.25rem, 9vw, 3.35rem);
    line-height: 1.1;
  }

  .why-shadeo__title-line {
    white-space: normal;
  }

  .why-shadeo__title-line:nth-child(2) {
    display: block;
  }

  .why-accordion__trigger {
    min-height: 74px;
    gap: 18px;
    font-size: clamp(1.24rem, 5vw, 1.5rem);
  }

  .why-accordion__body {
    padding: 0 0 24px;
  }

  .ws-wide {
    padding-inline: var(--gutter);
  }

  .ws-section-head h2 {
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }
}
</style>
