<script setup lang="ts">
import BrandWatermark from './BrandWatermark.vue';

withDefaults(
  defineProps<{
    id?: string;
    imageSrc: string;
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
      <img :src="imageSrc" :alt="imageAlt" />
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
  padding: var(--nav-h) max(var(--gutter), calc((100vw - 1280px) / 2)) 58px;
  background:
    linear-gradient(38deg, rgba(226, 245, 239, 0.88) 0%, rgba(244, 249, 231, 0.68) 34%, rgba(251, 250, 247, 0.96) 66%, var(--brand-paper-white) 100%),
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
  border-radius: 0;
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
    linear-gradient(180deg, rgba(251, 250, 247, 1) 0%, rgba(251, 250, 247, 0.9) 7%, rgba(251, 250, 247, 0.28) 20%, transparent 36%),
    radial-gradient(ellipse 56% 96% at 18% 52%, rgba(251, 250, 247, 1) 0%, rgba(251, 250, 247, 0.98) 34%, rgba(251, 250, 247, 0.72) 56%, rgba(251, 250, 247, 0.26) 78%, transparent 100%),
    radial-gradient(ellipse 30% 72% at 45% 58%, rgba(251, 250, 247, 0.58) 0%, rgba(251, 250, 247, 0.22) 48%, transparent 82%),
    linear-gradient(90deg, rgba(251, 250, 247, 1) 0%, rgba(251, 250, 247, 0.92) 24%, rgba(251, 250, 247, 0.44) 48%, transparent 72%),
    linear-gradient(0deg, rgba(251, 250, 247, 0.92) 0%, rgba(251, 250, 247, 0.38) 18%, transparent 42%);
  pointer-events: none;
}

.hero-blend__art img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
}

.hero-blend__copy {
  position: relative;
  z-index: 2;
  width: min(47vw, 660px);
  display: flex;
  flex-direction: column;
  gap: 30px;
  transform: translateY(74px);
  will-change: transform, opacity;
  animation: hb-copy-in 0.88s cubic-bezier(0.16, 0.84, 0.44, 1) 0.32s both;
}

.hero-blend :slotted(h1) {
  max-width: 12.5ch;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(3.15rem, 5.2vw, 5.85rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: balance;
}

.hero-blend :slotted(p) {
  max-width: 42ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.08rem, 1.16vw, 1.22rem);
  font-weight: 500;
  line-height: 1.72;
}

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
    transform: translate(0, 74px);
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
    min-height: auto;
    padding-top: calc(var(--nav-h) + 44px);
    padding-bottom: 430px;
  }

  .hero-blend__copy {
    width: min(100%, 680px);
  }

  .hero-blend__art {
    inset: auto var(--gutter) 28px var(--gutter);
    height: 410px;
    border-radius: 42px;
  }

  .hero-blend :slotted(h1) {
    max-width: 10.5ch;
    font-size: clamp(2.85rem, 11vw, 5.25rem);
  }
}

@media (max-width: 640px) {
  .hero-blend {
    padding-inline: var(--gutter);
    padding-bottom: 340px;
  }

  .hero-blend__art {
    height: 320px;
    border-radius: 30px;
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
