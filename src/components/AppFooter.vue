<script setup lang="ts">
// Site-wide footer. Used on every page so brand, navigation, safety,
// data sources, and copyright stay consistent.
// Pages may pass page-specific notes (privacy notes, references) into the
// default slot — it renders as a small card above the safety disclaimer.

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'Why', href: '/why' },
  { label: 'Walk Planner', href: '/walk-planner' },
  { label: 'Awareness Map', href: '/awareness' },
  { label: 'Heat Check', href: '/self-check' },
  { label: 'Medicine Check', href: '/medicine-check' },
];
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <div class="app-footer__top">
        <div class="app-footer__brand">
          <a href="/" class="app-footer__wordmark" aria-label="Shadeo home">Shadeo</a>
          <p class="app-footer__tagline">
            Helping older adults stay safe and confident on hot days.
          </p>
        </div>

        <nav class="app-footer__nav" aria-label="Footer">
          <span class="app-footer__nav-title">Explore</span>
          <ul>
            <li v-for="link in footerLinks" :key="link.href">
              <a :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </nav>
      </div>

      <div v-if="$slots.default" class="app-footer__note">
        <slot />
      </div>

      <p class="app-footer__safety">
        <strong>Safety:</strong> Shadeo is for awareness and planning only. It does
        not replace medical advice. If you feel dizzy, confused, weak, very thirsty,
        or unwell during hot weather, seek medical help. In an emergency, call
        <strong>000</strong>.
      </p>

      <p class="app-footer__meta">
        <strong>Data sources:</strong> Shadeo uses publicly available heat-health
        guidance and open data — including ABS Census and SEIFA (2021), AURIN,
        OpenStreetMap, and City of Melbourne datasets for tree canopy, walking
        routes, and community facilities.
      </p>

      <p class="app-footer__meta">
        <strong>Acknowledgement of Country:</strong> Shadeo acknowledges the
        Traditional Owners of the lands across Greater Melbourne, the people of the
        Kulin Nation, and pays respect to their Elders past, present, and emerging.
      </p>

      <div class="app-footer__bar">
        <span>© 2026 ByteSleep</span>
        <span>A heat-safety companion for Greater Melbourne.</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--brand-ink-soft);
  color: rgba(248, 241, 227, 0.85);
  padding: clamp(44px, 6vw, 76px) 0 clamp(24px, 3vw, 36px);
}

.app-footer__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(20px, 3vw, 30px);
}

.app-footer__top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: clamp(28px, 5vw, 64px);
  padding-bottom: clamp(20px, 3vw, 30px);
  border-bottom: 1px solid rgba(248, 241, 227, 0.16);
}

.app-footer__brand {
  max-width: 38ch;
}

.app-footer__wordmark {
  display: inline-block;
  color: var(--brand-paper-white);
  font-family: var(--font-body);
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.01em;
}

.app-footer__tagline {
  margin: 10px 0 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
}

.app-footer__nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-footer__nav-title {
  color: rgba(248, 241, 227, 0.55);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.app-footer__nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 10px clamp(28px, 5vw, 56px);
}

.app-footer__nav a {
  color: rgba(248, 241, 227, 0.88);
  font-size: 1rem;
  font-weight: 700;
  transition: color var(--d-fast) ease;
}

.app-footer__nav a:hover,
.app-footer__nav a:focus-visible {
  color: var(--brand-lime);
}

.app-footer__note,
.app-footer__safety {
  margin: 0;
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.16);
}

.app-footer__safety {
  max-width: 96ch;
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
}

.app-footer__meta {
  margin: 0;
  max-width: 96ch;
  color: rgba(248, 241, 227, 0.7);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
}

.app-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}

/* Slot content is rendered in the parent's scope — :deep() lets the footer
   style page-specific notes (privacy notes, reference lists). */
.app-footer__note :deep(p) {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
}

.app-footer__note :deep(p + p),
.app-footer__note :deep(ul) {
  margin-top: 8px;
}

.app-footer__note :deep(ul) {
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-footer__note :deep(li) {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.55;
}

.app-footer__note :deep(strong) {
  color: var(--brand-paper-white);
  font-weight: 900;
}

.app-footer__bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  margin-top: clamp(6px, 1.4vw, 12px);
  padding-top: clamp(18px, 2.5vw, 24px);
  border-top: 1px solid rgba(248, 241, 227, 0.16);
  color: rgba(248, 241, 227, 0.62);
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .app-footer__nav ul {
    grid-template-columns: 1fr;
  }
}
</style>
