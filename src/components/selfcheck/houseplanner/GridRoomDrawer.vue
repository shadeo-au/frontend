<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HousePlan, HouseRoom } from '@/lib/selfcheck/types';
import {
  isRoomPlacementValid,
  newId,
  newRoomLabel,
  normaliseRect,
} from '@/lib/selfcheck/grid-geometry';

const props = defineProps<{
  plan: HousePlan;
  selectedRoomId: string | null;
  cellPx?: number;
}>();

const emit = defineEmits<{
  (e: 'add-room', room: HouseRoom): void;
  (e: 'delete-room', id: string): void;
  (e: 'rename-room', id: string, label: string): void;
  (e: 'select-room', id: string | null): void;
}>();

const cellPx = computed(() => props.cellPx ?? 44);
const padding = 12;

const widthSvg = computed(() => props.plan.gridSize.cols * cellPx.value);
const heightSvg = computed(() => props.plan.gridSize.rows * cellPx.value);
const viewBox = computed(
  () => `${-padding} ${-padding} ${widthSvg.value + padding * 2} ${heightSvg.value + padding * 2}`,
);

const svgRef = ref<SVGSVGElement | null>(null);
const hover = ref<{ x: number; y: number } | null>(null);
const dragStart = ref<{ x: number; y: number } | null>(null);
const dragEnd = ref<{ x: number; y: number } | null>(null);

const candidate = computed(() => {
  if (!dragStart.value) return null;
  const end = dragEnd.value ?? dragStart.value;
  return normaliseRect(dragStart.value, end);
});

const candidateValid = computed(() => {
  if (!candidate.value) return false;
  return isRoomPlacementValid(candidate.value, props.plan.rooms, props.plan.gridSize);
});

function eventToCell(ev: PointerEvent): { x: number; y: number } | null {
  const svg = svgRef.value;
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const loc = pt.matrixTransform(ctm.inverse());
  const x = Math.floor(loc.x / cellPx.value);
  const y = Math.floor(loc.y / cellPx.value);
  return {
    x: Math.max(0, Math.min(props.plan.gridSize.cols - 1, x)),
    y: Math.max(0, Math.min(props.plan.gridSize.rows - 1, y)),
  };
}

