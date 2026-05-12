<script setup lang="ts">
import { computed } from 'vue';
import type { HouseWindow, Orientation, HousePlan } from '@/lib/selfcheck/types';

const props = defineProps<{
  window: HouseWindow;
  plan: HousePlan;
  sunlit: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', win: HouseWindow): void;
  (e: 'close'): void;
}>();

const ORIENTATIONS: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const roomLabel = computed(() =>
  props.plan.rooms.find((r) => r.id === props.window.roomId)?.label ?? 'room',
);

function setOrientation(o: Orientation) {
  emit('update', { ...props.window, orientation: o });
}

function toggleCurtain() {
  emit('update', { ...props.window, hasCurtain: !props.window.hasCurtain });
}

function toggleFan() {
  emit('update', { ...props.window, fanNearby: !props.window.fanNearby });
}
</script>

<template>
  <div class="we" role="dialog" aria-label="Window settings">
    <header class="we-head">
      <div>
        <span class="we-kicker">Window in</span>
        <strong>{{ roomLabel }}</strong>
      </div>
      <button class="we-close" type="button" aria-label="Close" @click="emit('close')">×</button>
    </header>

    <div v-if="sunlit" class="we-banner">
      This window will catch direct sun this afternoon.
    </div>

    <section class="we-section">
      <h5>Which way does it face?</h5>
      <div class="we-orient-grid">
        <button
          v-for="o in ORIENTATIONS"
          :key="o"
          type="button"
          :class="['we-orient', { 'is-active': window.orientation === o }]"
          @click="setOrientation(o)"
        >{{ o }}</button>
      </div>
    </section>

    <section class="we-section">
      <h5>What is set up at this window?</h5>
      <div class="we-toggles">
        <button
          type="button"
          :class="['we-toggle', { 'is-on': window.hasCurtain }]"
          @click="toggleCurtain"
        >
          <span class="we-toggle-mark"></span>
          <span>
            <strong>Has a curtain or blind</strong>
            <small>Anything that blocks sun: blind, sheet, curtain, blackout panel.</small>
          </span>
        </button>
        <button
          type="button"
          :class="['we-toggle', { 'is-on': window.fanNearby }]"
          @click="toggleFan"
        >
          <span class="we-toggle-mark"></span>
          <span>
            <strong>A fan is set up nearby</strong>
            <small>Pedestal, desk, or ceiling fan within a few steps of this window.</small>
          </span>
        </button>
      </div>
    </section>

    <footer class="we-foot">
      <button type="button" class="we-done" @click="emit('close')">Done</button>
    </footer>
  </div>
</template>

<style scoped>
.we {
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-clay-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 420px;
  width: 100%;
  border: 1.5px solid var(--brand-line);
}
.we-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.we-kicker {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.we-head strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 950;
}
.we-close {
  border: 0;
  background: transparent;
  font-size: 1.8rem;
  line-height: 1;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--brand-ink-muted);
}
.we-close:hover { background: rgba(35, 45, 39, 0.06); }
.we-banner {
  padding: 10px 14px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f6d597, #fbe1d3);
  color: #8b3f25;
  font-weight: 800;
  font-size: 0.95rem;
}
.we-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.we-section h5 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 900;
  margin: 0;
}
.we-orient-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.we-orient {
  min-height: 44px;
  border-radius: 12px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.we-orient:hover { background: var(--brand-lime-soft); }
.we-orient.is-active {
  background: var(--brand-lime);
  border-color: var(--brand-lime-hover);
  color: #142016;
}

.we-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.we-toggle {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  cursor: pointer;
  text-align: left;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.we-toggle:hover { background: var(--brand-lime-soft); }
.we-toggle-mark {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: transparent;
  border: 2px solid rgba(35, 45, 39, 0.32);
  margin-top: 2px;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.we-toggle.is-on {
  background: var(--brand-lime-soft);
  border-color: var(--brand-sage);
}
.we-toggle.is-on .we-toggle-mark {
  background: var(--brand-sage);
  border-color: var(--brand-sage);
  box-shadow: inset 0 0 0 3px var(--surface);
}
.we-toggle strong {
  display: block;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 900;
}
.we-toggle small {
  display: block;
  margin-top: 2px;
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
}
.we-foot {
  display: flex;
  justify-content: flex-end;
}
.we-done {
  min-height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  border: 0;
  background: var(--brand-ink-soft);
  color: var(--brand-paper-white);
  font-family: var(--font-body);
  font-weight: 900;
  cursor: pointer;
}
.we-done:hover { background: var(--brand-ink); }
</style>
