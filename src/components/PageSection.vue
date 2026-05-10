<script setup lang="ts">
import BrandWatermark from './BrandWatermark.vue';

withDefaults(
  defineProps<{
    id: string;
    sideLabel?: string;
    tone?: 'warm' | 'lime' | 'plain';
    align?: 'left' | 'right';
    watermark?: boolean;
    sideWatermark?: boolean;
  }>(),
  {
    tone: 'warm',
    align: 'left',
    watermark: true,
    sideWatermark: true,
  }
);
</script>

<template>
  <section :id="id" :class="['page-section', `page-section--${tone}`, `page-section--${align}`]">
    <BrandWatermark v-if="watermark" />
    <BrandWatermark v-if="sideWatermark" placement="side" />
    <span v-if="sideLabel" class="page-section__side-label">{{ sideLabel }}</span>

    <div class="page-section__copy">
      <slot name="copy" />
    </div>

    <div class="page-section__visual" data-scroll-fade style="--fade-delay: 260ms">
      <slot name="visual" />
    </div>
  </section>
</template>

<style scoped>
.page-section {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  contain: layout paint style;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1fr);
  align-items: center;
  gap: clamp(44px, 6vw, 92px);
  padding: calc(var(--nav-h) + 54px) max(var(--gutter), calc((100vw - 1180px) / 2)) 58px;
}

.page-section--warm {
  background:
    radial-gradient(circle at 78% 24%, rgba(155, 224, 111, 0.1), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, #f7f2e8 100%);
}

.page-section--lime {
  background:
    radial-gradient(circle at 76% 42%, rgba(155, 224, 111, 0.24), transparent 0 26%, transparent 48%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, rgba(228, 248, 213, 0.46) 100%);
}

.page-section--plain {
  background: linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.page-section--right .page-section__copy {
  order: 2;
}

.page-section--right .page-section__visual {
  order: 1;
}

.page-section__side-label {
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

.page-section__copy {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  z-index: 2;
}

.page-section__visual {
  position: relative;
  z-index: 1;
}

[data-scroll-fade] {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 1040ms var(--ease-out-expo) var(--fade-delay, 0ms),
    transform 1040ms var(--ease-out-expo) var(--fade-delay, 0ms);
}

[data-scroll-fade].is-in {
  opacity: 1;
  transform: none;
}

.page-section :slotted(h2) {
  max-width: 14ch;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(2.45rem, 4vw, 4.45rem);
  font-weight: 500;
  line-height: 1.07;
  letter-spacing: 0;
  text-wrap: balance;
}

.page-section :slotted(p) {
  max-width: 46ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.08rem, 1.12vw, 1.2rem);
  font-weight: 500;
  line-height: 1.72;
}

.page-section :slotted(.section-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 10px;
}

@media (max-width: 980px) {
  .page-section {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 34px;
    padding-top: calc(var(--nav-h) + 44px);
  }

  .page-section--right .page-section__copy,
  .page-section--right .page-section__visual {
    order: initial;
  }

  .page-section :slotted(h2) {
    max-width: 14ch;
    font-size: clamp(2.4rem, 7vw, 4rem);
  }
}

@media (max-width: 640px) {
  .page-section {
    padding-inline: var(--gutter);
    padding-bottom: 42px;
  }

  .page-section__side-label {
    display: none;
  }

  .page-section :slotted(.section-actions) {
    flex-direction: column;
  }

  .page-section :slotted(.section-actions .btn) {
    width: 100%;
  }

  .page-section :slotted(h2) {
    max-width: 15ch;
    font-size: clamp(2.15rem, 9vw, 3.2rem);
    line-height: 1.08;
  }

  .page-section :slotted(p) {
    max-width: 34ch;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-scroll-fade] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
