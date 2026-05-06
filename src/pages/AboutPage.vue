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
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
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
        <div class="about-hero__copy" data-rise>
          <h1>Comfort,<em>every age.</em></h1>
        </div>
        <div class="about-hero__media" aria-hidden="true">
          <img src="/aboutus-1.jpg" alt="" />
        </div>
      </section>

      <AboutSubNav />

      <section id="purpose-mission" class="purpose-showcase">
        <div class="purpose-showcase__media" aria-hidden="true">
          <img src="/aboutus-2.jpg" alt="" />
        </div>
        <div class="purpose-showcase__copy" data-rise>
          <div id="purpose" class="purpose-showcase__statement">
            <h2><em>We believe</em></h2>
            <p>summer should belong to everyone - at every age.</p>
          </div>
          <div id="mission" class="purpose-showcase__statement">
            <h2><em>Our mission</em></h2>
            <p>is to help older Australians face heat with clarity, calm, and confidence.</p>
          </div>
        </div>
      </section>

      <section id="approach" class="about-section about-section--split">
        <div class="about-section__copy" data-rise>
          <h2>Help, <em>not hype.</em></h2>
          <p>
            Shadeo uses simple language, local context, and respectful guidance. Every map,
            result, and page is built to inform without alarming, guide without lecturing,
            and support without watching.
          </p>
          <p>
            We do not ask you to log in. We do not store your details. We give you what
            you need - clearly, locally, and at your own pace.
          </p>
        </div>
        <div class="about-section__image" data-rise style="--rise-delay: 90ms">
          <img src="/awarenesspage.png" alt="A warm illustration of older people, local places, and care planning." />
        </div>
      </section>

      <section id="values" class="about-section about-section--values">
        <div class="about-section__copy about-section__copy--center" data-rise>
          <h2>Five words to <em>live by.</em></h2>
          <p><strong>Calm, Care, Local, Private, Practical</strong> - the principles behind every choice we make.</p>
          <p>
            They mark the difference between feeling supported and feeling watched,
            between being prepared and being scared, between knowing your neighbourhood
            and being told about everywhere else.
          </p>
        </div>
      </section>

      <ValueMarquee />

      <section id="story" class="about-section about-section--photo about-section--story">
        <div class="about-section__bg" aria-hidden="true">
          <img src="/awarenesspage.png" alt="" />
        </div>
        <div class="about-section__copy" data-rise>
          <span class="about-kicker">Why Shadeo exists</span>
          <h2>As summers <em>change,</em> so do we.</h2>
          <p>General heat advice talks to everyone, which means it talks to no one in particular.</p>
          <p>
            For older adults, heat lands differently - in the body, in the home,
            in the daily routine. The information that exists rarely meets people
            where they live.
          </p>
          <p>
            Shadeo bridges that gap. Local data, personal context, simple language -
            so summer can stay something to enjoy, not endure.
          </p>
          <a href="/why" class="about-inline-link">See the data behind why this matters -></a>
        </div>
      </section>

      <section id="inclusion" class="about-section about-section--inclusion">
        <div class="about-section__copy about-section__copy--center" data-rise>
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
        <div class="about-section__head" data-rise>
          <h2>Now, <em>explore.</em></h2>
        </div>

        <div class="explore-grid">
          <a href="/awareness" class="explore-card" data-rise>
            <img src="/awareness.png" alt="" />
            <span>Awareness Map</span>
            <p>See where older residents may benefit from extra attention during heat.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/self-check" class="explore-card" data-rise style="--rise-delay: 70ms">
            <img src="/check-icon.png" alt="" />
            <span>Self-Check</span>
            <p>Reflect on your day, your home, and the support around you.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/walk-planner" class="explore-card" data-rise style="--rise-delay: 140ms">
            <img src="/route-icon.png" alt="" />
            <span>Walk Planner</span>
            <p>Compare cooler daily routes to nearby essential places.</p>
            <strong aria-hidden="true">-></strong>
          </a>

          <a href="/why" class="explore-card" data-rise style="--rise-delay: 210ms">
            <img src="/problem-icon1.png" alt="" />
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

.about-page :target {
  scroll-margin-top: calc(var(--nav-h) + 120px);
}

.about-hero,
.about-section,
.purpose-showcase {
  position: relative;
  isolation: isolate;
  overflow: hidden;
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
  scroll-margin-top: 150px;
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

.about-section--photo h2,
.about-section--photo p {
  color: var(--brand-paper-white);
}

.about-section--purpose .about-section__copy {
  text-shadow: 0 1px 24px rgba(0, 0, 0, 0.28);
}

.about-section--quiet {
  background:
    radial-gradient(circle at 20% 22%, rgba(168, 212, 226, 0.36), transparent 34%),
    linear-gradient(135deg, #fbfaf7 0%, #edf5ef 100%);
}

.about-section--split {
  grid-template-columns: minmax(0, 0.85fr) minmax(360px, 1fr);
  gap: clamp(38px, 6vw, 92px);
  background:
    radial-gradient(circle at 84% 42%, rgba(239, 166, 43, 0.14), transparent 32%),
    #fbfaf7;
}

.about-section--split h2 {
  text-align: left;
}

.about-section__image {
  height: min(68vh, 620px);
  min-height: 420px;
  border-radius: 48px;
  overflow: hidden;
  box-shadow: var(--brand-shadow-panel);
}

.about-section--values {
  background:
    radial-gradient(circle at 82% 22%, rgba(155, 224, 111, 0.22), transparent 30%),
    linear-gradient(180deg, #fbfaf7 0%, #f7f0e4 100%);
}

.about-section--values strong {
  color: var(--brand-ink-soft);
  font-weight: 950;
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
}

.about-inline-link:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
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
    opacity var(--d-long) var(--ease-out-expo) var(--rise-delay, 0ms),
    transform var(--d-long) var(--ease-out-expo) var(--rise-delay, 0ms);
}

[data-rise].is-in {
  opacity: 1;
  transform: none;
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

  .about-section,
  .about-section--split {
    min-height: auto;
    grid-template-columns: 1fr;
    padding-block: calc(var(--nav-h) + 56px) 64px;
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

  .about-section__image {
    min-height: 320px;
    height: 48vh;
  }

  .about-section--split h2,
  .about-section__head h2 {
    text-align: center;
  }

  .about-section--split .about-section__copy,
  .about-section__head {
    margin-inline: auto;
    text-align: center;
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

  .purpose-showcase h2 {
    font-size: clamp(2.75rem, 13vw, 4.35rem);
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
