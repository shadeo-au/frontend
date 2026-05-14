import { gsap, prefersReducedMotion, ScrollTrigger } from './gsap';

const NATIVE_SCROLL_SELECTOR = [
  '[data-native-scroll]',
  '.leaflet-container',
  '.leaflet-pane',
  '.leaflet-control',
  '.maplibregl-map',
  '.maplibregl-canvas',
  '.maplibregl-control-container',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
].join(',');

const INTERACTIVE_KEY_TARGET_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'textarea',
  'select',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[contenteditable="true"]',
].join(',');

const KEY_SCROLL_STEPS: Record<string, (viewport: number, maxScroll: number) => number> = {
  ArrowDown: () => 92,
  ArrowUp: () => -92,
  PageDown: (viewport) => viewport * 0.86,
  PageUp: (viewport) => -viewport * 0.86,
  Home: (_viewport, maxScroll) => -maxScroll,
  End: (_viewport, maxScroll) => maxScroll,
};

let enabled = false;
let currentY = 0;
let targetY = 0;
let isTicking = false;
let isProgrammaticScroll = false;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getScroller = () => document.scrollingElement ?? document.documentElement;

const getMaxScroll = () => Math.max(0, getScroller().scrollHeight - window.innerHeight);

const normalizeWheelDelta = (event: WheelEvent) => {
  const modeMultiplier = event.deltaMode === 1
    ? 18
    : event.deltaMode === 2
      ? window.innerHeight
      : 1;

  return event.deltaY * modeMultiplier;
};

const canScrollInside = (el: HTMLElement, deltaY: number) => {
  if (Math.abs(deltaY) < 0.5) return false;

  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const canOverflow = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  if (!canOverflow || el.scrollHeight <= el.clientHeight + 1) return false;

  return deltaY > 0
    ? el.scrollTop + el.clientHeight < el.scrollHeight - 1
    : el.scrollTop > 1;
};

const shouldUseNativeScroll = (target: EventTarget | null, deltaY = 0) => {
  if (!(target instanceof Element)) return false;
  if (target.closest(NATIVE_SCROLL_SELECTOR)) return true;

  let el: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
  while (el && el !== document.body && el !== document.documentElement) {
    if (canScrollInside(el, deltaY)) return true;
    el = el.parentElement;
  }

  return false;
};

const shouldKeepNativeKeyboard = (target: EventTarget | null) => (
  target instanceof Element && Boolean(target.closest(INTERACTIVE_KEY_TARGET_SELECTOR))
);

const syncToWindow = () => {
  currentY = window.scrollY;
  targetY = currentY;
};

const stopTicker = () => {
  if (!isTicking) return;
  gsap.ticker.remove(tick);
  isTicking = false;
};

const tick = () => {
  const maxScroll = getMaxScroll();
  targetY = clamp(targetY, 0, maxScroll);

  const deltaRatio = gsap.ticker.deltaRatio(60);
  const easeAmount = 1 - Math.pow(0.82, deltaRatio);
  currentY += (targetY - currentY) * easeAmount;

  if (Math.abs(targetY - currentY) < 0.35) {
    currentY = targetY;
    window.scrollTo(0, Math.round(currentY));
    ScrollTrigger.update();
    stopTicker();
    isProgrammaticScroll = false;
    return;
  }

  isProgrammaticScroll = true;
  window.scrollTo(0, currentY);
  ScrollTrigger.update();
};

const startTicker = () => {
  if (isTicking) return;
  gsap.ticker.add(tick);
  isTicking = true;
};

const scrollBySmooth = (deltaY: number) => {
  targetY = clamp(targetY + deltaY, 0, getMaxScroll());
  startTicker();
};

const onWheel = (event: WheelEvent) => {
  if (!enabled || event.defaultPrevented || event.ctrlKey || event.metaKey) return;

  const verticalDelta = normalizeWheelDelta(event);
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(verticalDelta) < 0.5) return;
  if (shouldUseNativeScroll(event.target, verticalDelta)) return;

  event.preventDefault();
  scrollBySmooth(verticalDelta);
};

const onKeyDown = (event: KeyboardEvent) => {
  if (!enabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (shouldKeepNativeKeyboard(event.target) || shouldUseNativeScroll(event.target)) return;

  const key = event.key === ' ' ? (event.shiftKey ? 'PageUp' : 'PageDown') : event.key;
  const resolveStep = KEY_SCROLL_STEPS[key];
  if (!resolveStep) return;

  event.preventDefault();
  scrollBySmooth(resolveStep(window.innerHeight, getMaxScroll()));
};

const onNativeScroll = () => {
  if (!enabled || isProgrammaticScroll || isTicking) return;
  syncToWindow();
};

const onResize = () => {
  targetY = clamp(targetY, 0, getMaxScroll());
  currentY = clamp(window.scrollY, 0, getMaxScroll());
  ScrollTrigger.refresh();
};

export function enableSmoothScroll() {
  if (enabled || typeof window === 'undefined' || prefersReducedMotion()) return;

  enabled = true;
  syncToWindow();
  gsap.ticker.lagSmoothing(500, 33);

  document.documentElement.dataset.smoothScroll = 'true';
  document.addEventListener('wheel', onWheel, { passive: false, capture: true });
  document.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
}

export function disableSmoothScroll() {
  if (!enabled) return;

  enabled = false;
  stopTicker();
  document.documentElement.removeAttribute('data-smooth-scroll');
  document.removeEventListener('wheel', onWheel, { capture: true });
  document.removeEventListener('keydown', onKeyDown, { capture: true });
  window.removeEventListener('scroll', onNativeScroll);
  window.removeEventListener('resize', onResize);
}
