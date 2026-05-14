<script setup lang="ts">
/**
 * Small "i" info icon with a tooltip bubble.
 *
 * The bubble is rendered at <body> level via <Teleport>, with its viewport
 * position computed from the trigger's bounding rect on show. This is what
 * lets the bubble appear correctly even when the trigger sits inside a
 * container with `overflow: auto/hidden` (which would normally clip a
 * `position: absolute` tooltip).
 *
 * The bubble clamps to viewport edges so it never overflows the screen on
 * narrow widths or near-the-edge triggers.
 */
import { onBeforeUnmount, ref } from 'vue';

defineProps<{
  /** Accessible label for the trigger button. */
  label?: string;
}>();

const triggerRef = ref<HTMLButtonElement | null>(null);
const isShown = ref(false);
const pos = ref({ top: 0, left: 0 });

const BUBBLE_GAP = 10;       // px gap between trigger and bubble
const BUBBLE_WIDTH = 260;    // matches min() upper bound in CSS
const VIEWPORT_INSET = 12;   // keep bubble at least this far from screen edges

const reposition = () => {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  let left = rect.left + rect.width / 2;        // viewport-x; CSS centers around this
  // Clamp so the bubble (width BUBBLE_WIDTH) stays inside the viewport
  const halfBubble = BUBBLE_WIDTH / 2;
  const minLeft = VIEWPORT_INSET + halfBubble;
  const maxLeft = window.innerWidth - VIEWPORT_INSET - halfBubble;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;
  pos.value = {
    top: rect.top - BUBBLE_GAP,
    left,
  };
};

const show = () => {
  reposition();
  isShown.value = true;
  // Keep the bubble glued to the trigger if the page scrolls or resizes
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);
};

const hide = () => {
  isShown.value = false;
  window.removeEventListener('scroll', reposition, true);
  window.removeEventListener('resize', reposition);
};

onBeforeUnmount(hide);
</script>

<template>
  <span class="info-tip">
    <button
      ref="triggerRef"
      type="button"
      :aria-label="label ?? 'More information'"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
    >i</button>
    <Teleport to="body">
      <span
        v-if="isShown"
        class="info-tip__bubble"
        role="tooltip"
        :style="{ top: pos.top + 'px', left: pos.left + 'px' }"
      >
        <slot />
      </span>
    </Teleport>
  </span>
</template>

<style scoped>
.info-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
}

.info-tip button {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(98, 133, 107, 0.28);
  border-radius: 50%;
  background: rgba(98, 133, 107, 0.12);
  color: var(--shade-deep);
  font-family: var(--font-editorial);
  font-size: 0.76rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1;
  cursor: help;
  transition: background 180ms ease, border-color 180ms ease;
}

.info-tip button:hover,
.info-tip button:focus-visible {
  border-color: rgba(98, 133, 107, 0.5);
  background: rgba(228, 248, 213, 0.55);
}
</style>

<style>
/* Bubble is teleported to <body>, so its styles must be global (unscoped). */
.info-tip__bubble {
  position: fixed;
  z-index: 6000;
  width: min(260px, calc(100vw - 24px));
  padding: 12px 14px;
  border: 1px solid rgba(35, 45, 39, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 26px rgba(20, 26, 22, 0.18);
  color: var(--brand-ink-muted, #4d5450);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  pointer-events: none;
  /* anchor: viewport-relative top/left set inline; transform centers the bubble
     horizontally on the trigger and lifts it above. */
  transform: translate(-50%, -100%);
  animation: info-tip-in 140ms ease-out both;
}

.info-tip__bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgba(35, 45, 39, 0.12);
  border-bottom: 1px solid rgba(35, 45, 39, 0.12);
  background: rgba(255, 255, 255, 0.98);
  transform: translateX(-50%) rotate(45deg);
}

@keyframes info-tip-in {
  from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); }
  to   { opacity: 1; transform: translate(-50%, -100%); }
}
</style>
