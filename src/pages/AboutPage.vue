<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppNav from '../components/AppNav.vue';
import AboutSubNav from '../components/about/AboutSubNav.vue';
import ValueMarquee from '../components/about/ValueMarquee.vue';

const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | undefined;

onMounted(() => {
  const els = root.value?.querySelectorAll('[data-rise]') ?? [];
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
        } else {
          entry.target.classList.remove('is-in');
        }
      });
    },
    { rootMargin: '-8% 0px -14% 0px', threshold: 0.16 }
  );

  els.forEach((el) => observer?.observe(el));
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div ref="root" class="about-page">
    <AppNav />

    <main>
      <section id="about-hero" class="about-hero">
        <div class="about-hero__copy" data-rise="fade-scale">
          <h1>Comfort,<em>all summer.</em></h1>
        </div>
        <div class="about-hero__media" aria-hidden="true">
          <img src="/aboutus-1.jpg" alt="" />
        </div>
      </section>

      <AboutSubNav />

      <section id="mission" class="purpose-showcase">
        <div class="purpose-showcase__media" aria-hidden="true">
          <img src="/aboutus-2.jpg" alt="" />
        </div>
        <div class="purpose-showcase__copy" data-rise="fade-left">
          <div class="purpose-showcase__statement">
            <h2><em>We believe</em></h2>
            <p>hot days should feel <em>manageable, familiar, and safe.</em></p>
          </div>
          <div class="purpose-showcase__statement">
            <h2><em>Our mission</em></h2>
            <p>is to help older Australians face heat with clarity, calm, and confidence.</p>
          </div>
        </div>
      </section>

      <section id="approach" class="about-section about-section--approach">
        <div class="about-approach__head" data-rise="fade-up">
          <h2>Help, <em class="no-wrap">not hype.</em></h2>
          <p class="about-approach__lede">
            Heat does not land the same on every street, in every neighbourhood,
            or for every person. Shadeo helps with all three.
          </p>
        </div>

        <ol class="about-approach__list">
          <li class="approach-item approach-item--01" data-rise="fade-right">
            <span class="approach-item__num" aria-hidden="true">01</span>
            <div class="approach-item__body">
              <h3>Cooler routes through <em>your day.</em></h3>
              <p>
                Walking guidance that prefers shade, rest stops, and cool places -
                so a trip to the shops, the library, or a friend's place stays
                comfortable on a warm day.
              </p>
            </div>
          </li>

          <li class="approach-item approach-item--02" data-rise="fade-left" style="--rise-delay: 90ms">
            <span class="approach-item__num" aria-hidden="true">02</span>
            <div class="approach-item__body">
              <h3>A clearer picture of your <em>neighbourhood.</em></h3>
              <p>
                See how heat settles around you - where streets run hotter,
                where green cover thins out, and where the cooler corners are
                within easy reach.
              </p>
            </div>
          </li>

          <li class="approach-item approach-item--03" data-rise="fade-right" style="--rise-delay: 180ms">
            <span class="approach-item__num" aria-hidden="true">03</span>
            <div class="approach-item__body">
              <h3>How heat lands for <em>you.</em></h3>
              <p>
                A few quiet questions about your home, your routine, and the
                support around you turn today's forecast into clear, personal
                next steps - not generic advice.
              </p>
            </div>
          </li>
        </ol>

      </section>

      <section id="values" class="about-section about-section--values">
        <div class="about-values__image about-values__image--left" aria-hidden="true">
          <img src="/aboutus-3-1.jpg" alt="" />
        </div>
        <div class="about-values__image about-values__image--right" aria-hidden="true">
          <img src="/aboutus-3-2.jpg" alt="" />
        </div>
        <div class="about-section__copy about-section__copy--center" data-rise="fade-scale">
          <h2>Five words to <em>live by.</em></h2>
          <p class="about-values__principles">
            <strong>Calm, Care, Local, Private, Practical</strong>
            <span>the principles behind every choice we make.</span>
          </p>
          <p>
            They mark the difference between feeling supported and feeling watched,
            between being prepared and being scared, between knowing your neighbourhood
            and being told about everywhere else.
          </p>
        </div>
      </section>

      <ValueMarquee />

      <section id="sustainability" class="about-section about-section--photo about-section--sustainability">
        <div class="about-section__bg" aria-hidden="true">
          <img src="/aboutus-4.jpg" alt="" />
        </div>
        <div class="sustainability-layout" data-rise="fade-left">
          <h2 class="sustainability-headline">
            Keep life <em>liveable</em><br />
            in <em class="no-wrap">later years.</em>
          </h2>
          <div class="sustainability-copy">
            <p>General heat advice talks to everyone, which means it talks to no one in particular.</p>
            <p>
              As summers grow hotter, sustainable care means helping older adults
              keep daily routines, local connections, and independence within reach.
            </p>
            <p>
              Shadeo bridges that gap with local data, personal context, and simple
              language - so warm days can feel planned for, not endured.
            </p>
            <a href="/why" class="about-inline-link">See the data behind why this matters -></a>
          </div>
        </div>
      </section>

      <section id="inclusion" class="about-section about-section--inclusion">
        <div class="about-section__copy about-section__copy--center" data-rise="fade-up">
          <h2>Every age, <em>included.</em></h2>
          <p>
            At Shadeo, "older adults" is not a category - it is a future every one
            of us is heading toward, and a present many of us already share with
            the people we love.
          </p>
          <p>
            This site is free, private, and built for anyone who wants their summer
            to feel like summer again.
          </p>
        </div>
      </section>

      <section id="explore" class="about-section about-section--explore">
        <div class="about-section__head" data-rise="fade-scale">
          <h2>Now, <em>explore.</em></h2>
        </div>

        <div class="explore-grid">
          <a href="/awareness" class="explore-card" data-rise="fade-up">
            <img src="/aboutus-c1.jpg" alt="" />
            <span>Awareness Map</span>
            <p>See where older residents may benefit from extra attention during heat.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/self-check" class="explore-card" data-rise="fade-up" style="--rise-delay: 70ms">
            <img src="/aboutus-c2.jpg" alt="" />
            <span>Self-Check</span>
            <p>Reflect on your day, your home, and the support around you.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/walk-planner" class="explore-card" data-rise="fade-up" style="--rise-delay: 140ms">
            <img src="/aboutus-c3.jpg" alt="" />
            <span>Walk Planner</span>
            <p>Compare cooler daily routes to nearby essential places.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/why" class="explore-card" data-rise="fade-up" style="--rise-delay: 210ms">
            <img src="/aboutus-c4.jpg" alt="" />
            <span>Why This Matters</span>
            <p>Understand the evidence behind Shadeo's focus on older adults and heat.</p>
            <strong aria-hidden="true">-></strong>
          </a>
        </div>
      </section>

      <footer class="about-footer">
        Built on open data from the Australian Bureau of Statistics, AURIN, the Bureau of Meteorology, and the City of Melbourne.
      </footer>
    </main>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
  color: var(--brand-ink);
  background: var(--brand-paper-white);
}

