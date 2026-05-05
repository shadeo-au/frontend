<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string;
    imageSrc: string;
    imageAlt?: string;
  }>(),
  {
    id: 'hero-full',
    imageAlt: '',
  }
);
</script>

<template>
  <section :id="id" class="hero-full" aria-label="Hero">
    <!-- Background image -->
    <div class="hero-full__art" aria-hidden="true">
      <img :src="imageSrc" :alt="imageAlt" />
    </div>

    <!-- Dark gradient veil for text legibility -->
    <div class="hero-full__veil" aria-hidden="true" />

    <!-- Copy: large heading only, white -->
    <div class="hero-full__copy">
      <slot />
    </div>
  </section>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */
.hero-full {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 540px;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  padding: 0 max(var(--gutter), calc((100vw - 1280px) / 2)) clamp(52px, 8vh, 96px);
}

/* ── Background image ───────────────────────────────────────── */
.hero-full__art {
  position: absolute;
  inset: 0;
  z-index: 0;
  animation: hf-image-in 1.4s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

.hero-full__art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  transform-origin: center;
}

/* ── Gradient veil ──────────────────────────────────────────── */
.hero-full__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(
      to top,
      rgba(8, 10, 8, 0.78) 0%,
      rgba(8, 10, 8, 0.44) 28%,
      rgba(8, 10, 8, 0.14) 52%,
      transparent 72%
    );
  pointer-events: none;
}

/* ── Copy block ─────────────────────────────────────────────── */
.hero-full__copy {
  position: relative;
  z-index: 2;
  width: min(100%, 860px);
  animation: hf-copy-rise 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) 0.72s both;
}

.hero-full :slotted(h1) {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-body);
  font-size: var(--brand-fs-hero);
  font-weight: 950;
  line-height: 1.04;
  letter-spacing: 0;
  text-wrap: balance;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.28);
}

/* ── Animations ─────────────────────────────────────────────── */
@keyframes hf-image-in {
  from {
    opacity: 0;
    transform: scale(1.06);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes hf-copy-rise {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Reduced motion ─────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .hero-full__art,
  .hero-full__copy {
    animation: none;
  }
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 980px) {
  .hero-full {
    height: auto;
    min-height: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 26px;
    padding: calc(var(--nav-h) + 44px) var(--gutter) 34px;
    background: var(--brand-paper-white);
  }

  .hero-full__art {
    position: relative;
    inset: auto;
    order: 2;
    aspect-ratio: 16 / 9;
    border-radius: 42px;
    overflow: hidden;
    background: var(--brand-paper);
  }

  .hero-full__art img {
    object-fit: contain;
    object-position: center;
  }

  .hero-full__veil {
    display: none;
  }

  .hero-full__copy {
    order: 1;
    width: min(100%, 680px);
    padding-inline: 0;
  }

  .hero-full :slotted(h1) {
    color: var(--brand-ink);
    text-shadow: none;
    font-size: clamp(2.85rem, 11vw, 5.25rem);
  }
}

@media (max-width: 640px) {
  .hero-full {
    padding-inline: var(--gutter);
    padding-bottom: 28px;
    gap: 22px;
  }

  .hero-full__art {
    border-radius: 30px;
  }

  .hero-full :slotted(h1) {
    font-size: clamp(2.5rem, 12vw, 3.8rem);
    line-height: 1.06;
  }
}
</style>
