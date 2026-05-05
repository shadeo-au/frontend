<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AppButton from '../components/AppButton.vue';
import HeroFullSection from '../components/HeroFullSection.vue';
import SectionKicker from '../components/SectionKicker.vue';
import BrandWatermark from '../components/BrandWatermark.vue';

const root = ref<HTMLElement | null>(null);

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
  <div ref="root" class="why-page">
    <AppNav />

    <main>

      <!-- ── Hero (untouched) ─────────────────────────────────── -->
      <HeroFullSection
        id="why-hero"
        image-src="/whypage.png"
        image-alt="An older woman stands in a warm sunny landscape surrounded by shaded paths, a heat map, and a health checklist —representing the challenges Shadeo helps navigate."
      >
        <h1>Heat hits harder as we age.</h1>
      </HeroFullSection>

      <!-- ══════════════════════════════════════════════════════           SECTION 1 - Why this matters
      ══════════════════════════════════════════════════════-->
      <section id="why-matters" class="ws-wide ws-wide--warm">
        <BrandWatermark />

        <div class="ws-wide__inner">
          <div class="ws-section-head" data-rise>
            <SectionKicker>The problem</SectionKicker>
            <h2>Why this matters</h2>
            <p class="ws-lead">
              Extreme heat can affect health, mobility, daily routines, and social connection —              especially for older adults who may live alone, have chronic health conditions,
              limited mobility, or less access to support.
            </p>
          </div>

          <div class="ws-evidence-grid">
            <!-- Card 1 -->
            <div class="ws-evidence-card" data-rise>
              <div class="ws-evidence-card__art" aria-hidden="true">
                <img src="/problem-icon1.png" alt="" />
              </div>
              <div class="ws-evidence-card__body">
                <h3>Older adults face higher heat risk</h3>
                <p>
                  People over 65 may be more vulnerable to heat-related illness, especially when chronic
                  conditions, medications, or reduced ability to regulate body temperature are involved.
                </p>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="ws-evidence-card" data-rise style="--rise-delay: 80ms">
              <div class="ws-evidence-card__art" aria-hidden="true">
                <img src="/problem-icon2.png" alt="" />
              </div>
              <div class="ws-evidence-card__body">
                <h3>Heat can disrupt daily routines</h3>
                <p>
                  Hot days can make ordinary tasks harder, including buying groceries, attending
                  appointments, visiting cooler places, or walking safely through the neighbourhood.
                </p>
              </div>
            </div>

            <!-- Card 3 -->
            <div class="ws-evidence-card" data-rise style="--rise-delay: 160ms">
              <div class="ws-evidence-card__art" aria-hidden="true">
                <img src="/problem-icon3.png" alt="" />
              </div>
              <div class="ws-evidence-card__body">
                <h3>Support and check-ins matter</h3>
                <p>
                  Staying safe in extreme heat often depends on preparation, hydration,
                  cooler environments, and someone being available to check in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════           SECTION 2 —The gap we saw
      ══════════════════════════════════════════════════════-->
      <section id="why-gap" class="ws-split ws-split--lime">
        <BrandWatermark />

        <div class="ws-split__copy" data-rise>
          <SectionKicker>Current gap</SectionKicker>
          <h2>Advice exists, but it is not always personal or local.</h2>
          <p>
            Most heat safety advice tells people to stay cool, drink water, avoid the hottest
            part of the day, and check in with others. This advice is important, but it can
            still feel too general when an older adult needs to decide what to do today,
            in their own neighbourhood.
          </p>
          <div class="ws-question-card" role="list" aria-label="Common questions older adults face during extreme heat">
            <span role="listitem">Can I safely walk to the pharmacy?</span>
            <span role="listitem">Is there a cooler place nearby?</span>
            <span role="listitem">Does my area have enough shade or support?</span>
            <span role="listitem">Should I go out today or prepare at home?</span>
            <span role="listitem">Who can check in on me during a heatwave?</span>
          </div>
        </div>

        <div class="ws-split__visual" data-rise style="--rise-delay: 100ms">
          <div class="ws-flow" aria-label="Transformation from broad advice to safer daily decision">
            <div class="ws-flow__node ws-flow__node--muted">Broad heat advice</div>
            <div class="ws-flow__arrow" aria-hidden="true">&#8595;</div>
            <div class="ws-flow__node ws-flow__node--muted">Personal situation</div>
            <div class="ws-flow__arrow" aria-hidden="true">&#8595;</div>
            <div class="ws-flow__node ws-flow__node--muted">Local environment</div>
            <div class="ws-flow__arrow ws-flow__arrow--lime" aria-hidden="true">&#8595;</div>
            <div class="ws-flow__node ws-flow__node--lime">Safer daily decision</div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════           SECTION 4 —How Shadeo helps
      ══════════════════════════════════════════════════════-->
      <section id="why-features" class="ws-wide ws-wide--lime">
        <BrandWatermark />

        <div class="ws-wide__inner">
          <div class="ws-section-head ws-section-head--narrow" data-rise>
            <SectionKicker>Four tools</SectionKicker>
            <h2>How Shadeo helps</h2>
            <p class="ws-lead">
              Four connected tools support safer, cooler, and more confident daily decisions.
            </p>
          </div>

          <div class="ws-feature-grid">
            <!-- Feature 1 -->
            <div class="ws-feature-panel" data-rise>
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/route-icon.png" alt="" class="ws-feature-icon" />
              </div>
              <h3>Cooler daily routes</h3>
              <p>
                Compare nearby essential destinations and route comfort using walking distance,
                shade, benches, toilets, water, and slope-related support.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/#navigation" variant="feature">See route concept</AppButton>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="ws-feature-panel" data-rise style="--rise-delay: 80ms">
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/awareness.png" alt="" class="ws-feature-icon" />
              </div>
              <h3>Heat vulnerability awareness</h3>
              <p>
                Show how local heat pressure, tree cover, older residents, and nearby support
                can affect where extra care may be needed.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/awareness" variant="feature">View awareness map</AppButton>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="ws-feature-panel" data-rise style="--rise-delay: 160ms">
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/check-icon.png" alt="" class="ws-feature-icon" />
              </div>
              <h3>Personal risk self-check</h3>
              <p>
                Help users reflect on local heat exposure, personal sensitivity, home cooling,
                mobility, and check-in support in a non-medical way.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/self-check" variant="feature">Start Self-Check</AppButton>
              </div>
            </div>

            <!-- Feature 4 -->
            <div class="ws-feature-panel" data-rise style="--rise-delay: 240ms">
              <div class="ws-feature-panel__visual" aria-hidden="true">
                <img src="/connection-icon.png" alt="" class="ws-feature-icon" />
              </div>
              <h3>Social connection support</h3>
              <p>
                Encourage practical actions such as choosing a cool public place, inviting
                someone, or setting a heatwave check-in person.
              </p>
              <div class="ws-feature-panel__action">
                <AppButton href="/#connection" variant="feature">Learn about support</AppButton>
              </div>
            </div>
          </div>
        </div>
      </section>


    </main>
  </div>