.about-hero,
.about-section,
.purpose-showcase {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  scroll-margin-top: calc(var(--nav-h) + 68px);
}

.about-hero {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(460px, 0.98fr);
  align-items: center;
  gap: 0;
  padding:
    calc(var(--nav-h) + 72px)
    max(var(--gutter), calc((100vw - 1320px) / 2))
    0;
  background:
    radial-gradient(ellipse at 12% 18%, rgba(155, 224, 111, 0.12), transparent 34%),
    radial-gradient(ellipse at 58% 50%, rgba(168, 212, 226, 0.14), transparent 42%),
    #fbfaf7;
}

.about-hero::after {
  content: "";
  position: absolute;
  z-index: 2;
  inset: 0 auto 0 0;
  width: min(58vw, 780px);
  background:
    linear-gradient(90deg, #fbfaf7 0%, rgba(251, 250, 247, 0.98) 48%, rgba(251, 250, 247, 0.58) 72%, rgba(251, 250, 247, 0.18) 88%, transparent 100%),
    radial-gradient(ellipse at 58% 58%, rgba(251, 250, 247, 0.7) 0 14%, rgba(251, 250, 247, 0.36) 36%, transparent 66%);
  pointer-events: none;
}

.about-hero__media {
  position: absolute;
  inset: calc(var(--nav-h) + 18px) 0 0 auto;
  z-index: 1;
  width: min(67vw, 960px);
  height: calc(100% - var(--nav-h) - 18px);
  min-height: 560px;
  border-radius: 0;
  overflow: hidden;
}

.about-hero__media::before,
.about-hero__media::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.about-hero__media::before {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(251, 250, 247, 0.9) 0%, rgba(251, 250, 247, 0.52) 12%, rgba(251, 250, 247, 0.16) 28%, transparent 46%),
    radial-gradient(ellipse at 8% 58%, rgba(251, 250, 247, 0.72) 0 14%, rgba(251, 250, 247, 0.28) 34%, transparent 62%);
}

