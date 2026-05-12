<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ClayCard from '@/components/ClayCard.vue';
import AppButton from '@/components/AppButton.vue';
import FacingMapPicker from './FacingMapPicker.vue';
import GridRoomDrawer from './GridRoomDrawer.vue';
import WallElementEditor from './WallElementEditor.vue';
import HouseCanvas from './HouseCanvas.vue';
import WindowEditor from './WindowEditor.vue';
import HousePlannerResults from './HousePlannerResults.vue';
import { makeEmptyPlan, orientationForWall } from '@/lib/selfcheck/grid-geometry';
import { analyseHousePlan } from '@/lib/selfcheck/house-actions';
import type {
  HousePlan,
  HouseWindow,
  HouseDoor,
  HouseRoom,
  Orientation,
  FloorLevel,
  HeatSnapshot,
  SuburbIndexEntry,
} from '@/lib/selfcheck/types';

const props = defineProps<{
  suburb: SuburbIndexEntry | null;
  snapshot: HeatSnapshot | null;
}>();

const STEP_LABELS = ['Orient', 'Draw rooms', 'Doors & windows', 'Window details', 'Your plan'];
const step = ref(0);

const plan = ref<HousePlan>(makeEmptyPlan());
const selectedRoomId = ref<string | null>(null);
const selectedWindowId = ref<string | null>(null);

function setFacing(o: Orientation) {
  plan.value = {
    ...plan.value,
    houseFacing: o,
    windows: plan.value.windows.map((w) => ({
      ...w,
      orientation: orientationForWall(w.wall, o),
    })),
  };
}

function setFloorLevel(level: FloorLevel) {
  plan.value = { ...plan.value, floorLevel: level };
}

function addRoom(room: HouseRoom) {
  plan.value = { ...plan.value, rooms: [...plan.value.rooms, room] };
}

function deleteRoom(id: string) {
  plan.value = {
    ...plan.value,
    rooms: plan.value.rooms.filter((r) => r.id !== id),
    windows: plan.value.windows.filter((w) => w.roomId !== id),
    doors: plan.value.doors.filter((d) => d.roomId !== id),
    frontDoorId:
      plan.value.frontDoorId && plan.value.doors.find((d) => d.id === plan.value.frontDoorId)?.roomId === id
        ? null
        : plan.value.frontDoorId,
  };
  if (selectedRoomId.value === id) selectedRoomId.value = null;
}

function renameRoom(id: string, label: string) {
  plan.value = {
    ...plan.value,
    rooms: plan.value.rooms.map((r) => (r.id === id ? { ...r, label } : r)),
  };
}

function addWindow(w: HouseWindow) {
  plan.value = { ...plan.value, windows: [...plan.value.windows, w] };
}

function addDoor(d: HouseDoor) {
  plan.value = { ...plan.value, doors: [...plan.value.doors, d] };
}

function removeElement(kind: 'window' | 'door', id: string) {
  if (kind === 'window') {
    plan.value = { ...plan.value, windows: plan.value.windows.filter((w) => w.id !== id) };
    if (selectedWindowId.value === id) selectedWindowId.value = null;
  } else {
    plan.value = {
      ...plan.value,
      doors: plan.value.doors.filter((d) => d.id !== id),
      frontDoorId: plan.value.frontDoorId === id ? null : plan.value.frontDoorId,
    };
  }
}

function setFrontDoor(id: string) {
  plan.value = { ...plan.value, frontDoorId: id };
}

function updateWindow(updated: HouseWindow) {
  plan.value = {
    ...plan.value,
    windows: plan.value.windows.map((w) => (w.id === updated.id ? updated : w)),
  };
}

const analysis = computed(() => {
  if (!plan.value.rooms.length || !props.suburb) return null;
  return analyseHousePlan({
    plan: plan.value,
    snapshot: props.snapshot,
    lat: props.suburb.lat,
    lng: props.suburb.lng,
  });
});

const sunlitPeakIds = computed(() => analysis.value?.sunlitPeak.map((w) => w.id) ?? []);

