<script setup lang="ts">
import BrandWatermark from './BrandWatermark.vue';

withDefaults(
  defineProps<{
    id?: string;
    imageSrc?: string;
    videoSrc?: string;
    imageAlt?: string;
    sideLabel?: string;
  }>(),
  {
    id: 'hero',
    imageAlt: '',
    sideLabel: '',
  }
);
</script>

<template>
  <section :id="id" class="hero-blend">
    <BrandWatermark />
    <span v-if="sideLabel" class="hero-blend__side-label">{{ sideLabel }}</span>

    <div class="hero-blend__art" aria-hidden="true">
      <video
        v-if="videoSrc"
        :src="videoSrc"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
      />
      <img v-else-if="imageSrc" :src="imageSrc" :alt="imageAlt" />
    </div>

    <div class="hero-blend__copy" data-rise>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.hero-blend {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  contain: layout paint style;
  display: grid;
  align-items: center;
  justify-items: end;
  padding: calc(var(--nav-h) + 56px) max(var(--gutter), calc((100vw - 1280px) / 2)) 58px;
  background:
    radial-gradient(circle at 78% 38%, var(--brand-glow-lime), transparent 0 28%, transparent 48%),
    var(--brand-paper-white);
}

.hero-blend__side-label {
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

.hero-blend__art {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  will-change: transform, opacity;
  animation: hb-art-in 1.2s cubic-bezier(0.16, 0.84, 0.44, 1) 0.08s both;
}

.hero-blend__art::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(12, 24, 18, 0.56) 0%, rgba(12, 24, 18, 0.34) 34%, rgba(12, 24, 18, 0.12) 64%, transparent 100%),
    linear-gradient(0deg, rgba(12, 24, 18, 0.46) 0%, rgba(12, 24, 18, 0.14) 36%, transparent 68%);
  pointer-events: none;
}

.hero-blend__art img,
.hero-blend__art video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.hero-blend__copy {
  position: relative;
  z-index: 2;
  width: min(45vw, 690px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: flex-start;
  justify-self: end;
  text-align: left;
  margin-inline-end: calc(clamp(72px, 8vw, 144px) * -1);
  will-change: transform, opacity;
  animation: hb-copy-in 0.88s cubic-bezier(0.16, 0.84, 0.44, 1) 0.32s both;
}

.hero-blend :slotted(h1) {
  max-width: 16ch;
  color: var(--brand-paper-white);
  font-family: var(--font-body);
  font-size: var(--brand-fs-hero);
  font-weight: 950;
  line-height: 0.96;
  letter-spacing: 0;
  text-wrap: balance;
}

.hero-blend :slotted(h1 em) {
  display: inline;
  color: #ffcf3d;
  font-style: normal;
}

.hero-blend :slotted(p) {
  max-width: 48ch;
  color: rgba(251, 250, 247, 0.88);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

/* ── Animations ─────────────────────────────────────────────── */
/* Image slides in from the right; copy strides in from the left.
   Contrast with HeroFullSection (zoom-in + rise from below). */
@keyframes hb-art-in {
  from {
    opacity: 0;
    transform: translateX(52px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes hb-copy-in {
  from {
    opacity: 0;
    transform: translateX(-36px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-blend__art,
  .hero-blend__copy {
    animation: none;
  }
}

@media (max-width: 980px) {
  .hero-blend {
    min-height: 100vh;
    padding-top: calc(var(--nav-h) + 44px);
    padding-bottom: 58px;
  }

  .hero-blend__copy {
    width: min(100%, 680px);
    align-items: flex-start;
    justify-self: start;
    text-align: left;
    margin-inline-end: 0;
  }

  .hero-blend__art {
    inset: 0;
  }

  .hero-blend :slotted(h1) {
    max-width: 10.5ch;
    font-size: clamp(2.85rem, 11vw, 5.25rem);
  }
}

@media (max-width: 640px) {
  .hero-blend {
    padding-inline: var(--gutter);
  }

  .hero-blend__side-label {
    display: none;
  }

  .hero-blend :slotted(h1) {
    max-width: 11.5ch;
    font-size: clamp(2.6rem, 11vw, 4rem);
    line-height: 1.04;
  }

  .hero-blend :slotted(p) {
    max-width: 34ch;
  }
}
</style>