.about-hero__media::after {
  z-index: 2;
  background:
    radial-gradient(ellipse at 96% 0%, rgba(251, 250, 247, 0.28), transparent 38%),
    linear-gradient(0deg, rgba(251, 250, 247, 0.08), transparent 24%);
}

.about-hero__copy {
  position: relative;
  z-index: 3;
  align-self: center;
  padding-bottom: 72px;
}

.about-hero__media img,
.about-section__bg img,
.about-section__image img,
.explore-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-hero__media img {
  object-position: 63% center;
}

.about-hero h1,
.about-section h2,
.purpose-showcase h2 {
  position: relative;
  z-index: 1;
  color: var(--brand-ink);
  font-family: var(--font-display);
  font-size: clamp(5.2rem, 10.8vw, 11.5rem);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: 0;
  text-align: left;
  text-wrap: balance;
}

.about-section h2 {
  font-family: var(--font-body);
  font-size: clamp(3rem, 6.4vw, 7.5rem);
  font-weight: 950;
  text-align: center;
}

.purpose-showcase h2 {
  font-family: var(--font-body);
  font-size: clamp(3.2rem, 5.8vw, 7rem);
  font-weight: 950;
  line-height: 0.92;
  text-align: center;
}

.about-hero h1 {
  display: grid;
  gap: clamp(8px, 1vw, 18px);
  text-shadow: 0 2px 0 rgba(35, 45, 39, 0.08);
}

.about-hero em,
.about-section em,
.purpose-showcase em {
  color: #2f6e69;
  font-family: "Caveat", "Kalam", "Segoe Print", "Bradley Hand", cursive;
  font-style: normal;
  font-weight: 800;
}

.no-wrap {
  white-space: nowrap;
}

.about-hero em {
  display: block;
  font-size: clamp(4.6rem, 10.2vw, 11rem);
  line-height: 0.78;
  letter-spacing: 0;
}

.purpose-showcase em {
  color: #2d6688;
  font-size: 1.08em;
}

.purpose-showcase {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #dfeaf1;
}

.purpose-showcase::before,
.purpose-showcase::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.purpose-showcase::before {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(251, 250, 247, 0.1), rgba(251, 250, 247, 0.34) 52%, rgba(251, 250, 247, 0.06)),
    linear-gradient(180deg, rgba(229, 241, 248, 0.46), rgba(251, 250, 247, 0.12) 32%, rgba(16, 19, 15, 0.14) 100%);
}

