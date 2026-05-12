<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  HousePlan,
  HouseDoor,
  HouseWindow,
  HouseRoom,
  Orientation,
  WallSide,
} from '@/lib/selfcheck/types';
import {
  orientationForWall,
  wallCellsOfRoom,
  isExternalWallCell,
  newId,
} from '@/lib/selfcheck/grid-geometry';

type Mode = 'window' | 'door' | 'remove';

const props = defineProps<{
  plan: HousePlan;
  selectedRoomId: string | null;
  cellPx?: number;
}>();

const emit = defineEmits<{
  (e: 'add-window', w: HouseWindow): void;
  (e: 'add-door', d: HouseDoor): void;
  (e: 'remove-element', kind: 'window' | 'door', id: string): void;
  (e: 'select-room', id: string | null): void;
  (e: 'set-front-door', id: string): void;
}>();

const cellPx = computed(() => props.cellPx ?? 44);
const padding = 12;
const mode = ref<Mode>('window');

const widthSvg = computed(() => props.plan.gridSize.cols * cellPx.value);
const heightSvg = computed(() => props.plan.gridSize.rows * cellPx.value);
const viewBox = computed(
  () => `${-padding} ${-padding} ${widthSvg.value + padding * 2} ${heightSvg.value + padding * 2}`,
);

const selectedRoom = computed(() => props.plan.rooms.find((r) => r.id === props.selectedRoomId) ?? null);

interface WallHit {
  roomId: string;
  wall: WallSide;
  cellIndex: number;
  x: number; y: number; w: number; h: number;
  occupied: boolean;
  occupiedKind?: 'window' | 'door';
  occupiedId?: string;
}

function hitRectFor(roomId: string, wall: WallSide, cellIndex: number, room: HouseRoom): WallHit | null {
  const cells = wallCellsOfRoom(room, wall);
  const cell = cells[cellIndex];
  if (!cell) return null;
  const px = cellPx.value;
  // hit box centred on wall segment; thickness 14 SVG units beyond wall.
  const thickness = 14;
  let x = 0, y = 0, w = 0, h = 0;
  const length = px * 0.9;
  switch (wall) {
    case 'top': x = cell.cx * px - length / 2; y = cell.cy * px - thickness; w = length; h = thickness * 2; break;
    case 'bottom': x = cell.cx * px - length / 2; y = cell.cy * px - thickness; w = length; h = thickness * 2; break;
    case 'left': x = cell.cx * px - thickness; y = cell.cy * px - length / 2; w = thickness * 2; h = length; break;
    case 'right': x = cell.cx * px - thickness; y = cell.cy * px - length / 2; w = thickness * 2; h = length; break;
  }
  const occupiedWindow = props.plan.windows.find(
    (W) => W.roomId === roomId && W.wall === wall && W.cellIndex === cellIndex,
  );
  const occupiedDoor = props.plan.doors.find(
    (D) => D.roomId === roomId && D.wall === wall && D.cellIndex === cellIndex,
  );
  return {
    roomId, wall, cellIndex, x, y, w, h,
    occupied: !!(occupiedWindow || occupiedDoor),
    occupiedKind: occupiedWindow ? 'window' : occupiedDoor ? 'door' : undefined,
    occupiedId: occupiedWindow?.id ?? occupiedDoor?.id,
  };
}

const wallHits = computed<WallHit[]>(() => {
  const room = selectedRoom.value;
  if (!room) return [];
  const out: WallHit[] = [];
  (['top', 'right', 'bottom', 'left'] as WallSide[]).forEach((wall) => {
    const cells = wallCellsOfRoom(room, wall);
    for (let i = 0; i < cells.length; i++) {
      const h = hitRectFor(room.id, wall, i, room);
      if (h) out.push(h);
    }
  });
  return out;
});

