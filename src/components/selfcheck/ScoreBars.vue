<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ScoreResult } from '@/lib/selfcheck/types';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

const props = defineProps<{ result: ScoreResult }>();
const root = ref<HTMLElement | null>(null);
let ctx: gsap.Context | undefined;

const dims = [
  { key: 'location', label: 'Location exposure', value: () => props.result.locationExposureScore, tone: 'sun' as const },
  { key: 'personal', label: 'Personal sensitivity', value: () => props.result.personalSensitivityScore, tone: 'peach' as const },
  { key: 'home',     label: 'Home cooling risk',  value: () => props.result.homeCoolingRiskScore, tone: 'sage' as const },
  { key: 'social',   label: 'Support gap',        value: () => props.result.socialSupportGapScore, tone: 'sky' as const },
];

const animateBars = async () => {
  await nextTick();
  const fills = root.value?.querySelectorAll<HTMLElement>('.bar__fill') ?? [];
  if (!fills.length) return;

  gsap.killTweensOf(fills);
  gsap.set(fills, { transformOrigin: 'left center' });
  if (prefersReducedMotion()) {
    gsap.set(fills, { scaleX: 1 });
    return;
  }

  gsap.fromTo(fills, { scaleX: 0 }, { scaleX: 1, duration: 0.62, stagger: 0.08, ease: 'power3.out' });
};

onMounted(() => {
  ctx = gsap.context(() => {
    animateBars();
  }, root.value ?? undefined);
});

watch(() => props.result, animateBars, { deep: true });

onBeforeUnmount(() => {
  ctx?.revert();
});
</script>

<template>
  <div ref="root" class="bars">
    <div class="bars__total">
      <small>Total awareness score</small>
      <strong>
        {{ result.totalScore }}<span>/ 20</span>
      </strong>
    </div>

    <ul class="bars__list">
      <li v-for="d in dims" :key="d.key" :class="['bar', `bar--${d.tone}`]">
        <span class="bar__label">{{ d.label }}</span>
        <span class="bar__track" aria-hidden="true">
          <span class="bar__fill" :style="{ width: `${(d.value() / 5) * 100}%` }"></span>
          <span v-for="n in 5" :key="n" class="bar__tick"></span>
        </span>
        <span class="bar__value">{{ d.value() }}<small>/5</small></span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bars {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.bars__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-radius: 22px;
  background: var(--brand-paper);
  border: 1px solid var(--brand-line);
}
.bars__total small {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.bars__total strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2rem, 3.4vw, 2.8rem);
  font-weight: 950;
  line-height: 1;
}
.bars__total strong span {
  font-size: 0.5em;
  color: var(--brand-ink-muted);
  margin-left: 6px;
  font-weight: 800;
}

.bars__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar {
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr 60px;
  align-items: center;
  gap: 18px;
  padding: 12px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--brand-line-soft);
}

.bar__label {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 800;
}

.bar__track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.07);
  overflow: hidden;
}
.bar__fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transform-origin: left center;
  will-change: transform;
}
.bar__tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.5);
}
.bar__tick:nth-child(2) { left: 20%; }
.bar__tick:nth-child(3) { left: 40%; }
.bar__tick:nth-child(4) { left: 60%; }
.bar__tick:nth-child(5) { left: 80%; }
.bar__tick:nth-child(6) { left: 100%; }

.bar__value {
  text-align: right;
  color: var(--brand-ink);
  font-size: 1.2rem;
  font-weight: 900;
  font-family: var(--font-body);
}
.bar__value small { color: var(--brand-ink-muted); font-weight: 700; font-size: 0.7em; margin-left: 2px; }

.bar--sun  .bar__fill { background: linear-gradient(90deg, var(--brand-gold), #d77252); }
.bar--peach .bar__fill { background: linear-gradient(90deg, var(--peach), #d77252); }
.bar--sage .bar__fill { background: linear-gradient(90deg, var(--brand-sage), var(--shade-deep)); }
.bar--sky  .bar__fill { background: linear-gradient(90deg, var(--brand-sky), #6a9fb5); }

@media (max-width: 640px) {
  .bar { grid-template-columns: 1fr; gap: 8px; }
  .bar__value { text-align: left; }
}
</style>