.purpose-showcase::after {
  z-index: 2;
  background:
    radial-gradient(ellipse at 50% 47%, rgba(255, 255, 255, 0.92) 0 10%, rgba(255, 255, 255, 0.58) 26%, rgba(255, 255, 255, 0.18) 48%, transparent 70%);
}

.purpose-showcase__copy {
  position: relative;
  z-index: 3;
  display: grid;
  gap: clamp(24px, 4vw, 52px);
  justify-items: center;
  width: min(100% - var(--gutter) * 2, 980px);
  padding: calc(var(--nav-h) + 56px) 0 72px;
  text-align: center;
}

.purpose-showcase__media {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.purpose-showcase__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  filter: saturate(0.92) contrast(0.94);
}

.purpose-showcase__statement {
  display: grid;
  gap: 12px;
}

.purpose-showcase__statement p {
  max-width: 44ch;
  color: rgba(38, 48, 40, 0.86);
  font-size: clamp(1.25rem, 2.2vw, 2.15rem);
  font-weight: 650;
  line-height: 1.36;
  text-wrap: balance;
}

.about-section {
  min-height: 100vh;
  display: grid;
  align-items: center;
  padding: calc(var(--nav-h) + 72px) max(var(--gutter), calc((100vw - 1180px) / 2)) 76px;
}

.about-section__copy {
  position: relative;
  z-index: 1;
  max-width: 640px;
  display: grid;
  gap: 20px;
}

.about-section__copy--center {
  max-width: 1060px;
  margin-inline: auto;
  justify-items: center;
  text-align: center;
}

.about-section p {
  max-width: 52ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.125rem, 1.28vw, 1.32rem);
  font-weight: 650;
  line-height: 1.58;
}

.about-section__copy--center p {
  margin-inline: auto;
}

.about-section--photo {
  color: var(--brand-paper-white);
}

.about-section--photo .about-section__bg {
  position: absolute;
  inset: 0;
  z-index: -2;
}

.about-section--photo::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(16, 19, 15, 0.72), rgba(16, 19, 15, 0.28) 48%, rgba(251, 250, 247, 0.22)),
    radial-gradient(circle at 72% 28%, rgba(155, 224, 111, 0.2), transparent 38%);
}

.about-section--sustainability {
  min-height: 92vh;
  align-items: end;
  padding-block: calc(var(--nav-h) + 90px) 88px;
}

.about-section--sustainability::after {
  background:
    linear-gradient(90deg, rgba(10, 39, 65, 0.5) 0%, rgba(14, 57, 88, 0.3) 46%, rgba(14, 57, 88, 0.12) 100%),
    linear-gradient(0deg, rgba(8, 31, 52, 0.24), rgba(8, 31, 52, 0.06) 48%, rgba(8, 31, 52, 0.12));
}

.about-section--sustainability .about-section__bg img {
  object-position: center;
}

.sustainability-layout {
  position: relative;
  z-index: 1;
  width: min(100%, 1180px);
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.62fr);
  align-items: end;
  gap: clamp(32px, 7vw, 104px);
}

.about-section--sustainability .sustainability-headline {
  max-width: 760px;
  color: var(--brand-paper-white);
  font-family: var(--font-body);
  font-size: clamp(4.5rem, 8.8vw, 8.8rem);
  font-weight: 950;
  line-height: 0.92;
  text-align: left;
  text-wrap: balance;
}

.about-section--sustainability .sustainability-headline em {
  color: #ffdd6e;
  font-family: inherit;
  font-style: normal;
  font-weight: inherit;
}

.sustainability-copy {
  display: grid;
  gap: 18px;
  padding-block-end: 8px;
}

.about-section--photo .sustainability-copy p {
  max-width: 42ch;
  color: rgba(255, 255, 255, 0.9);
}

.about-section--photo .sustainability-copy .about-inline-link {
  color: #ffdd6e;
}

.about-section--photo h2,
.about-section--photo p {
  color: var(--brand-paper-white);
}