watch(
  () => plan.value.windows,
  (next) => {
    if (selectedWindowId.value && !next.find((w) => w.id === selectedWindowId.value)) {
      selectedWindowId.value = null;
    } else if (!selectedWindowId.value && next.length) {
      selectedWindowId.value = next[0].id;
    }
  },
);

const selectedWindow = computed(() => plan.value.windows.find((w) => w.id === selectedWindowId.value) ?? null);

function stepValid(s: number): boolean {
  switch (s) {
    case 0: return true;
    case 1: return plan.value.rooms.length >= 1;
    case 2: return true;
    case 3: return true;
    default: return true;
  }
}

function gotoStep(n: number) {
  if (n <= step.value || stepValid(n - 1)) {
    step.value = n;
    selectedRoomId.value = null;
  }
}

function next() {
  if (step.value < STEP_LABELS.length - 1 && stepValid(step.value)) {
    step.value += 1;
    selectedRoomId.value = null;
  }
}
function prev() {
  if (step.value > 0) {
    step.value -= 1;
    selectedRoomId.value = null;
  }
}
function restart() {
  plan.value = makeEmptyPlan();
  selectedRoomId.value = null;
  selectedWindowId.value = null;
  step.value = 0;
}

const isLast = computed(() => step.value === STEP_LABELS.length - 1);
const noWindows = computed(() => plan.value.windows.length === 0);
</script>

<template>
  <ClayCard tone="white" radius="2xl" class="hp">
    <div class="hp-head">
      <div class="hp-stepper">
        <button
          v-for="(label, i) in STEP_LABELS"
          :key="label"
          type="button"
          :class="['hp-step', { 'is-active': i === step, 'is-done': i < step }]"
          :disabled="i > step && !stepValid(i - 1)"
          @click="gotoStep(i)"
        >
          <span>{{ i + 1 }}</span>{{ label }}
        </button>
      </div>
      <div class="hp-progress" :style="{ '--p': `${((step + 1) / STEP_LABELS.length) * 100}%` }"></div>
    </div>

    <!-- Step 1: orient -->
    <div v-if="step === 0" class="hp-body">
      <FacingMapPicker
        :suburb="suburb"
        :facing="plan.houseFacing"
        :floor-level="plan.floorLevel"
        @update:facing="setFacing"
        @update:floor-level="setFloorLevel"
      />
    </div>

    <!-- Step 2: draw rooms -->
    <div v-else-if="step === 1" class="hp-body">
      <h3 class="hp-title">Draw the rooms in your home</h3>
      <p class="hp-lede">
        Click and drag from the grid's edge to make the first room. After that, you can draw rooms
        that share a wall with one you've already placed. Don't worry about exact sizes — close enough is fine.
      </p>
      <GridRoomDrawer
        :plan="plan"
        :selected-room-id="selectedRoomId"
        @add-room="addRoom"
        @delete-room="deleteRoom"
        @rename-room="renameRoom"
        @select-room="(id) => (selectedRoomId = id)"
      />
    </div>

    <!-- Step 3: doors & windows -->
    <div v-else-if="step === 2" class="hp-body">
      <h3 class="hp-title">Place doors and windows</h3>
      <p class="hp-lede">
        Click a room to select it, then click any wall cell to add a window or door. Walls facing
        outside the home will be marked as the most useful for cooling advice.
      </p>
      <WallElementEditor
        :plan="plan"
        :selected-room-id="selectedRoomId"
        @add-window="addWindow"
        @add-door="addDoor"
        @remove-element="removeElement"
        @select-room="(id) => (selectedRoomId = id)"
        @set-front-door="setFrontDoor"
      />
    </div>

    <!-- Step 4: window details -->
    <div v-else-if="step === 3" class="hp-body">
      <h3 class="hp-title">Mark curtains and fans for each window</h3>
      <p class="hp-lede">
        Click a window in the plan, then mark whether it has a curtain and whether a fan sits nearby.
        Orange windows are the ones that will face the sun this afternoon.
      </p>
      <div v-if="noWindows" class="hp-warn">
        You haven't placed any windows yet. Go back to <button class="hp-link" @click="step = 2">Doors &amp; windows</button> to add at least one.
      </div>
      <div v-else class="hp-detail-row">
        <div class="hp-detail-col">
          <HouseCanvas
            :plan="plan"
            :sunlit-window-ids="sunlitPeakIds"
            :selected-window-id="selectedWindowId"
            :peak-sun-orientation="analysis?.peakSunOrientation ?? 'NW'"
            @select-window="(id) => (selectedWindowId = id)"
          />
        </div>
        <div class="hp-editor-col">
          <WindowEditor
            v-if="selectedWindow"
            :window="selectedWindow"
            :plan="plan"
            :sunlit="sunlitPeakIds.includes(selectedWindow.id)"
            @update="updateWindow"
            @close="() => null"
          />
          <p v-else class="hp-empty">Select a window in the plan.</p>
        </div>
      </div>
    </div>

    <!-- Step 5: results -->
    <div v-else class="hp-body">
      <HouseCanvas
        :plan="plan"
        :sunlit-window-ids="sunlitPeakIds"
        :selected-window-id="null"
        :peak-sun-orientation="analysis?.peakSunOrientation ?? 'NW'"
        @select-window="(id) => (selectedWindowId = id)"
      />
      <HousePlannerResults
        :actions="analysis?.actions ?? []"
        :peak-sun-orientation="analysis?.peakSunOrientation ?? 'NW'"
      />
    </div>

    <div class="hp-nav">
      <AppButton v-if="step > 0" variant="secondary" @click="prev">Back</AppButton>
      <span v-else></span>
      <div class="hp-nav-right">
        <AppButton v-if="isLast" variant="ghost" @click="restart">Start over</AppButton>
        <AppButton
          v-if="!isLast"
          variant="primary"
          :disabled="!stepValid(step)"
          @click="next"
        >{{ step === 3 ? 'See my plan' : 'Next' }}</AppButton>
      </div>
    </div>
  </ClayCard>