function onHitClick(h: WallHit) {
  if (mode.value === 'remove') {
    if (h.occupied && h.occupiedKind && h.occupiedId) {
      emit('remove-element', h.occupiedKind, h.occupiedId);
    }
    return;
  }
  if (h.occupied) return;
  if (mode.value === 'window') {
    const orientation: Orientation = orientationForWall(h.wall, props.plan.houseFacing);
    const w: HouseWindow = {
      id: newId('win'),
      roomId: h.roomId,
      wall: h.wall,
      cellIndex: h.cellIndex,
      orientation,
      hasCurtain: false,
      fanNearby: false,
    };
    emit('add-window', w);
  } else {
    const isExternal = isExternalWallCell(props.plan, h.roomId, h.wall, h.cellIndex);
    const d: HouseDoor = {
      id: newId('door'),
      roomId: h.roomId,
      wall: h.wall,
      cellIndex: h.cellIndex,
      isExternal,
    };
    emit('add-door', d);
    if (isExternal && !props.plan.frontDoorId) {
      emit('set-front-door', d.id);
    }
  }
}

function onRoomClick(id: string) {
  emit('select-room', id);
}

function roomRect(r: HouseRoom) {
  return {
    x: r.x * cellPx.value,
    y: r.y * cellPx.value,
    width: r.w * cellPx.value,
    height: r.h * cellPx.value,
  };
}

function elementXYAngle(roomId: string, wall: WallSide, cellIndex: number) {
  const room = props.plan.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  const cell = wallCellsOfRoom(room, wall)[cellIndex];
  if (!cell) return null;
  return {
    cx: cell.cx * cellPx.value,
    cy: cell.cy * cellPx.value,
    rot: (Math.atan2(cell.y2 - cell.y1, cell.x2 - cell.x1) * 180) / Math.PI,
    length: cellPx.value * 0.85,
  };
}

const cursorClass = computed(() => `is-mode-${mode.value}`);

const MODES: Array<{ v: Mode; label: string }> = [
  { v: 'window', label: '+ Window' },
  { v: 'door', label: '+ Door' },
  { v: 'remove', label: 'Remove' },
];

const totals = computed(() => ({
  windows: props.plan.windows.length,
  doors: props.plan.doors.length,
}));
</script>

