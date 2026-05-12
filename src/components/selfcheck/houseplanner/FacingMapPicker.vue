<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { FloorLevel, Orientation, SuburbIndexEntry } from '@/lib/selfcheck/types';

const props = defineProps<{
  suburb: SuburbIndexEntry | null;
  facing: Orientation;
  floorLevel: FloorLevel;
}>();

const emit = defineEmits<{
  (e: 'update:facing', v: Orientation): void;
  (e: 'update:floorLevel', v: FloorLevel): void;
}>();

const COMPASS_ORDER: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const userLat = ref<number | null>(null);
const userLng = ref<number | null>(null);
const locationStatus = ref<'idle' | 'locating' | 'granted' | 'denied' | 'fallback'>('idle');
const rotationDeg = ref<number>(orientationToDeg(props.facing));
const dragging = ref(false);

function orientationToDeg(o: Orientation): number {
  return COMPASS_ORDER.indexOf(o) * 45;
}

function degToOrientation(deg: number): Orientation {
  const normalised = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalised / 45) % 8;
  return COMPASS_ORDER[idx];
}

// keep external orientation in sync when rotation changes
watch(rotationDeg, (deg) => {
  const o = degToOrientation(deg);
  if (o !== props.facing) emit('update:facing', o);
});

// re-snap rotation when external orientation changes (e.g. reset)
watch(
  () => props.facing,
  (next) => {
    if (degToOrientation(rotationDeg.value) !== next) {
      rotationDeg.value = orientationToDeg(next);
    }
  },
);

const lat = computed(() => userLat.value ?? props.suburb?.lat ?? null);
const lng = computed(() => userLng.value ?? props.suburb?.lng ?? null);

// OSM tile math, zoom 16 for street-level context.
const ZOOM = 16;
function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z);
}

interface TileInfo {
  url: string;
  // pixel offset within the 256-tile to centre user
  px: number;
  py: number;
  tileX: number;
  tileY: number;
}

const tile = computed<TileInfo | null>(() => {
  if (lat.value == null || lng.value == null) return null;
  const tx = lonToTileX(lng.value, ZOOM);
  const ty = latToTileY(lat.value, ZOOM);
  const tileX = Math.floor(tx);
  const tileY = Math.floor(ty);
  return {
    url: `https://tile.openstreetmap.org/${ZOOM}/${tileX}/${tileY}.png`,
    px: (tx - tileX) * 256,
    py: (ty - tileY) * 256,
    tileX,
    tileY,
  };
});

// also load the surrounding tiles (one ring around) so user near tile edge still has context
const tiles = computed<Array<{ url: string; dx: number; dy: number }>>(() => {
  if (!tile.value) return [];
  const { tileX, tileY } = tile.value;
  const out: Array<{ url: string; dx: number; dy: number }> = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      out.push({
        url: `https://tile.openstreetmap.org/${ZOOM}/${tileX + dx}/${tileY + dy}.png`,
        dx,
        dy,
      });
    }
  }
  return out;
});

async function requestLocation() {
  if (!('geolocation' in navigator)) {
    locationStatus.value = 'fallback';
    return;
  }
  locationStatus.value = 'locating';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat.value = pos.coords.latitude;
      userLng.value = pos.coords.longitude;
      locationStatus.value = 'granted';
    },
    () => {
      locationStatus.value = props.suburb ? 'fallback' : 'denied';
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
  );
}

const stageRef = ref<HTMLDivElement | null>(null);