.about-section--quiet {
  background:
    radial-gradient(circle at 20% 22%, rgba(168, 212, 226, 0.36), transparent 34%),
    linear-gradient(135deg, #fbfaf7 0%, #edf5ef 100%);
}

.about-section--approach {
  display: block;
  background:
    radial-gradient(circle at 14% 16%, rgba(155, 224, 111, 0.14), transparent 38%),
    radial-gradient(circle at 88% 78%, rgba(239, 166, 43, 0.12), transparent 42%),
    #fbfaf7;
}

.about-approach__head {
  max-width: 880px;
  margin: 0 auto clamp(56px, 8vw, 104px);
  display: grid;
  gap: 22px;
  justify-items: center;
  text-align: center;
}

.about-approach__lede {
  max-width: 56ch;
  margin-inline: auto;
  color: var(--brand-ink-muted);
  font-size: clamp(1.18rem, 1.5vw, 1.42rem);
  font-weight: 600;
  line-height: 1.5;
  text-wrap: balance;
}

.about-approach__list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  width: min(100%, 1100px);
  display: grid;
  gap: clamp(48px, 7vw, 96px);
}

.approach-item {
  --accent: #2f6e69;
  position: relative;
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
  align-items: start;
  gap: clamp(24px, 4vw, 64px);
}

.approach-item:nth-child(even) {
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px);
  text-align: right;
}

.approach-item:nth-child(even) .approach-item__num { order: 2; text-align: right; }
.approach-item:nth-child(even) .approach-item__body { order: 1; justify-self: end; }

.approach-item--01 { --accent: #2f6e69; }
.approach-item--02 { --accent: #2d6688; }
.approach-item--03 { --accent: #c4791b; }

.approach-item__num {
  display: block;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: clamp(5rem, 9vw, 9.4rem);
  font-weight: 500;
  line-height: 0.86;
  letter-spacing: -0.04em;
  opacity: 0.94;
}

.approach-item__body {
  display: grid;
  gap: 14px;
  max-width: 56ch;
}

.approach-item__body h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.7rem, 2.6vw, 2.5rem);
  font-weight: 900;
  line-height: 1.14;
  text-wrap: balance;
}

.approach-item__body h3 em {
  color: var(--accent);
  font-family: "Caveat", "Kalam", "Segoe Print", "Bradley Hand", cursive;
  font-style: normal;
  font-weight: 800;
  font-size: 1.05em;
}

.approach-item__body p {
  max-width: 52ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.05rem, 1.2vw, 1.22rem);
  font-weight: 600;
  line-height: 1.58;
}

.about-approach__footnote {
  margin: clamp(56px, 8vw, 104px) auto 0;
  padding: 12px 22px;
  width: fit-content;
  border-radius: var(--r-pill);
  background: rgba(35, 45, 39, 0.06);
  color: var(--brand-ink-soft);
  font-size: clamp(0.95rem, 1.05vw, 1.05rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

.about-section--values {
  background: #bdd6e2;
}

.about-section--values::before,
.about-section--values::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.about-section--values::before {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(190, 220, 227, 0.34) 0%, rgba(206, 225, 231, 0.84) 31%, rgba(213, 226, 233, 0.9) 50%, rgba(177, 197, 224, 0.84) 69%, rgba(148, 171, 210, 0.34) 100%),
    radial-gradient(ellipse at 50% 42%, rgba(242, 246, 244, 0.76) 0 18%, rgba(216, 228, 233, 0.42) 40%, transparent 68%);
}

.about-section--values::after {
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(251, 250, 247, 0.08) 0%, transparent 20%, rgba(70, 95, 129, 0.08) 100%),
    radial-gradient(ellipse at 50% 50%, rgba(239, 244, 243, 0.76) 0 14%, rgba(223, 232, 235, 0.38) 36%, transparent 62%);
}

.about-values__image {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 0;
  width: min(49vw, 780px);
  opacity: 0.9;
  overflow: hidden;
}