</template>

<style scoped>
.hp {
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.hp-head { display: flex; flex-direction: column; gap: 14px; }
.hp-stepper { display: flex; flex-wrap: wrap; gap: 8px; }
.hp-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 18px 8px 8px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.05);
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  border: 0;
  transition: background var(--d-fast) ease, color var(--d-fast) ease;
}
.hp-step span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(35, 45, 39, 0.12);
  font-weight: 900;
}
.hp-step.is-done { background: var(--brand-lime-soft); color: var(--shade-deep); }
.hp-step.is-done span { background: var(--brand-sage); color: #fff; }
.hp-step.is-active { background: var(--brand-ink-soft); color: #fff; }
.hp-step.is-active span { background: var(--brand-lime); color: #142016; }
.hp-step:disabled { cursor: not-allowed; opacity: 0.7; }

.hp-progress {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.08);
  overflow: hidden;
}
.hp-progress::after {
  content: "";
  position: absolute;
  inset: 0;
  width: var(--p, 20%);
  background: linear-gradient(90deg, var(--brand-lime), var(--brand-sage));
  border-radius: 999px;
  transition: width var(--d-base) var(--ease-out-expo);
}

.hp-body { display: flex; flex-direction: column; gap: 22px; }
.hp-title {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 950;
  line-height: 1.15;
}
.hp-lede {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.55;
  max-width: 56ch;
}

.hp-detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 22px;
  align-items: flex-start;
}
.hp-empty {
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  border: 1px dashed var(--brand-line);
}

.hp-warn {
  padding: 16px 20px;
  border-radius: 18px;
  background: var(--peach-soft);
  color: #8b3f25;
  font-weight: 800;
  font-size: 1rem;
}
.hp-link {
  background: transparent;
  border: 0;
  text-decoration: underline;
  font-weight: 900;
  color: #8b3f25;
  cursor: pointer;
  padding: 0;
}

.hp-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}
.hp-nav-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media (max-width: 880px) {
  .hp-detail-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hp-nav { flex-direction: column-reverse; align-items: stretch; }
}
</style>