<template>
  <div class="we">
    <div class="we-toolbar">
      <div class="we-mode">
        <button
          v-for="m in MODES"
          :key="m.v"
          type="button"
          :class="['we-mode-btn', `we-mode-btn--${m.v}`, { 'is-active': mode === m.v }]"
          @click="mode = m.v"
        >{{ m.label }}</button>
      </div>
      <div class="we-meta">
        <small v-if="selectedRoom">Editing <strong>{{ selectedRoom.label }}</strong></small>
        <small v-else>Click a room to start adding windows or doors</small>
        <small class="we-totals">{{ totals.windows }} window{{ totals.windows === 1 ? '' : 's' }} · {{ totals.doors }} door{{ totals.doors === 1 ? '' : 's' }}</small>
      </div>
    </div>

    <div :class="['we-stage', cursorClass]">
      <svg :viewBox="viewBox" class="we-svg">
        <!-- outer outline -->
        <rect
          :x="0" :y="0"
          :width="widthSvg" :height="heightSvg"
          fill="rgba(251, 246, 235, 0.65)"
          stroke="var(--brand-ink-soft)"
          stroke-width="2.5"
        />

        <!-- rooms -->
        <g
          v-for="r in plan.rooms"
          :key="r.id"
          :class="['we-room', { 'is-selected': selectedRoomId === r.id }]"
          @click="onRoomClick(r.id)"
        >
          <rect
            v-bind="roomRect(r)"
            class="we-room-fill"
            rx="3"
          />
          <text
            :x="(r.x + r.w / 2) * cellPx"
            :y="(r.y + r.h / 2) * cellPx"
            text-anchor="middle"
            dominant-baseline="middle"
            class="we-room-label"
          >{{ r.label }}</text>
        </g>

        <!-- doors -->
        <g class="we-doors">
          <g
            v-for="d in plan.doors"
            :key="d.id"
          >
            <template v-if="elementXYAngle(d.roomId, d.wall, d.cellIndex)">
              <g :transform="`translate(${elementXYAngle(d.roomId, d.wall, d.cellIndex)!.cx} ${elementXYAngle(d.roomId, d.wall, d.cellIndex)!.cy}) rotate(${elementXYAngle(d.roomId, d.wall, d.cellIndex)!.rot})`">
                <line
                  :x1="-elementXYAngle(d.roomId, d.wall, d.cellIndex)!.length / 2" :y1="0"
                  :x2="elementXYAngle(d.roomId, d.wall, d.cellIndex)!.length / 2" :y2="0"
                  :stroke="d.isExternal ? '#b83a2c' : '#8b5e3c'"
                  stroke-width="6"
                  stroke-linecap="round"
                />
                <circle
                  v-if="d.id === plan.frontDoorId"
                  cx="0" cy="-8" r="3" fill="#b83a2c"
                />
              </g>
            </template>
          </g>
        </g>

        <!-- windows -->
        <g class="we-windows">
          <g
            v-for="w in plan.windows"
            :key="w.id"
          >
            <template v-if="elementXYAngle(w.roomId, w.wall, w.cellIndex)">
              <g :transform="`translate(${elementXYAngle(w.roomId, w.wall, w.cellIndex)!.cx} ${elementXYAngle(w.roomId, w.wall, w.cellIndex)!.cy}) rotate(${elementXYAngle(w.roomId, w.wall, w.cellIndex)!.rot})`">
                <rect
                  :x="-elementXYAngle(w.roomId, w.wall, w.cellIndex)!.length / 2"
                  :y="-4"
                  :width="elementXYAngle(w.roomId, w.wall, w.cellIndex)!.length"
                  :height="8"
                  fill="#a8d4e2"
                  stroke="var(--brand-ink-soft)"
                  stroke-width="1.5"
                />
              </g>
            </template>
          </g>
        </g>

        <!-- wall hit zones for the selected room -->
        <g v-if="selectedRoom" class="we-hits">
          <rect
            v-for="(h, idx) in wallHits"
            :key="`${h.wall}-${h.cellIndex}-${idx}`"
            :x="h.x" :y="h.y"
            :width="h.w" :height="h.h"
            :class="[
              'we-hit',
              {
                'we-hit--occupied': h.occupied,
                'we-hit--remove-target': mode === 'remove' && h.occupied,
                'we-hit--cant-place': mode !== 'remove' && h.occupied,
              }
            ]"
            @click.stop="onHitClick(h)"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.we {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.we-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--r-lg);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
}
.we-mode {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.we-mode-btn {
  min-height: 42px;
  padding: 8px 18px;
  border-radius: 22px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.we-mode-btn:hover { background: var(--brand-lime-soft); }
.we-mode-btn--window.is-active { background: #a8d4e2; border-color: #2b6b88; color: #112a36; }
.we-mode-btn--door.is-active { background: #d8b08a; border-color: #8b5e3c; color: #3b1f0c; }
.we-mode-btn--remove.is-active { background: #f4c4bc; border-color: #b83a2c; color: #5a1a13; }
.we-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.we-meta small {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 700;
}
.we-meta strong { color: var(--brand-ink); font-weight: 900; }
.we-totals { font-size: 0.85rem !important; opacity: 0.8; }

.we-stage {
  background: var(--brand-paper-white);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-clay-sm);
  border: 1.5px solid var(--brand-line);
  padding: 8px;
}
.we-stage.is-mode-window { cursor: copy; }
.we-stage.is-mode-door { cursor: copy; }
.we-stage.is-mode-remove { cursor: not-allowed; }
.we-svg { width: 100%; height: auto; display: block; touch-action: none; }

.we-room { cursor: pointer; }
.we-room-fill {
  fill: rgba(155, 224, 111, 0.18);
  stroke: var(--brand-ink-soft);
  stroke-width: 2;
}
.we-room.is-selected .we-room-fill {
  fill: rgba(155, 224, 111, 0.42);
  stroke: var(--brand-lime);
  stroke-width: 3;
}
.we-room-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 800;
  fill: var(--brand-ink-soft);
  pointer-events: none;
}
.we-hit {
  fill: rgba(155, 224, 111, 0.18);
  stroke: rgba(98, 133, 107, 0.4);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  cursor: copy;
  transition: fill var(--d-fast) ease;
}
.we-hit:hover { fill: rgba(155, 224, 111, 0.45); }
.we-hit--cant-place {
  fill: rgba(184, 58, 44, 0.08);
  stroke: rgba(184, 58, 44, 0.25);
  cursor: not-allowed;
}
.we-hit--remove-target {
  fill: rgba(184, 58, 44, 0.24);
  cursor: pointer;
}
.we-hit--remove-target:hover { fill: rgba(184, 58, 44, 0.42); }
</style>