.about-values__image--left {
  left: 0;
  mask-image: linear-gradient(90deg, #000 0 66%, rgba(0, 0, 0, 0.72) 82%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0 66%, rgba(0, 0, 0, 0.72) 82%, transparent 100%);
}

.about-values__image--right {
  right: -16vw;
  mask-image: linear-gradient(270deg, #000 0 66%, rgba(0, 0, 0, 0.72) 82%, transparent 100%);
  -webkit-mask-image: linear-gradient(270deg, #000 0 66%, rgba(0, 0, 0, 0.72) 82%, transparent 100%);
}

.about-values__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92) contrast(0.96);
}

.about-values__image--left img {
  object-position: 86% center;
}

.about-values__image--right img {
  object-position: 0% center;
  transform: translateY(4vh) scale(1.06);
  transform-origin: right center;
}

.about-section--values .about-section__copy {
  z-index: 3;
}

.about-values__principles {
  display: grid;
  gap: 10px;
  justify-items: center;
}

.about-section--values strong {
  display: block;
  color: #2d6688;
  font-size: clamp(1.42rem, 1.9vw, 2rem);
  font-weight: 950;
  line-height: 1.18;
}

.about-values__principles span {
  display: block;
}

.about-kicker {
  width: fit-content;
  padding: 8px 14px;
  border-radius: var(--r-pill);
  color: #17352f;
  background: rgba(155, 224, 111, 0.86);
  font-size: 0.94rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.about-inline-link {
  width: fit-content;
  color: var(--brand-lime);
  font-size: 1.05rem;
  font-weight: 950;
  text-decoration: underline;
  text-underline-offset: 5px;
  text-decoration-thickness: 2px;
}

.about-inline-link:hover {
  text-decoration-thickness: 3px;
}

.about-section--inclusion {
  background:
    radial-gradient(circle at 18% 18%, rgba(244, 183, 158, 0.38), transparent 32%),
    radial-gradient(circle at 80% 74%, rgba(168, 212, 226, 0.42), transparent 36%),
    #fbf0f0;
}

.about-section--explore {
  gap: 36px;
  background:
    radial-gradient(circle at 20% 10%, rgba(155, 224, 111, 0.18), transparent 32%),
    #fbfaf7;
}

.about-section__head {
  max-width: 980px;
}

.about-section__head h2 {
  text-align: left;
}

.explore-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.explore-card {
  min-height: 340px;
  display: grid;
  grid-template-rows: 136px auto 1fr auto;
  gap: 14px;
  padding: 18px;
  border-radius: 8px;
  color: var(--brand-ink);
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--brand-line-soft);
  box-shadow: 0 18px 46px -36px rgba(35, 45, 39, 0.32);
  transition:
    transform var(--d-fast) ease,
    box-shadow var(--d-fast) ease;
}

.explore-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 56px -34px rgba(35, 45, 39, 0.42);
}

.explore-card img {
  border-radius: 6px;
  background: #edf5ef;
}

.explore-card span {
  color: var(--brand-ink-soft);
  font-size: clamp(1.35rem, 1.7vw, 1.65rem);
  font-weight: 950;
  line-height: 1.08;
}

.explore-card p {
  font-size: 1.05rem;
  line-height: 1.45;
}

.explore-card strong {
  color: #2f6e69;
  font-size: 1.4rem;
}

.about-footer {
  padding: 28px var(--gutter) 36px;
  color: var(--brand-ink-muted);
  background: #f7f0e4;
  border-top: 1px solid var(--brand-line-soft);
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
}

[data-rise] {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 820ms var(--ease-out-expo) var(--rise-delay, 0ms),
    transform 820ms var(--ease-out-expo) var(--rise-delay, 0ms);
  will-change: opacity, transform;
}

[data-rise="fade-left"] {
  transform: translateX(34px);
}

