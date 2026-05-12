<script setup lang="ts">
import { computed } from 'vue';
import type { HousePlan, HouseWindow, Orientation, WallSide } from '@/lib/selfcheck/types';
import { wallCellsOfRoom } from '@/lib/selfcheck/grid-geometry';

const props = defineProps<{
  plan: HousePlan;
  sunlitWindowIds: string[];
  selectedWindowId: string | null;
  peakSunOrientation: Orientation;
  cellPx?: number;
}>();

const emit = defineEmits<{
  (e: 'select-window', id: string): void;
}>();

const cellPx = computed(() => props.cellPx ?? 36);
const padding = 24;

const widthSvg = computed(() => props.plan.gridSize.cols * cellPx.value);
const heightSvg = computed(() => props.plan.gridSize.rows * cellPx.value);
const viewBox = computed(
  () => `${-padding} ${-padding} ${widthSvg.value + padding * 2} ${heightSvg.value + padding * 2}`,
);

interface WindowGeom {
  win: HouseWindow;
  cx: number;
  cy: number;
  rotation: number;
  width: number;
  length: number;
}

interface DoorGeom {
  id: string;
  cx: number;
  cy: number;
  rotation: number;
  length: number;
  isExternal: boolean;
}

function wallCellMid(roomId: string, wall: WallSide, cellIndex: number) {
  const room = props.plan.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  const cell = wallCellsOfRoom(room, wall)[cellIndex];
  if (!cell) return null;
  const angle = (Math.atan2(cell.y2 - cell.y1, cell.x2 - cell.x1) * 180) / Math.PI;
  return {
    cx: cell.cx * cellPx.value,
    cy: cell.cy * cellPx.value,
    angle,
  };
}

const windows = computed<WindowGeom[]>(() =>
  props.plan.windows.flatMap((w) => {
    const m = wallCellMid(w.roomId, w.wall, w.cellIndex);
    if (!m) return [];
    return [{
      win: w,
      cx: m.cx,
      cy: m.cy,
      rotation: m.angle,
      width: 8,
      length: cellPx.value * 0.85,
    }];
  }),
);

const doors = computed<DoorGeom[]>(() =>
  props.plan.doors.flatMap((d) => {
    const m = wallCellMid(d.roomId, d.wall, d.cellIndex);
    if (!m) return [];
    return [{
      id: d.id,
      cx: m.cx,
      cy: m.cy,
      rotation: m.angle,
      length: cellPx.value * 0.85,
      isExternal: d.isExternal,
    }];
  }),
);

const compassRotation = computed(() => {
  const order: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return order.indexOf(props.plan.houseFacing) * 45;
});

const sunRayAngle = computed(() => {
  const order: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return order.indexOf(props.peakSunOrientation) * 45;
});

function onWindowClick(id: string) {
  emit('select-window', id);
}

function isSunlit(id: string) {
  return props.sunlitWindowIds.includes(id);
}

function roomLabelTransform(r: { x: number; y: number; w: number; h: number }) {
  return `translate(${(r.x + r.w / 2) * cellPx.value} ${(r.y + r.h / 2) * cellPx.value})`;
}

function roomRect(r: { x: number; y: number; w: number; h: number }) {
  return {
    x: r.x * cellPx.value,
    y: r.y * cellPx.value,
    width: r.w * cellPx.value,
    height: r.h * cellPx.value,
  };
}
</script>

