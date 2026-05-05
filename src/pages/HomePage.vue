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
      }
    };

    animationFrame = window.requestAnimationFrame(frame);
  };

  const onWheel = (event: WheelEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [data-native-scroll]')) return;

    event.preventDefault();
    if (isAnimating) return;

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
  const els = root.value?.querySelectorAll('[data-rise]') ?? [];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  els.forEach((el) => io.observe(el));
  cleanupSectionScroller = setupSectionScroller();
});

onBeforeUnmount(() => {
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
        <h1>Helping seniors stay cool outdoors.</h1>
        <p>
          Shadeo helps older adults and carers understand heat risk, find cooler places,
          and make safer walking decisions before the day gets too hot.
        </p>
      </HeroBlendSection>

      <section id="intro" class="why-overview" >
        <SectionKicker>The problem we address</SectionKicker>
        <h2>Hot days can make daily life harder.</h2>
        <div class="why-overview__intro">
          <p>
            Shadeo helps older adults find cooler ways to go out, understand local heat,
            check personal risk, and stay connected.
          </p>
          <AppButton href="/why" variant="feature">Why Shadeo</AppButton>
        </div>
        <div class="why-overview__grid">
          <div class="why-card">
            <span>01</span>
            <strong>Go out safely</strong>
            <small>Find cooler routes to groceries, cafes, libraries, and other daily places.</small>
          </div>
          <div class="why-card">
            <span>02</span>
            <strong>See who may need more care</strong>
            <small>Maps show where heat, fewer trees, older residents, and limited support overlap.</small>
          </div>
          <div class="why-card">
            <span>03</span>
            <strong>Check your risk</strong>
            <small>Answer a few questions about health, home, mobility, and support.</small>
          </div>
          <div class="why-card">
            <span>04</span>
            <strong>Stay connected</strong>
            <small>Plan check-ins and cooler social outings before very hot days.</small>
          </div>
        </div>
      </section>

      <PageSection id="navigation" tone="lime" side-label="Section 02 - Walk Planner">
        <template #copy>
          <SectionKicker>Cool routes for daily needs</SectionKicker>
          <h2>Find a nearby place, then choose the safer walk.</h2>
          <p>
            Pick a daily type such as groceries, cafe, library, or pharmacy. Shadeo can
            suggest up to five nearby destinations, compare short routes, and score each
            route using distance, shade cover, and rest facilities.
          </p>
          <div class="section-actions">
            <AppButton href="/walk-planner" variant="feature">Open Walk Planner</AppButton>
          </div>
        </template>

        <template #visual>
          <VisualPanel tone="paper" class="video-visual">
            <video src="/final.mp4" autoplay muted loop playsinline preload="metadata" />
          </VisualPanel>
        </template>
      </PageSection>

      <PageSection id="awareness" tone="warm" side-label="Section 03 - Awareness">
        <template #copy>
          <SectionKicker>Heat Vulnerability Index</SectionKicker>
          <h2>Show where hot days may be harder.</h2>
          <p>
            Shadeo visualises where high heat, fewer trees, fewer cooling facilities,
            older residents, and limited support may overlap. It helps people see who may
            need more care before a hot day becomes risky.
          </p>
          <div class="section-actions">
            <AppButton href="/awareness" variant="feature">View Awareness Map</AppButton>
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
          <SectionKicker>Heat vulnerability self-check</SectionKicker>
          <h2>A short check for heat risk and support.</h2>
          <p>
            The self-check looks at personal sensitivity, local exposure, home cooling,
            mobility, and whether someone can check in. The result stays non-medical and
            practical.
          </p>
          <div class="section-actions">
            <AppButton href="/self-check" variant="feature">Start Self-Check</AppButton>
          </div>
        </template>

        <template #visual>
          <VisualPanel class="selfcheck-visual">
            <div class="check-panel">
              <span>60-second check</span>
              <h3>Today's heat risk</h3>
              <div class="risk-meter" aria-hidden="true"><i /></div>
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

.why-overview {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: calc(var(--nav-h) + 54px) max(var(--gutter), calc((100vw - 1180px) / 2)) 58px;
  background:
    radial-gradient(circle at 78% 24%, rgba(155, 224, 111, 0.1), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, #f7f2e8 100%);
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

.why-overview h2 {
  max-width: 15ch;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: var(--brand-fs-h2);
  font-weight: 950;
  line-height: var(--brand-lh-heading);
  letter-spacing: 0;
  text-wrap: balance;
}

.why-overview__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
  max-width: 1040px;
}

.why-overview__intro p {
  max-width: 54ch;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

.why-overview__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.why-card {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid var(--brand-line-soft);
  background: rgba(255, 255, 255, 0.58);
}

.why-card span {
  color: var(--brand-lime);
  font-size: 2rem;
  font-weight: 950;
  line-height: 1;
  -webkit-text-stroke: 1px rgba(35, 45, 39, 0.5);
}

.why-card strong {
  color: var(--brand-ink-soft);
  font-size: clamp(1.3rem, 1.5vw, 1.55rem);
  line-height: 1.16;
}

.why-card small {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  line-height: 1.45;
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
  gap: 20px;
  padding: clamp(26px, 4vw, 42px);
  border-radius: 32px;
  background: rgba(252, 247, 235, 0.78);
  border: 1px solid var(--brand-line);
}

.check-panel span {
  color: #1d371f;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.check-panel h3 {
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: var(--brand-fs-h3);
  font-weight: 950;
  letter-spacing: 0;
}

.risk-meter {
  height: 18px;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, var(--brand-lime), #f0c46a, #d77252);
  padding: 3px;
}

.risk-meter i {
  display: block;
  width: 16px;
  height: 12px;
  margin-left: 58%;
  border-radius: var(--r-pill);
  background: #fff;
}

.check-panel ul {
  list-style: none;
  display: grid;
  gap: 12px;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

.check-panel li {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--brand-line-soft);
}

.check-panel strong {
  width: fit-content;
  padding: 10px 18px;
  border-radius: var(--r-pill);
  background: var(--brand-gold);
  color: #17150f;
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

@media (max-width: 640px) {
  .why-overview {
    min-height: auto;
    padding-inline: var(--gutter);
    padding-bottom: 42px;
  }

  .why-overview h2 {
    max-width: 15ch;
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }

  .why-overview__grid {
    grid-template-columns: 1fr;
  }

  .why-overview__intro {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .why-card {
    min-height: auto;
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
  }

  .why-overview__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .why-card {
    min-height: 190px;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-rise] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
