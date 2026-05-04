<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { CoolPlace, CoolPlaceType } from '@/lib/selfcheck/types';

defineProps<{
  places: CoolPlace[];
  viewAllHref?: string;
  highlightFirst?: boolean;
}>();

const scrollerRef = ref<HTMLElement | null>(null);
const canLeft = ref(false);
const canRight = ref(false);

function updateArrows() {
  const el = scrollerRef.value;
  if (!el) return;
  canLeft.value = el.scrollLeft > 6;
  canRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
}

function scrollBy(dir: 1 | -1) {
  const el = scrollerRef.value;
  if (!el) return;
  el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.86), behavior: 'smooth' });
}

let resizeObs: ResizeObserver | undefined;
onMounted(() => {
  updateArrows();
  scrollerRef.value?.addEventListener('scroll', updateArrows, { passive: true });
  resizeObs = new ResizeObserver(updateArrows);
  if (scrollerRef.value) resizeObs.observe(scrollerRef.value);
});
onBeforeUnmount(() => {
  scrollerRef.value?.removeEventListener('scroll', updateArrows);
  resizeObs?.disconnect();
});

function typeIcon(type: CoolPlaceType): string {
  switch (type) {
    case 'library':         return '📚';
    case 'community_centre': return '🏛️';
    case 'shopping_centre':  return '🛍️';
    case 'park':             return '🌳';
  }
}

function typeLabel(type: CoolPlaceType): string {
  switch (type) {
    case 'library':         return 'Library';
    case 'community_centre': return 'Community centre';
    case 'shopping_centre':  return 'Shopping centre';
    case 'park':             return 'Park';
  }
}

function distLabel(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
</script>

<template>
  <div class="cool-strip" data-native-scroll>
    <div class="cool-strip__controls">
      <button
        type="button"
        class="cool-strip__nav"
        :disabled="!canLeft"
        aria-label="Scroll left"
        @click="scrollBy(-1)"
      >‹</button>
      <button
        type="button"
        class="cool-strip__nav"
        :disabled="!canRight"
        aria-label="Scroll right"
        @click="scrollBy(1)"
      >›</button>
    </div>

    <div ref="scrollerRef" class="cool-strip__scroller">
      <article
        v-for="(p, i) in places"
        :key="p.id"
        :class="['place', { 'place--highlight': highlightFirst && i === 0 }]"
      >
        <div class="place__icon" aria-hidden="true">{{ typeIcon(p.type) }}</div>
        <div class="place__head">
          <small>{{ typeLabel(p.type) }} · {{ distLabel(p.distance_m) }}</small>
          <strong>{{ p.name }}</strong>
        </div>
        <p class="place__hours">{{ p.open_hours }}</p>
        <ul class="place__features">
          <li v-for="f in p.features" :key="f">{{ f }}</li>
        </ul>
      </article>

      <a v-if="viewAllHref" class="place place--cta" :href="viewAllHref">
        <strong>View all on Cool Routes</strong>
        <small>Plan a full walk and see shaded streets</small>
        <span class="place--cta__arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.cool-strip {
  position: relative;
}

.cool-strip__controls {
  position: absolute;
  top: -64px;
  right: 0;
  display: flex;
  gap: 8px;
}
.cool-strip__nav {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
  color: var(--brand-ink-soft);
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 900;
  cursor: pointer;
  transition: transform var(--d-fast) ease;
}
.cool-strip__nav:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #fff;
}
.cool-strip__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cool-strip__scroller {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--gutter);
  padding: 6px 4px 18px;
  margin-inline: -4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(35, 45, 39, 0.2) transparent;
}

.cool-strip__scroller::-webkit-scrollbar { height: 8px; }
.cool-strip__scroller::-webkit-scrollbar-track { background: transparent; }
.cool-strip__scroller::-webkit-scrollbar-thumb {
  background: rgba(35, 45, 39, 0.18);
  border-radius: 999px;
}

.place {
  flex: 0 0 280px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
  transition: transform var(--d-fast) ease, box-shadow var(--d-fast) ease;
}
.place:hover {
  transform: translateY(-3px);
  box-shadow: var(--sh-clay);
}
.place--highlight {
  background: linear-gradient(165deg, var(--brand-lime-soft), rgba(255, 255, 255, 0.9));
  border-color: rgba(91, 140, 97, 0.35);
}

.place__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--brand-paper);
  font-size: 1.4rem;
}

.place__head { display: flex; flex-direction: column; gap: 2px; }
.place__head small {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brand-sage);
}
.place__head strong {
  color: var(--brand-ink-soft);
  font-size: 1.1875rem;
  font-weight: 900;
  line-height: 1.18;
}

.place__hours {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 700;
}

.place__features {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
}
.place__features li {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(91, 140, 97, 0.12);
  color: #2f5c3b;
  font-size: 0.82rem;
  font-weight: 800;
}

.place--cta {
  background: linear-gradient(135deg, var(--brand-paper-white), rgba(252, 247, 235, 0.6));
  align-items: flex-start;
  justify-content: space-between;
  border-style: dashed;
  flex: 0 0 240px;
}
.place--cta strong { color: var(--brand-ink-soft); }
.place--cta small { color: var(--brand-ink-muted); font-size: 0.95rem; font-weight: 700; }
.place--cta__arrow {
  margin-top: auto;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-lime);
  color: #142016;
  font-size: 1.4rem;
  font-weight: 900;
}

@media (max-width: 640px) {
  .cool-strip__controls { display: none; }
  .place { flex: 0 0 78%; }
}
</style>
