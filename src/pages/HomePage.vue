<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import HeroBlendSection from '../components/HeroBlendSection.vue';
import PageSection from '../components/PageSection.vue';
import SectionKicker from '../components/SectionKicker.vue';
import VisualPanel from '../components/VisualPanel.vue';

const root = ref<HTMLElement | null>(null);
let cleanupSectionScroller: (() => void) | undefined;
let cleanupScrollFade: (() => void) | undefined;

const sectionIds = ['hero', 'intro', 'navigation', 'awareness', 'self-check'];

const easeInOutCubic = (t: number) => (
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
);

const getNearestSectionIndex = () => {
  const viewportMiddle = window.scrollY + window.innerHeight / 2;
  let nearest = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  sectionIds.forEach((id, index) => {
    const el = document.getElementById(id);
    if (!el) return;

    const sectionMiddle = el.offsetTop + el.offsetHeight / 2;
    const distance = Math.abs(sectionMiddle - viewportMiddle);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  });

  return nearest;
};

const setupSectionScroller = () => {
  const canUseControlledScroll = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canUseControlledScroll) return undefined;

  let currentIndex = getNearestSectionIndex();
  let isAnimating = false;
  let animationFrame = 0;
  let wheelRemainder = 0;
  let suppressWheelUntil = 0;

  const animateTo = (targetIndex: number) => {
    const target = document.getElementById(sectionIds[targetIndex]);
    if (!target || targetIndex === currentIndex) return;

    window.cancelAnimationFrame(animationFrame);
    isAnimating = true;
    currentIndex = targetIndex;

    const start = window.scrollY;
    const end = target.offsetTop;
    const distance = end - start;
    const duration = Math.min(920, Math.max(620, Math.abs(distance) * 0.42));
    const startedAt = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(frame);
      } else {
        isAnimating = false;
        wheelRemainder = 0;
        suppressWheelUntil = performance.now() + 180;
      }
    };

    animationFrame = window.requestAnimationFrame(frame);
  };

  const onWheel = (event: WheelEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [data-native-scroll]')) return;
    if (event.ctrlKey) return;

    event.preventDefault();
    if (isAnimating || performance.now() < suppressWheelUntil) {
      wheelRemainder = 0;
      return;
    }

    wheelRemainder += event.deltaY;
    if (Math.abs(wheelRemainder) < 42) return;

    currentIndex = getNearestSectionIndex();
    const direction = wheelRemainder > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(sectionIds.length - 1, currentIndex + direction));
    wheelRemainder = 0;
    animateTo(nextIndex);
  };

  const onKeydown = (event: KeyboardEvent) => {
    const keys = ['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key) || isAnimating) return;

    currentIndex = getNearestSectionIndex();
    let nextIndex = currentIndex;

    if (event.key === 'PageDown' || event.key === 'ArrowDown') nextIndex += 1;
    if (event.key === 'PageUp' || event.key === 'ArrowUp') nextIndex -= 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = sectionIds.length - 1;

    nextIndex = Math.max(0, Math.min(sectionIds.length - 1, nextIndex));
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    animateTo(nextIndex);
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeydown);

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeydown);
  };
};

onMounted(() => {
  const fadeEls = root.value?.querySelectorAll('[data-scroll-fade]') ?? [];
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
      } else {
        entry.target.classList.remove('is-in');
      }
    });
  }, {
    rootMargin: '-12% 0px -12% 0px',
    threshold: 0.18,
  });

  fadeEls.forEach((el) => fadeObserver.observe(el));
  cleanupScrollFade = () => fadeObserver.disconnect();
  cleanupSectionScroller = setupSectionScroller();
});

onBeforeUnmount(() => {
  cleanupScrollFade?.();
  cleanupSectionScroller?.();
});
</script>