function onPointerDown(ev: PointerEvent) {
  dragging.value = true;
  (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
  updateRotationFromEvent(ev);
}
function onPointerMove(ev: PointerEvent) {
  if (!dragging.value) return;
  updateRotationFromEvent(ev);
}
function onPointerUp(ev: PointerEvent) {
  dragging.value = false;
  (ev.currentTarget as Element).releasePointerCapture?.(ev.pointerId);
  // snap to nearest 45°
  rotationDeg.value = orientationToDeg(degToOrientation(rotationDeg.value));
}

function updateRotationFromEvent(ev: PointerEvent) {
  const stage = stageRef.value;
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI;
  // angle is from east axis, ccw negative. Convert to compass (from north, clockwise).
  let deg = angle + 90;
  deg = ((deg % 360) + 360) % 360;
  rotationDeg.value = deg;
}

onMounted(() => {
  requestLocation();
});
onBeforeUnmount(() => {
  dragging.value = false;
});

const FLOORS: Array<{ value: FloorLevel; label: string }> = [
  { value: 'ground', label: 'Ground floor' },
  { value: 'middle', label: 'Middle floor' },
  { value: 'top', label: 'Top floor' },
  { value: 'unknown', label: 'Not sure' },
];

const showFallbackPicker = computed(() => locationStatus.value === 'denied' || !lat.value);
</script>

<template>
  <div class="fmp">
    <header class="fmp-head">
      <h4>Point your home the right way</h4>
      <p>
        Rotate the house outline below so the <strong style="color:#b83a2c">red front door arrow</strong>
        points toward your real-world front street.
        <span v-if="locationStatus === 'granted'">We're showing the area around your current location.</span>
        <span v-else-if="locationStatus === 'fallback'">Using the centre of {{ suburb?.name }} as a reference.</span>
        <span v-else-if="locationStatus === 'locating'">Locating you…</span>
      </p>
    </header>

    <div class="fmp-stage-row">
      <div class="fmp-stage" ref="stageRef">
        <div v-if="!showFallbackPicker && tile" class="fmp-tile-canvas">
          <div
            v-for="t in tiles"
            :key="t.url"
            class="fmp-tile"
            :style="{
              transform: `translate(${-tile.px + 128 + t.dx * 256}px, ${-tile.py + 128 + t.dy * 256}px)`,
            }"
          >
            <img :src="t.url" alt="" loading="lazy" />
          </div>
          <div class="fmp-here"></div>
        </div>
        <div v-else class="fmp-tile-fallback">
          <p>Couldn't load the map. Pick the direction your front door faces below.</p>
        </div>

        <div
          v-if="!showFallbackPicker"
          class="fmp-house"
          :style="{ transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)` }"
        >
          <svg viewBox="-50 -50 100 100" class="fmp-house-svg">
            <rect x="-30" y="-30" width="60" height="60" rx="4" fill="rgba(255,255,255,0.92)" stroke="var(--brand-ink-soft)" stroke-width="2"/>
            <line x1="-12" y1="-30" x2="12" y2="-30" stroke="#b83a2c" stroke-width="5" stroke-linecap="round"/>
            <line x1="0" y1="-30" x2="0" y2="-44" stroke="#b83a2c" stroke-width="2.5" />
            <polygon points="0,-48 -4,-40 4,-40" fill="#b83a2c"/>
            <text x="0" y="2" text-anchor="middle" dominant-baseline="middle" class="fmp-house-label">your home</text>
          </svg>
          <button
            type="button"
            class="fmp-handle"
            aria-label="Rotate house"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >↻</button>
        </div>
      </div>

      <aside class="fmp-aside">
        <div class="fmp-readout">
          <small>Front door faces</small>
          <strong>{{ facing }}</strong>
        </div>
        <div v-if="showFallbackPicker" class="fmp-manual">
          <small>Pick a direction</small>
          <div class="fmp-manual-grid">
            <button
              v-for="o in COMPASS_ORDER"
              :key="o"
              type="button"
              :class="{ 'is-active': facing === o }"
              @click="emit('update:facing', o); rotationDeg = orientationToDeg(o)"
            >{{ o }}</button>
          </div>
        </div>
        <button
          v-if="locationStatus === 'denied' || locationStatus === 'fallback'"
          type="button"
          class="fmp-retry"
          @click="requestLocation"
        >Try locating me again</button>
      </aside>
    </div>

    <div class="fmp-floor">
      <h4>Which floor is your home on?</h4>
      <p class="fmp-floor-help">Top-floor homes hold heat the longest.</p>
      <div class="fmp-floor-row">
        <button
          v-for="f in FLOORS"
          :key="f.value"
          type="button"
          :class="['fmp-floor-btn', { 'is-active': floorLevel === f.value }]"
          @click="emit('update:floorLevel', f.value)"
        >{{ f.label }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fmp {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.fmp-head h4 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0 0 6px;
  line-height: 1.2;
}
.fmp-head p {
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

.fmp-stage-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 20px;
  align-items: flex-start;
}
.fmp-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 360px;
  margin-inline: auto;
  border-radius: var(--r-xl);
  overflow: hidden;
  background: #e8eef0;
  box-shadow: var(--sh-clay-sm);
  border: 1.5px solid var(--brand-line);
}
.fmp-tile-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.fmp-tile {
  position: absolute;
  width: 256px;
  height: 256px;
  pointer-events: none;
  user-select: none;
}
.fmp-tile img {
  width: 100%;
  height: 100%;
  display: block;
}
.fmp-here {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2a8cff;
  box-shadow: 0 0 0 4px rgba(42, 140, 255, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.fmp-tile-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
  color: var(--brand-ink-muted);
  font-weight: 600;
  background: var(--brand-paper-white);
}
.fmp-house {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120px;
  height: 120px;
  transform-origin: center;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.fmp-house-svg {
  width: 100%;
  height: 100%;
}
.fmp-house-label {
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 800;
  fill: var(--brand-ink-soft);
}
.fmp-handle {
  pointer-events: auto;
  position: absolute;
  top: -28px;
  right: -10px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 0;
  background: var(--brand-lime);
  color: #142016;
  font-size: 1.4rem;
  cursor: grab;
  box-shadow: var(--sh-clay-sm);
  touch-action: none;
}
.fmp-handle:active { cursor: grabbing; }

.fmp-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fmp-readout {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  border-radius: var(--r-lg);
  background: var(--brand-lime-soft);
  border: 1.5px solid var(--brand-sage);
}
.fmp-readout small {
  color: var(--brand-ink-muted);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fmp-readout strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.8rem;
  font-weight: 950;
}
.fmp-manual small {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.fmp-manual-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.fmp-manual-grid button {
  min-height: 40px;
  border-radius: 10px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-weight: 800;
  cursor: pointer;
}
.fmp-manual-grid button.is-active { background: var(--brand-lime); border-color: var(--brand-lime-hover); }
.fmp-retry {
  align-self: flex-start;
  padding: 6px 12px;
  background: transparent;
  border: 0;
  color: var(--shade-deep);
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
}

.fmp-floor h4 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 900;
  margin: 0 0 4px;
}
.fmp-floor-help {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 10px;
}
.fmp-floor-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fmp-floor-btn {
  min-height: 44px;
  padding: 8px 18px;
  border-radius: 20px;
  border: 2px solid var(--brand-line);
  background: var(--surface);
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-weight: 800;
  cursor: pointer;
}
.fmp-floor-btn.is-active {
  background: var(--brand-ink-soft);
  color: var(--brand-paper-white);
  border-color: var(--brand-ink-soft);
}

@media (max-width: 720px) {
  .fmp-stage-row { grid-template-columns: 1fr; }
}
</style>
