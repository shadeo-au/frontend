<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  GROUP_LABELS,
  MEDICATIONS,
  type Medication,
} from '@/lib/selfcheck/medication-data';

const props = defineProps<{
  selectedIds: string[];
}>();

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'clear'): void;
}>();

const search = ref('');
const expandedGroups = ref<Set<string>>(new Set());

const groupOrder = Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>;

interface Group {
  key: string;
  label: string;
  meds: Medication[];
}

const groups = computed<Group[]>(() => {
  const q = search.value.trim().toLowerCase();
  const out: Group[] = [];
  for (const key of groupOrder) {
    const meds = MEDICATIONS.filter((m) => m.group === key).filter((m) => {
      if (!q) return true;
      const hay = `${m.generic} ${m.brands_au.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
    if (meds.length === 0) continue;
    out.push({ key, label: GROUP_LABELS[key], meds });
  }
  return out;
});

function isOpen(key: string) {
  if (search.value.trim().length > 0) return true;
  return expandedGroups.value.has(key);
}

function toggleGroup(key: string) {
  if (search.value.trim().length > 0) return;
  const next = new Set(expandedGroups.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedGroups.value = next;
}

function isSelected(id: string) {
  return props.selectedIds.includes(id);
}

function selectedCountIn(group: Group) {
  return group.meds.filter((m) => isSelected(m.id)).length;
}
</script>

<template>
  <div class="mp">
    <div class="mp-search">
      <label for="med-search" class="mp-search-label">Search a medicine name</label>
      <input
        id="med-search"
        v-model="search"
        type="search"
        placeholder="e.g. Lasix, sertraline, propranolol"
        autocomplete="off"
        class="mp-search-input"
      />
      <button
        v-if="selectedIds.length"
        type="button"
        class="mp-clear"
        @click="emit('clear')"
      >Clear all ({{ selectedIds.length }})</button>
    </div>

    <p v-if="!groups.length" class="mp-empty">
      No medicines match "{{ search }}". Try a different name, or browse by category below.
    </p>

    <ul class="mp-groups">
      <li
        v-for="g in groups"
        :key="g.key"
        :class="['mp-group', { 'is-open': isOpen(g.key) }]"
      >
        <button type="button" class="mp-group-head" @click="toggleGroup(g.key)" :aria-expanded="isOpen(g.key)">
          <span class="mp-group-label">{{ g.label }}</span>
          <span class="mp-group-meta">
            <span v-if="selectedCountIn(g) > 0" class="mp-group-pill">{{ selectedCountIn(g) }} ticked</span>
            <span class="mp-group-arrow" aria-hidden="true">▾</span>
          </span>
        </button>
        <ul v-if="isOpen(g.key)" class="mp-meds">
          <li v-for="m in g.meds" :key="m.id">
            <button
              type="button"
              :class="['mp-med', { 'is-selected': isSelected(m.id), [`mp-med--tier-${m.tier}`]: true }]"
              :aria-pressed="isSelected(m.id)"
              @click="emit('toggle', m.id)"
            >
              <span class="mp-med-box" aria-hidden="true"></span>
              <span class="mp-med-text">
                <strong>{{ m.generic }}</strong>
                <small v-if="m.brands_au.length">{{ m.brands_au.join(' · ') }}</small>
              </span>
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.mp {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mp-search {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}
.mp-search-label {
  flex: 0 0 100%;
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.mp-search-input {
  flex: 1 1 320px;
  min-height: 52px;
  padding: 12px 18px;
  border-radius: 26px;
  border: 1.5px solid var(--brand-line);
  background: var(--surface);
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 700;
}
.mp-search-input:focus { outline: 3px solid var(--brand-lime); outline-offset: 2px; }

.mp-clear {
  min-height: 48px;
  padding: 8px 18px;
  border-radius: 22px;
  border: 1.5px solid var(--brand-line);
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-weight: 800;
  cursor: pointer;
}
.mp-clear:hover { background: var(--peach-soft); border-color: rgba(184, 58, 44, 0.3); color: #8b3f25; }

.mp-empty {
  padding: 16px;
  border-radius: 14px;
  background: var(--brand-paper-white);
  border: 1px dashed var(--brand-line);
  color: var(--brand-ink-muted);
  font-weight: 700;
}

.mp-groups {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mp-group {
  border-radius: 18px;
  background: var(--surface);
  border: 1.5px solid var(--brand-line);
  overflow: hidden;
  transition: border-color var(--d-fast) ease;
}
.mp-group.is-open { border-color: rgba(98, 133, 107, 0.35); }
.mp-group-head {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
}
.mp-group-head:hover { background: rgba(155, 224, 111, 0.08); }
.mp-group-label {
  font-weight: 900;
  font-size: 1.05rem;
  color: var(--brand-ink);
}
.mp-group-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mp-group-pill {
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 900;
}
.mp-group-arrow {
  font-size: 1.1rem;
  color: var(--brand-ink-muted);
  transition: transform var(--d-fast) ease;
}
.mp-group.is-open .mp-group-arrow { transform: rotate(180deg); }

.mp-meds {
  list-style: none;
  padding: 0 12px 12px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.mp-med {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--brand-paper-white);
  border: 1.5px solid var(--brand-line);
  border-radius: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--d-fast) ease, background var(--d-fast) ease;
  font-family: var(--font-body);
  min-height: 56px;
}
.mp-med:hover { background: rgba(155, 224, 111, 0.10); }
.mp-med-box {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(35, 45, 39, 0.30);
  background: transparent;
  margin-top: 2px;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease;
}
.mp-med-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.mp-med-text strong {
  color: var(--brand-ink);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.2;
}
.mp-med-text small {
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 700;
}
.mp-med.is-selected {
  background: var(--brand-lime-soft);
  border-color: var(--brand-sage);
}
.mp-med.is-selected .mp-med-box {
  background: var(--brand-sage);
  border-color: var(--brand-sage);
  box-shadow: inset 0 0 0 3px var(--surface);
}
.mp-med--tier-A.is-selected { border-color: #b83a2c; background: var(--peach-soft); }
.mp-med--tier-A.is-selected .mp-med-box { background: #b83a2c; border-color: #b83a2c; }
.mp-med--tier-B.is-selected { border-color: var(--brand-gold); background: var(--sun-soft); }
.mp-med--tier-B.is-selected .mp-med-box { background: var(--brand-gold); border-color: var(--brand-gold); }
</style>