<template>
  <div ref="root" class="home">
    <AppNav />

    <main>
      <HeroBlendSection
        id="hero"
        image-src="/herosection.png"
      >
        <h1>
          Helping seniors
          <span class="home-script">stay cool</span>
          outdoors.
        </h1>
        <p>
          Shadeo helps older adults and carers understand heat risk, find cooler places,
          and make safer walking decisions before the day gets too hot.
        </p>
        <a class="hero-cue" href="#intro" aria-label="How Shadeo works">
          <span></span>
          <strong>HOW SHADEO WORKS</strong>
          <i aria-hidden="true">
            <b></b>
            <b></b>
            <b></b>
          </i>
        </a>
      </HeroBlendSection>

      <section id="intro" class="why-overview" >
        <div class="why-overview__scene why-overview__scene--left" data-scroll-fade style="--fade-delay: 260ms" aria-hidden="true">
          <img src="/home-intro-scenes.png" alt="" />
        </div>

        <div class="why-overview__copy">
          <SectionKicker data-scroll-fade>The problem we address</SectionKicker>
          <h2 data-scroll-fade style="--fade-delay: 120ms">
            Hot days can make
            <span class="home-script home-script--inline">daily life</span>
            harder.
          </h2>
          <p data-scroll-fade style="--fade-delay: 240ms">
            Shadeo helps older adults find cooler ways to go out, understand local heat,
            check personal risk, and stay connected before the day gets too hot.
          </p>
          <div class="section-actions" data-scroll-fade style="--fade-delay: 360ms">
            <a class="text-link-cta" href="/why">WHY SHADEO</a>
          </div>
        </div>

        <div class="why-overview__scene why-overview__scene--right" data-scroll-fade style="--fade-delay: 340ms" aria-hidden="true">
          <img src="/home-intro-scenes.png" alt="" />
        </div>
      </section>

      <PageSection id="navigation" tone="lime" side-label="Section 02 - Walk Planner">
        <template #copy>
          <SectionKicker data-scroll-fade style="--fade-delay: 0ms">Cool routes for daily needs</SectionKicker>
          <h2 data-scroll-fade style="--fade-delay: 120ms">
            Find a nearby place, then choose the
            <span class="home-script home-script--inline">safer walk</span>.
          </h2>
          <p data-scroll-fade style="--fade-delay: 240ms">
            Pick a daily type such as groceries, cafe, library, or pharmacy. Shadeo can
            suggest up to five nearby destinations, compare short routes, and score each
            route using distance, shade cover, and rest facilities.
          </p>
          <div class="section-actions" data-scroll-fade style="--fade-delay: 360ms">
            <AppButton href="/walk-planner" variant="feature">OPEN WALK PLANNER</AppButton>
          </div>
        </template>

        <template #visual>
          <VisualPanel tone="paper" class="video-visual">
            <video src="/final.mp4" autoplay muted loop playsinline preload="metadata" />
          </VisualPanel>
        </template>
      </PageSection>

      <PageSection id="awareness" tone="warm" side-label="Section 03 - Awareness" align="right">
        <template #copy>
          <SectionKicker data-scroll-fade style="--fade-delay: 0ms">Heat Vulnerability Index</SectionKicker>
          <h2 data-scroll-fade style="--fade-delay: 120ms">
            Show where
            <span class="home-script home-script--inline">hot days</span>
            may be harder.
          </h2>
          <p data-scroll-fade style="--fade-delay: 240ms">
            Shadeo visualises where high heat, fewer trees, fewer cooling facilities,
            older residents, and limited support may overlap. It helps people see who may
            need more care before a hot day becomes risky.
          </p>
          <div class="section-actions" data-scroll-fade style="--fade-delay: 360ms">
            <a class="text-link-cta" href="/awareness">VIEW AWARENESS MAP</a>
          </div>
        </template>

        <template #visual>
          <VisualPanel tone="paper" class="video-visual">
            <video src="/Visualization.mp4" autoplay muted loop playsinline preload="metadata" />
          </VisualPanel>
        </template>
      </PageSection>

      <PageSection id="self-check" tone="lime" side-label="Section 04 - Self-check">
        <template #copy>
          <SectionKicker data-scroll-fade style="--fade-delay: 0ms">Heat vulnerability self-check</SectionKicker>
          <h2 data-scroll-fade style="--fade-delay: 120ms">
            A
            <span class="home-script home-script--inline">short check</span>
            for heat risk and support.
          </h2>
          <p data-scroll-fade style="--fade-delay: 240ms">
            The self-check looks at personal sensitivity, local exposure, home cooling,
            mobility, and whether someone can check in. The result stays non-medical and
            practical.
          </p>
          <div class="section-actions" data-scroll-fade style="--fade-delay: 360ms">
            <AppButton href="/self-check" variant="feature">START SELF-CHECK</AppButton>
          </div>
        </template>

        <template #visual>
          <VisualPanel class="selfcheck-visual">
            <div class="check-panel">
              <div class="check-panel__top">
                <span>60-second check</span>
                <b>Preview</b>
              </div>
              <h3>Today's heat risk</h3>
              <div class="risk-meter" aria-hidden="true"><i /></div>
              <p>What we'll ask you:</p>
              <ul>
                <li>Outside longer than 30 minutes?</li>
                <li>Dizzy, weak, or nauseous?</li>
                <li>Shade and water nearby?</li>
              </ul>
              <strong>Moderate risk</strong>
            </div>
          </VisualPanel>
        </template>
      </PageSection>

      <footer class="home-footer">
        <div class="home-footer__inner">
          <p class="home-footer__safety">
            <strong>Safety:</strong> Shadeo supports planning and awareness only. It does not replace
            medical advice. If you feel dizzy, confused, weak, very thirsty, or unwell during hot
            weather, seek medical help. In an emergency, call <strong>000</strong>.
          </p>
          <p>
            <strong>Data sources:</strong> Shadeo uses publicly available heat-health guidance,
            Melbourne open data, and local map layers for shade, rest facilities, and community
            services where available.
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 22% -8%, rgba(155, 224, 111, 0.14), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.home-footer {
  background: var(--brand-ink-soft);
  color: var(--brand-paper);
  padding: clamp(40px, 6vw, 72px) 0;
}