</template>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────── */
.why-page {
  min-height: 100vh;
  color: var(--brand-ink);
  background: var(--brand-paper-white);
}

/* ── Rise animation (same system as HomePage) ───────────────── */
[data-rise] {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.68s cubic-bezier(0.22, 0.61, 0.36, 1) var(--rise-delay, 0ms),
    transform 0.68s cubic-bezier(0.22, 0.61, 0.36, 1) var(--rise-delay, 0ms);
}
[data-rise].is-in {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  [data-rise] { opacity: 1; transform: none; transition: none; }
}


/* ══════════════════════════════════════════════════════════════   WIDE SECTIONS (1, 3, 4)
══════════════════════════════════════════════════════════════*/
.ws-wide {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding:
    clamp(72px, 9vw, 120px)
    max(var(--gutter), calc((100vw - 1180px) / 2));
}

.ws-wide--warm {
  background:
    radial-gradient(circle at 78% 24%, rgba(155, 224, 111, 0.1), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, #f7f2e8 100%);
}

.ws-wide--lime {
  background:
    radial-gradient(circle at 76% 42%, rgba(155, 224, 111, 0.24), transparent 26%, transparent 48%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, rgba(228, 248, 213, 0.46) 100%);
}

.ws-wide__inner {
  display: flex;
  flex-direction: column;
  gap: clamp(44px, 5.5vw, 76px);
}

/* ── Section head ────────────────────────────────────────────── */
.ws-section-head {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 640px;
}

.ws-section-head--narrow {
  max-width: 520px;
}

.ws-section-head h2 {
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: var(--brand-fs-h2);
  font-weight: 950;
  line-height: 1.06;
  letter-spacing: 0;
  text-wrap: balance;
}

.ws-lead {
  max-width: 54ch;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead, 1.2rem);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
  margin: 0;
}

/* ══════════════════════════════════════════════════════════════   SECTION 1 —Evidence cards
══════════════════════════════════════════════════════════════*/
.ws-evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(16px, 2.2vw, 28px);
}

.ws-evidence-card {
  padding: 0;
  border-radius: 32px;
  border: 1px solid var(--brand-line-soft);
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  transition: box-shadow 0.22s;
}