<template>
  <div class="canvas-wrap">
    <svg :viewBox="viewBox" class="canvas-svg" role="img" aria-label="House floor plan">
      <defs>
        <pattern id="hp-grid" :width="cellPx" :height="cellPx" patternUnits="userSpaceOnUse">
          <path :d="`M ${cellPx} 0 L 0 0 0 ${cellPx}`" fill="none" stroke="rgba(35,45,39,0.08)" stroke-width="0.6" />
        </pattern>
      </defs>

      <!-- outer boundary fill + grid -->
      <rect
        :x="0" :y="0"
        :width="widthSvg" :height="heightSvg"
        fill="rgba(247, 242, 232, 0.6)"
        stroke="var(--brand-ink-soft)"
        stroke-width="2.5"
      />
      <rect
        :x="0" :y="0"
        :width="widthSvg" :height="heightSvg"
        fill="url(#hp-grid)"
        pointer-events="none"
      />

      <!-- rooms -->
      <g class="rooms">
        <g v-for="r in plan.rooms" :key="r.id">
          <rect
            v-bind="roomRect(r)"
            class="room"
            rx="3"
            fill="rgba(155, 224, 111, 0.18)"
            stroke="var(--brand-ink-soft)"
            stroke-width="2"
          />
        </g>
      </g>

      <!-- doors -->
      <g class="doors">
        <g v-for="d in doors" :key="d.id" :transform="`translate(${d.cx} ${d.cy}) rotate(${d.rotation})`">
          <line
            :x1="-d.length / 2" :y1="0"
            :x2="d.length / 2" :y2="0"
            :stroke="d.isExternal ? '#b83a2c' : '#8b5e3c'"
            stroke-width="6"
            stroke-linecap="round"
          />
        </g>
      </g>

      <!-- windows -->
      <g class="windows">
        <g
          v-for="w in windows"
          :key="w.win.id"
          :transform="`translate(${w.cx} ${w.cy}) rotate(${w.rotation})`"
          :class="['win', { 'win--sunlit': isSunlit(w.win.id), 'win--selected': selectedWindowId === w.win.id }]"
          tabindex="0"
          role="button"
          @click="onWindowClick(w.win.id)"
          @keydown.enter.prevent="onWindowClick(w.win.id)"
          @keydown.space.prevent="onWindowClick(w.win.id)"
        >
          <rect
            :x="-w.length / 2 - 4"
            :y="-12"
            :width="w.length + 8"
            :height="24"
            fill="transparent"
            class="win-hit"
          />
          <rect
            :x="-w.length / 2"
            :y="-w.width / 2"
            :width="w.length"
            :height="w.width"
            class="win-glass"
            rx="1"
          />
          <line
            v-if="w.win.hasCurtain"
            :x1="-w.length / 2 + 2" :y1="-w.width / 2 - 3.5"
            :x2="w.length / 2 - 2" :y2="-w.width / 2 - 3.5"
            stroke="#5b8c61"
            stroke-width="2.8"
            stroke-linecap="round"
          />
          <circle
            v-if="w.win.fanNearby"
            cx="0"
            :cy="w.width / 2 + 8"
            r="4"
            fill="#a8d4e2"
            stroke="#1f2a1e"
            stroke-width="1"
          />
        </g>
      </g>

      <!-- compass -->
      <g class="compass" :transform="`translate(${widthSvg + padding - 30}, ${-padding + 30}) rotate(${compassRotation})`">
        <circle r="22" fill="rgba(255,255,255,0.92)" stroke="rgba(35,45,39,0.18)" stroke-width="1"/>
        <polygon points="0,-16 5,4 0,0 -5,4" fill="#b83a2c" />
        <polygon points="0,16 5,-4 0,0 -5,-4" fill="rgba(35,45,39,0.35)" />
        <text y="-22" text-anchor="middle" class="compass-n">N</text>
      </g>

      <!-- sun ray (peak afternoon direction) -->
      <g
        class="sun-ray"
        :transform="`translate(${widthSvg / 2}, ${heightSvg / 2}) rotate(${sunRayAngle})`"
      >
        <line x1="0" y1="0" x2="0" :y2="-Math.max(widthSvg, heightSvg) / 2 - 16" stroke="#efa62b" stroke-width="2" stroke-dasharray="4 4" />
        <circle cx="0" :cy="-Math.max(widthSvg, heightSvg) / 2 - 18" r="7" fill="#efa62b" />
      </g>

      <!-- room labels last -->
      <g class="room-labels">
        <text
          v-for="r in plan.rooms"
          :key="r.id"
          :transform="roomLabelTransform(r)"
          text-anchor="middle"
          dominant-baseline="middle"
          class="room-label"
        >{{ r.label }}</text>
      </g>
    </svg>
    <p class="canvas-legend">
      <span class="lg lg--sun"></span> Sunlit window
      &nbsp;·&nbsp; <span class="lg lg--curtain"></span> Has curtain
      &nbsp;·&nbsp; <span class="lg lg--fan"></span> Fan nearby
      &nbsp;·&nbsp; <span class="lg lg--door"></span> Front door
    </p>
  </div>
</template>

<style scoped>
.canvas-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.canvas-svg {
  width: 100%;
  height: auto;
  max-height: 560px;
  background: var(--brand-paper-white);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-clay-sm);
  border: 1.5px solid var(--brand-line);
}
.win { cursor: pointer; outline: none; }
.win-glass {
  fill: #a8d4e2;
  stroke: var(--brand-ink-soft);
  stroke-width: 1.5;
  transition: fill var(--d-fast) ease, stroke var(--d-fast) ease;
}
.win:hover .win-glass { fill: #c8e6f0; }
.win--sunlit .win-glass { fill: #efa62b; stroke: #b83a2c; }
.win--sunlit:hover .win-glass { fill: #f6c267; }
.win--selected .win-glass { stroke: var(--brand-lime); stroke-width: 3; }
.win:focus-visible .win-hit { fill: rgba(155, 224, 111, 0.25); }

.room-label {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 800;
  fill: rgba(35, 45, 39, 0.55);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: none;
}
.compass-n {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 900;
  fill: #b83a2c;
}

.canvas-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0 4px;
}
.canvas-legend .lg {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  vertical-align: middle;
}
.lg--sun { background: #efa62b; border: 1.5px solid #b83a2c; }
.lg--curtain { background: linear-gradient(90deg, #5b8c61 0%, #5b8c61 60%, transparent 60%); height: 4px; border-radius: 2px; }
.lg--fan { background: #a8d4e2; border: 1.2px solid #1f2a1e; border-radius: 50%; }
.lg--door { background: #b83a2c; height: 4px; border-radius: 2px; }
</style>