.home-footer__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.home-footer p {
  max-width: 88ch;
  color: rgba(248, 241, 227, 0.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
}

.home-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}

.home-footer__safety {
  padding: 18px 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.18);
}

.hero-cue {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
  color: var(--shade-deep);
  font-size: clamp(0.95rem, 1vw, 1.05rem);
  font-weight: 850;
  letter-spacing: 0.02em;
}

.hero-cue span {
  width: 44px;
  height: 1px;
  background: linear-gradient(90deg, var(--brand-lime-hover), rgba(98, 133, 107, 0.35));
  transform-origin: left center;
  animation: cue-line 2.4s var(--ease-in-out) infinite;
}

.hero-cue strong {
  font: inherit;
}

.hero-cue i {
  width: 16px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  gap: 1px;
  color: currentColor;
  font-style: normal;
  line-height: 1;
}

.hero-cue i b {
  width: 9px;
  height: 9px;
  display: block;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  opacity: 0.45;
  animation: cue-chevron 1.45s var(--ease-in-out) infinite;
}

.hero-cue i b:nth-child(2) {
  animation-delay: 140ms;
}

.hero-cue i b:nth-child(3) {
  animation-delay: 280ms;
}

.hero-cue:hover,
.hero-cue:focus-visible {
  color: var(--brand-gold);
}

.hero-cue:hover span,
.hero-cue:focus-visible span {
  background: linear-gradient(90deg, var(--brand-gold), var(--brand-lime-hover));
}