[data-rise="fade-right"] {
  transform: translateX(-34px);
}

[data-rise="fade-scale"] {
  transform: translateY(16px) scale(0.97);
}

[data-rise].is-in {
  opacity: 1;
  transform: none;
  will-change: auto;
}

@media (max-width: 1100px) {
  .explore-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .about-hero {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 34px;
    padding-block: calc(var(--nav-h) + 70px) 56px;
  }

  .about-hero::after {
    display: none;
  }

  .about-hero__copy {
    justify-self: start;
  }

  .about-hero__media {
    position: relative;
    inset: auto;
    width: 100%;
    height: 48vh;
    min-height: 340px;
    border-radius: 34px;
  }

  .about-hero h1 {
    font-size: clamp(4rem, 15vw, 7rem);
  }

  .about-hero em {
    font-size: clamp(3.8rem, 15vw, 7.2rem);
  }

  .about-section {
    min-height: auto;
    grid-template-columns: 1fr;
    padding-block: calc(var(--nav-h) + 56px) 64px;
  }

  .approach-item,
  .approach-item:nth-child(even) {
    grid-template-columns: 1fr;
    gap: 14px;
    text-align: left;
  }

  .approach-item:nth-child(even) .approach-item__num,
  .approach-item:nth-child(even) .approach-item__body {
    order: unset;
    text-align: left;
    justify-self: stretch;
  }

  .approach-item__num {
    line-height: 0.92;
  }

  .purpose-showcase {
    min-height: auto;
    min-height: 86vh;
  }

  .purpose-showcase__copy {
    padding-block: calc(var(--nav-h) + 56px) 64px;
  }

  .purpose-showcase h2 {
    font-size: clamp(3rem, 11vw, 5.6rem);
  }

  .about-values__image {
    width: 56vw;
    opacity: 0.48;
  }

  .about-section__head h2 {
    text-align: center;
  }

  .about-section__head {
    margin-inline: auto;
    text-align: center;
  }

  .about-section--sustainability {
    min-height: auto;
    padding-block: calc(var(--nav-h) + 72px) 72px;
  }

  .sustainability-layout {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 28px;
  }

  .about-section--sustainability .sustainability-headline {
    max-width: 680px;
    font-size: clamp(3.7rem, 13vw, 6.4rem);
  }

  .sustainability-copy {
    max-width: 620px;
  }
}

@media (max-width: 640px) {
  .about-hero {
    padding-inline: var(--gutter);
  }

  .about-hero h1 {
    font-size: clamp(3.55rem, 18vw, 5.2rem);
  }

  .about-hero em {
    font-size: clamp(3.2rem, 17vw, 5rem);
  }

  .about-section h2 {
    font-size: clamp(2.8rem, 15vw, 4.7rem);
  }

  .about-section--sustainability .sustainability-headline {
    font-size: clamp(3.35rem, 16vw, 4.9rem);
  }

  .about-section--photo .sustainability-copy p {
    font-size: 1.06rem;
  }

  .purpose-showcase h2 {
    font-size: clamp(2.75rem, 13vw, 4.35rem);
  }

  .about-section--values::before {
    background:
      linear-gradient(180deg, rgba(210, 228, 233, 0.94) 0%, rgba(229, 237, 238, 0.98) 46%, rgba(174, 196, 223, 0.94) 100%),
      radial-gradient(ellipse at 50% 44%, rgba(248, 249, 246, 0.9) 0 18%, rgba(221, 233, 236, 0.62) 45%, transparent 70%);
  }

  .about-values__image {
    width: 72vw;
    opacity: 0.36;
  }

  .about-values__image--left {
    top: 0;
    bottom: auto;
    height: 52%;
  }

  .about-values__image--right {
    top: auto;
    bottom: 0;
    height: 52%;
  }

  .explore-grid {
    grid-template-columns: 1fr;
  }

  .explore-card {
    min-height: 280px;
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