function onPointerDown(ev: PointerEvent) {
  if ((ev.target as SVGElement).closest('[data-room]')) {
    return;
  }
  const cell = eventToCell(ev);
  if (!cell) return;
  // immediate selection clear so user can draw without unintended selection
  emit('select-room', null);
  dragStart.value = cell;
  dragEnd.value = cell;
  (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
}

function onPointerMove(ev: PointerEvent) {
  const cell = eventToCell(ev);
  if (!cell) return;
  hover.value = cell;
  if (dragStart.value) {
    dragEnd.value = cell;
  }
}

function onPointerUp(ev: PointerEvent) {
  if (!dragStart.value) return;
  (ev.currentTarget as Element).releasePointerCapture?.(ev.pointerId);
  const c = candidate.value;
  if (c && candidateValid.value) {
    const room: HouseRoom = {
      id: newId('room'),
      label: newRoomLabel(props.plan.rooms),
      x: c.x,
      y: c.y,
      w: c.w,
      h: c.h,
    };
    emit('add-room', room);
  }
  dragStart.value = null;
  dragEnd.value = null;
}

function onPointerLeave() {
  hover.value = null;
}

function onRoomClick(id: string) {
  emit('select-room', props.selectedRoomId === id ? null : id);
}

const editingName = ref('');
function startRename(room: HouseRoom) {
  editingName.value = room.label;
}
function commitRename(room: HouseRoom) {
  const next = editingName.value.trim();
  if (next && next !== room.label) emit('rename-room', room.id, next);
  editingName.value = '';
}

function roomSvgRect(r: HouseRoom) {
  return {
    x: r.x * cellPx.value,
    y: r.y * cellPx.value,
    width: r.w * cellPx.value,
    height: r.h * cellPx.value,
  };
}

const selectedRoom = computed(() => props.plan.rooms.find((r) => r.id === props.selectedRoomId) ?? null);
</script>

<template>
  <div class="gd">
    <div class="gd-stage">
      <svg
        ref="svgRef"
        :viewBox="viewBox"
        class="gd-svg"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerLeave"
      >
        <defs>
          <pattern id="gd-grid" :width="cellPx" :height="cellPx" patternUnits="userSpaceOnUse">
            <path :d="`M ${cellPx} 0 L 0 0 0 ${cellPx}`" fill="none" stroke="rgba(35,45,39,0.18)" stroke-width="1" />
          </pattern>
        </defs>

        <!-- outer outline -->
        <rect
          :x="0" :y="0"
          :width="widthSvg" :height="heightSvg"
          fill="rgba(251, 246, 235, 0.7)"
          stroke="var(--brand-ink-soft)"
          stroke-width="2.5"
        />
        <rect
          :x="0" :y="0"
          :width="widthSvg" :height="heightSvg"
          fill="url(#gd-grid)"
          pointer-events="none"
        />

        <!-- existing rooms -->
        <g
          v-for="r in plan.rooms"
          :key="r.id"
          :data-room="r.id"
          :class="['gd-room', { 'is-selected': selectedRoomId === r.id }]"
          @click="onRoomClick(r.id)"
        >
          <rect
            v-bind="roomSvgRect(r)"
            class="gd-room-fill"
            rx="3"
          />
          <text
            :x="(r.x + r.w / 2) * cellPx"
            :y="(r.y + r.h / 2) * cellPx"
            text-anchor="middle"
            dominant-baseline="middle"
            class="gd-room-label"
          >{{ r.label }}</text>
        </g>

        <!-- candidate while dragging -->
        <rect
          v-if="candidate"
          :x="candidate.x * cellPx"
          :y="candidate.y * cellPx"
          :width="candidate.w * cellPx"
          :height="candidate.h * cellPx"
          :class="['gd-candidate', { 'is-valid': candidateValid, 'is-invalid': !candidateValid }]"
          pointer-events="none"
        />

        <!-- hover cell -->
        <rect
          v-if="hover && !dragStart"
          :x="hover.x * cellPx"
          :y="hover.y * cellPx"
          :width="cellPx"
          :height="cellPx"
          class="gd-hover"
          pointer-events="none"
        />
      </svg>
    </div>

    <aside class="gd-side">
      <div v-if="!selectedRoom" class="gd-help">
        <strong>How to draw</strong>
        <ol>
          <li>Click and drag from the edge of the grid to make your first room.</li>
          <li>The next rooms can start either from the edge or from a wall of an existing room.</li>
          <li>Rooms can't overlap. Red preview means the rectangle is not allowed.</li>
        </ol>
        <p v-if="!plan.rooms.length" class="gd-empty">No rooms yet — try drawing from a corner.</p>
        <p v-else class="gd-count">{{ plan.rooms.length }} room{{ plan.rooms.length === 1 ? '' : 's' }} drawn</p>
      </div>

      <div v-else class="gd-selected">
        <strong>Selected room</strong>
        <div class="gd-rename">
          <input
            :value="editingName || selectedRoom.label"
            @focus="startRename(selectedRoom)"
            @input="editingName = ($event.target as HTMLInputElement).value"
            @blur="commitRename(selectedRoom)"
            @keydown.enter="(($event.target as HTMLInputElement).blur())"
          />
        </div>
        <small>{{ selectedRoom.w }} × {{ selectedRoom.h }} cells</small>
        <button type="button" class="gd-delete" @click="emit('delete-room', selectedRoom.id)">Delete this room</button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.gd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 22px;
  align-items: flex-start;
}
.gd-stage {
  background: var(--brand-paper-white);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-clay-sm);
  border: 1.5px solid var(--brand-line);
  padding: 8px;
  min-width: 0;
  cursor: crosshair;
}
.gd-svg {
  width: 100%;
  height: auto;
  display: block;
  touch-action: none;
}
.gd-room { cursor: pointer; }
.gd-room-fill {
  fill: rgba(155, 224, 111, 0.22);
  stroke: var(--brand-ink-soft);
  stroke-width: 2;
  transition: fill var(--d-fast) ease, stroke var(--d-fast) ease;
}
.gd-room:hover .gd-room-fill { fill: rgba(155, 224, 111, 0.36); }
.gd-room.is-selected .gd-room-fill {
  stroke: var(--brand-lime);
  stroke-width: 3;
  fill: rgba(155, 224, 111, 0.48);
}
.gd-room-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 800;
  fill: var(--brand-ink-soft);
  pointer-events: none;
  letter-spacing: 0.02em;
}
.gd-candidate {
  fill: rgba(155, 224, 111, 0.4);
  stroke: var(--brand-sage);
  stroke-width: 2.5;
  stroke-dasharray: 4 4;
}
.gd-candidate.is-invalid {
  fill: rgba(184, 58, 44, 0.22);
  stroke: #b83a2c;
}
.gd-hover {
  fill: rgba(155, 224, 111, 0.18);
  stroke: rgba(98, 133, 107, 0.45);
  stroke-width: 1;
}

.gd-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gd-help, .gd-selected {
  padding: 16px 18px;
  background: var(--surface);
  border-radius: var(--r-lg);
  border: 1.5px solid var(--brand-line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gd-help strong, .gd-selected strong {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 900;
}
.gd-help ol {
  margin: 0;
  padding-inline-start: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.45;
}
.gd-empty, .gd-count {
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}
.gd-rename input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 800;
}
.gd-selected small {
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 700;
}
.gd-delete {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 18px;
  border: 1.5px solid #b83a2c;
  background: rgba(184, 58, 44, 0.08);
  color: #b83a2c;
  font-family: var(--font-body);
  font-weight: 800;
  cursor: pointer;
}
.gd-delete:hover { background: rgba(184, 58, 44, 0.16); }

@media (max-width: 880px) {
  .gd { grid-template-columns: 1fr; }
}
</style>