@keyframes cue-line {
  0%, 100% {
    transform: scaleX(0.72);
    opacity: 0.66;
  }
  50% {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes cue-chevron {
  0%, 100% {
    opacity: 0.32;
    transform: translateY(-2px) rotate(45deg);
  }
  50% {
    opacity: 1;
    transform: translateY(3px) rotate(45deg);
  }
}

.why-overview {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  place-items: center;
  padding: calc(var(--nav-h) + 46px) max(var(--gutter), calc((100vw - 1280px) / 2)) 56px;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(251, 250, 247, 0.96) 0%, rgba(251, 250, 247, 0.82) 30%, transparent 56%),
    linear-gradient(90deg, rgba(168, 212, 226, 0.44), rgba(228, 248, 213, 0.32) 34%, rgba(251, 250, 247, 0.92) 50%, rgba(228, 248, 213, 0.28) 66%, rgba(168, 212, 226, 0.36)),
    var(--brand-paper-white);
}

.why-overview::before {
  content: "SHADEO";
  position: absolute;
  z-index: 0;
  top: clamp(24px, 5vw, 70px);
  left: max(24px, calc((100vw - 1280px) / 2));
  color: var(--brand-watermark);
  font-size: clamp(7rem, 20vw, 21rem);
  font-weight: 950;
  line-height: 0.78;
  letter-spacing: -0.06em;
  pointer-events: none;
  white-space: nowrap;
}

.why-overview > * {
  position: relative;
  z-index: 1;
}

.why-overview__copy {
  justify-self: center;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  z-index: 3;
}

.why-overview h2 {
  max-width: 12.5ch;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.65rem, 4.2vw, 4.65rem);
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: 0;
  text-wrap: balance;
}

.why-overview__copy p {
  max-width: 36ch;
  color: var(--brand-ink-soft);
  font-size: clamp(1.05rem, 1.14vw, 1.2rem);
  font-weight: 500;
  line-height: 1.72;
}

.home-script {
  display: block;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.18em;
  font-weight: 700;
  line-height: 0.76;
  letter-spacing: 0;
  transform: rotate(-1.5deg);
  transform-origin: left center;
}

.home-script--inline {
  display: inline-block;
  margin-inline: 0.08em;
  vertical-align: -0.04em;
}