.ws-evidence-card__art {
  position: relative;
  height: 240px;
  overflow: hidden;
  background: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ws-evidence-card__art img {
  width: auto;
  height: 90%;
  max-width: 90%;
  display: block;
}

.ws-evidence-card__art::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, transparent 100%);
  pointer-events: none;
}

.ws-evidence-card__body {
  padding: clamp(20px, 2.5vw, 32px) clamp(24px, 3vw, 36px) clamp(24px, 3vw, 36px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws-evidence-card h3 {
  margin: 0;
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: clamp(1.2rem, 1.5vw, 1.55rem);
  font-weight: 900;
  line-height: 1.18;
}

.ws-evidence-card p {
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  line-height: var(--brand-lh-copy);
}

/* ══════════════════════════════════════════════════════════════   SECTION 2 —Split: gap + flow diagram
══════════════════════════════════════════════════════════════*/
.ws-split {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(44px, 6vw, 92px);
  padding:
    clamp(72px, 9vw, 120px)
    max(var(--gutter), calc((100vw - 1180px) / 2));
}

.ws-split--lime {
  background:
    radial-gradient(circle at 76% 42%, rgba(155, 224, 111, 0.24), transparent 26%, transparent 48%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, rgba(228, 248, 213, 0.46) 100%);
}

.ws-split__copy {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ws-split__copy h2 {
  margin: 0;
  max-width: 14ch;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: var(--brand-fs-h2);
  font-weight: 950;
  line-height: 1.06;
  text-wrap: balance;
}

.ws-split__copy > p {
  max-width: 46ch;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead, 1.2rem);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
  margin: 0;
}

/* ── Question card ───────────────────────────────────────────── */
.ws-question-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: clamp(20px, 2.8vw, 30px);
  border-radius: 26px;
  border: 1px solid var(--brand-line);
  background: rgba(255, 255, 255, 0.66);
}

.ws-question-card span {
  display: block;
  padding: 13px 18px;
  border-radius: 14px;
  background: rgba(155, 224, 111, 0.12);
  color: var(--brand-ink-soft);
  font-size: var(--brand-fs-body);
  font-weight: 650;
  line-height: 1.4;
}

/* ── Flow diagram ────────────────────────────────────────────── */
.ws-split__visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ws-flow {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  width: 100%;
  max-width: 300px;
}

.ws-flow__node {
  padding: 18px 28px;
  border-radius: 999px;
  text-align: center;
  font-family: var(--font-body);
  font-size: var(--brand-fs-body);
  font-weight: 900;
  line-height: 1.2;
}

.ws-flow__node--muted {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--brand-line);
  color: var(--brand-ink-muted);
}

.ws-flow__node--lime {
  background: var(--brand-lime);
  border: 1px solid transparent;
  color: #142016;
}

.ws-flow__arrow {
  text-align: center;
  color: var(--brand-ink-muted);
  font-size: 1.4rem;
  line-height: 1.1;
  opacity: 0.45;
}

.ws-flow__arrow--lime {
  color: #5a9e3a;
  opacity: 0.8;
}

/* ══════════════════════════════════════════════════════════════   SECTION 4 —Feature panels
══════════════════════════════════════════════════════════════*/
.ws-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(16px, 2.2vw, 26px);
}

.ws-feature-panel {
  padding: clamp(26px, 3vw, 40px);
  border-radius: 32px;
  border: 1px solid var(--brand-line-soft);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ws-feature-panel__visual {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ws-feature-icon {
  width: auto;
  height: 100%;
  max-width: 100%;
  display: block;
}

.ws-feature-panel h3 {
  margin: 0;
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: clamp(1.2rem, 1.45vw, 1.6rem);
  font-weight: 900;
  line-height: 1.15;
}

.ws-feature-panel p {
  margin: 0;
  flex: 1;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  line-height: var(--brand-lh-copy);
}

.ws-feature-panel__action {
  padding-top: 6px;
}

/* ══════════════════════════════════════════════════════════════   RESPONSIVE
══════════════════════════════════════════════════════════════*/
@media (max-width: 980px) {
  .ws-evidence-grid { grid-template-columns: 1fr; }

  .ws-feature-grid { grid-template-columns: 1fr; }

  .ws-split {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .ws-split__copy h2,
  .ws-section-head h2 {
    font-size: clamp(2.4rem, 7vw, 4rem);
  }
}

@media (max-width: 640px) {
  .ws-wide,
  .ws-split {
    padding-inline: var(--gutter);
  }

  .ws-split__copy h2,
  .ws-section-head h2 {
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }
}
</style>