.text-link-cta {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  padding-bottom: 7px;
  color: var(--brand-ink-soft);
  background-image: linear-gradient(90deg, var(--brand-gold), var(--brand-lime-hover));
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 100% 3px;
  font-size: clamp(1rem, 1.05vw, 1.12rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
  transition:
    color var(--d-fast) ease,
    background-size 260ms var(--ease-out-expo),
    background-image var(--d-fast) ease;
}

.text-link-cta:hover,
.text-link-cta:focus-visible {
  color: var(--shade-deep);
  background-image: linear-gradient(90deg, var(--brand-lime-hover), var(--shade-deep));
  background-size: 100% 4px;
}

.why-overview__copy .section-actions {
  justify-content: center;
}

.why-overview__scene {
  position: absolute;
  top: var(--nav-h);
  bottom: 0;
  width: min(48vw, 720px);
  overflow: hidden;
  border-radius: 0;
  filter: saturate(0.95) contrast(0.96);
  will-change: transform, opacity;
}

.why-overview__scene--left {
  left: 0;
  transform: translateY(34px);
  -webkit-mask-image:
    linear-gradient(90deg, #000 0%, rgba(0, 0, 0, 0.9) 38%, rgba(0, 0, 0, 0.34) 70%, transparent 100%),
    linear-gradient(0deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  mask-image:
    linear-gradient(90deg, #000 0%, rgba(0, 0, 0, 0.9) 38%, rgba(0, 0, 0, 0.34) 70%, transparent 100%),
    linear-gradient(0deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}

.why-overview__scene--right {
  right: 0;
  transform: translateY(-34px);
  -webkit-mask-image:
    linear-gradient(270deg, #000 0%, rgba(0, 0, 0, 0.9) 38%, rgba(0, 0, 0, 0.34) 70%, transparent 100%),
    linear-gradient(0deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  mask-image:
    linear-gradient(270deg, #000 0%, rgba(0, 0, 0, 0.9) 38%, rgba(0, 0, 0, 0.34) 70%, transparent 100%),
    linear-gradient(0deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}

.why-overview__scene--left.is-in {
  transform: translateY(-18px);
}

.why-overview__scene--right.is-in {
  transform: translateY(18px);
}

.why-overview__scene::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.why-overview__scene--left::after {
  background:
    radial-gradient(ellipse at 78% 50%, rgba(251, 250, 247, 0.86), transparent 42%),
    linear-gradient(90deg, rgba(168, 212, 226, 0.54), rgba(168, 212, 226, 0.34) 44%, rgba(251, 250, 247, 0.78) 100%),
    linear-gradient(0deg, rgba(251, 250, 247, 0.9), transparent 18%, transparent 72%, rgba(251, 250, 247, 0.88));
}

.why-overview__scene--right::after {
  background:
    radial-gradient(ellipse at 22% 50%, rgba(251, 250, 247, 0.86), transparent 42%),
    linear-gradient(270deg, rgba(168, 212, 226, 0.48), rgba(155, 224, 111, 0.22) 44%, rgba(251, 250, 247, 0.78) 100%),
    linear-gradient(0deg, rgba(251, 250, 247, 0.9), transparent 18%, transparent 72%, rgba(251, 250, 247, 0.88));
}

.why-overview__scene img {
  width: 200%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  transform: scale(1.06);
}

.why-overview__scene--left img {
  object-position: left center;
}

.why-overview__scene--right img {
  transform: translateX(-50%) scale(1.06);
  object-position: right center;
}

.number-card {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 7px 20px;
  align-content: center;
  min-height: 118px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid var(--brand-line-soft);
}

.number-card + .number-card {
  margin-top: 18px;
}

.number-card span {
  grid-row: 1 / span 2;
  color: var(--brand-lime);
  font-size: 2.4rem;
  font-weight: 950;
  line-height: 1;
  -webkit-text-stroke: 1px rgba(35, 45, 39, 0.52);
}

.number-card strong {
  color: var(--brand-ink-soft);
  font-size: clamp(1.35rem, 1.7vw, 1.65rem);
  line-height: 1.15;
}

.number-card small {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  line-height: var(--brand-lh-copy);
}

.video-visual video {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
}

.awareness-visual {
  display: grid;
  align-items: end;
  padding: clamp(26px, 4vw, 50px);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.5), transparent 48%),
    rgba(252, 247, 235, 0.68);
}

.route-line {
  position: absolute;
  inset: 18% 12% 28%;
  border: 4px solid transparent;
  border-left-color: #243028;
  border-bottom-color: #243028;
  border-radius: 52% 36% 42% 28%;
}

.route-line::before {
  content: "";
  position: absolute;
  inset: 14% 10% 20% 24%;
  border-top: 4px solid var(--brand-lime);
  border-right: 4px solid var(--brand-lime);
  border-radius: 50%;
  transform: rotate(-10deg);
}

.stop {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--brand-gold);
  border: 4px solid var(--brand-paper-soft);
  box-shadow: 0 0 0 2px rgba(35, 45, 39, 0.12);
}

.stop--one {
  left: -10px;
  bottom: 4%;
}

.stop--two {
  left: 42%;
  top: 5%;
  background: var(--brand-sage);
}

.stop--three {
  right: 7%;
  top: 54%;
  background: var(--brand-sky);
}

.awareness-panel {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.awareness-panel div {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--brand-line-soft);
}

.awareness-panel strong {
  display: block;
  color: var(--brand-ink-soft);
  font-size: clamp(1.8rem, 3vw, 2.35rem);
  line-height: 1;
}

.awareness-panel span {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-small);
  line-height: 1.45;
}

.selfcheck-visual {
  display: grid;
  place-items: center;
  padding: clamp(26px, 4vw, 52px);
}

.check-panel {
  width: min(100%, 430px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.check-panel__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.check-panel__top span {
  color: #1d371f;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.check-panel__top b {
  padding: 3px 10px 4px;
  border-radius: 6px;
  background: rgba(248, 241, 227, 0.9);
  border: 1px solid rgba(35, 45, 39, 0.14);
  color: rgba(35, 45, 39, 0.58);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.check-panel h3 {
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: clamp(1.55rem, 2.3vw, 2rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: 0;
}

.risk-meter {
  height: 10px;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, var(--brand-lime), #f0c46a, #d77252);
  margin: 4px 0 2px;
}

.risk-meter i {
  display: block;
  width: 16px;
  height: 16px;
  margin-left: 58%;
  transform: translateY(-3px);
  border-radius: var(--r-pill);
  background: #fff;
  box-shadow: 0 0 0 2px rgba(35, 45, 39, 0.14);
}

.check-panel p {
  margin-top: 2px;
  color: rgba(79, 88, 80, 0.72);
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.35;
}

.check-panel ul {
  list-style: none;
  display: grid;
  gap: 8px;
  color: rgba(79, 88, 80, 0.62);
  font-size: clamp(1rem, 1.1vw, 1.08rem);
  font-weight: 600;
  line-height: 1.35;
}

.check-panel li {
  position: relative;
  padding-left: 28px;
}

.check-panel li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 0.58em;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px dotted rgba(98, 133, 107, 0.52);
  transform: translateY(-50%);
}

.check-panel strong {
  width: fit-content;
  margin-top: 6px;
  padding: 9px 18px 10px;
  border-radius: 8px;
  background: rgba(239, 166, 43, 0.12);
  color: rgba(79, 70, 45, 0.68);
  font-size: 1rem;
  font-weight: 800;
}

[data-rise] {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity var(--d-long) var(--ease-out-expo) var(--rise-delay, 0ms),
    transform var(--d-long) var(--ease-out-expo) var(--rise-delay, 0ms);
}

[data-rise].is-in {
  opacity: 1;
  transform: none;
}

[data-scroll-fade] {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 980ms var(--ease-out-expo) var(--fade-delay, 0ms),
    transform 980ms var(--ease-out-expo) var(--fade-delay, 0ms);
}

[data-scroll-fade].is-in {
  opacity: 1;
  transform: none;
}

.why-overview__scene.is-in {
  opacity: 1;
}

.why-overview__scene.why-overview__scene--left {
  transform: translateY(34px);
}

.why-overview__scene.why-overview__scene--right {
  transform: translateY(-34px);
}

.why-overview__scene.why-overview__scene--left.is-in {
  transform: translateY(-18px);
}

.why-overview__scene.why-overview__scene--right.is-in {
  transform: translateY(18px);
}

@media (max-width: 640px) {
  .why-overview {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 24px;
    padding-inline: var(--gutter);
    padding-bottom: 42px;
  }

  .why-overview h2 {
    max-width: 15ch;
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }

  .why-overview__copy {
    order: 1;
    align-items: flex-start;
    text-align: left;
  }

  .why-overview__scene {
    position: relative;
    inset: auto;
    width: min(100%, 320px);
    aspect-ratio: 1;
    min-height: 0;
    border-radius: 50%;
    -webkit-mask-image: radial-gradient(circle at center, #000 0 42%, rgba(0, 0, 0, 0.72) 58%, rgba(0, 0, 0, 0.22) 74%, transparent 90%);
    mask-image: radial-gradient(circle at center, #000 0 42%, rgba(0, 0, 0, 0.72) 58%, rgba(0, 0, 0, 0.22) 74%, transparent 90%);
  }

  .why-overview__scene--left {
    order: 2;
  }

  .why-overview__scene--right {
    order: 3;
  }

  .number-card,
  .awareness-panel {
    grid-template-columns: 1fr;
  }

  .number-card {
    padding: 22px;
  }

  .check-panel {
    padding: 24px;
  }
}

@media (min-width: 641px) and (max-width: 980px) {
  .why-overview {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .why-overview__copy {
    order: 1;
  }

  .why-overview__scene {
    position: relative;
    inset: auto;
    width: min(100%, 420px);
    aspect-ratio: 1;
    min-height: 0;
    border-radius: 50%;
    -webkit-mask-image: radial-gradient(circle at center, #000 0 42%, rgba(0, 0, 0, 0.72) 58%, rgba(0, 0, 0, 0.22) 74%, transparent 90%);
    mask-image: radial-gradient(circle at center, #000 0 42%, rgba(0, 0, 0, 0.72) 58%, rgba(0, 0, 0, 0.22) 74%, transparent 90%);
  }

  .why-overview__scene--left {
    order: 2;
  }

  .why-overview__scene--right {
    order: 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-rise],
  [data-scroll-fade] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
