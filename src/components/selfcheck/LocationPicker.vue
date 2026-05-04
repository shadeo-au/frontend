<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { searchSuburbs } from '@/lib/selfcheck/area-profiles';
import type { SuburbIndexEntry } from '@/lib/selfcheck/types';

const props = defineProps<{
  current: SuburbIndexEntry | null;
}>();

const emit = defineEmits<{
  (e: 'select', s: SuburbIndexEntry): void;
}>();

const open = ref(false);
const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const suggestions = computed<SuburbIndexEntry[]>(() => searchSuburbs(query.value));

function focus() {
  open.value = true;
  query.value = '';
  setTimeout(() => inputRef.value?.focus(), 0);
}

function close() {
  open.value = false;
  query.value = '';
}

function pick(s: SuburbIndexEntry) {
  emit('select', s);
  close();
}

watch(() => props.current, () => {
  // close picker when parent changes selection
  open.value = false;
});

function onBlur(event: FocusEvent) {
  // Allow click on suggestion before closing
  const next = event.relatedTarget as HTMLElement | null;
  if (next?.closest('.location-picker__menu')) return;
  setTimeout(close, 120);
}
</script>

<template>
  <div class="location-picker" :class="{ 'is-open': open }">
    <button
      v-if="!open"
      type="button"
      class="location-picker__chip"
      @click="focus"
      :aria-label="current ? `Change location, currently ${current.name}` : 'Choose your location'"
    >
      <span class="location-picker__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </span>
      <span class="location-picker__text">
        <strong v-if="current">{{ current.name }}, {{ current.state }} {{ current.postcode }}</strong>
        <strong v-else>Choose your suburb</strong>
        <small>Tap to change location</small>
      </span>
    </button>

    <div v-else class="location-picker__editor">
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        class="location-picker__input"
        placeholder="Type a suburb or postcode (e.g. Carlton or 3053)"
        autocomplete="off"
        @blur="onBlur"
      />
      <ul class="location-picker__menu" role="listbox">
        <li v-if="!suggestions.length" class="location-picker__empty">
          No matching suburb yet. Try Carlton, Brunswick, Box Hill, or 3000.
        </li>
        <li
          v-for="s in suggestions"
          :key="s.key"
          class="location-picker__option"
          tabindex="0"
          @click="pick(s)"
          @keydown.enter="pick(s)"
          @keydown.space.prevent="pick(s)"
        >
          <strong>{{ s.name }}</strong>
          <span>{{ s.state }} {{ s.postcode }}</span>
        </li>
      </ul>
      <button type="button" class="location-picker__cancel" @click="close">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.location-picker {
  display: inline-block;
  width: 100%;
  max-width: 480px;
}

.location-picker__chip {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 10px 22px 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay-sm);
  text-align: left;
  cursor: pointer;
  transition: transform var(--d-fast) ease, background var(--d-fast) ease;
}
.location-picker__chip:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.location-picker__icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-lime-soft);
  color: #1d371f;
}

.location-picker__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.location-picker__text strong {
  color: var(--brand-ink-soft);
  font-size: 1.125rem;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.location-picker__text small {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.location-picker__editor {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 22px;
  background: var(--brand-paper-white);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--sh-clay);
  overflow: hidden;
}

.location-picker__input {
  width: 100%;
  min-height: 64px;
  padding: 18px 22px;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-ink);
}

.location-picker__menu {
  list-style: none;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  border-top: 1px solid var(--brand-line-soft);
}

.location-picker__option {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 14px;
  cursor: pointer;
  outline: 0;
}
.location-picker__option:hover,
.location-picker__option:focus-visible {
  background: rgba(155, 224, 111, 0.18);
}
.location-picker__option strong {
  color: var(--brand-ink-soft);
  font-size: 1.0625rem;
  font-weight: 800;
}
.location-picker__option span {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.location-picker__empty {
  padding: 14px 16px;
  color: var(--brand-ink-muted);
  font-size: 1rem;
  line-height: 1.45;
}

.location-picker__cancel {
  min-height: 48px;
  padding: 12px 18px;
  border-top: 1px solid var(--brand-line-soft);
  background: rgba(252, 247, 235, 0.6);
  color: var(--brand-ink-soft);
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
}
.location-picker__cancel:hover {
  background: rgba(252, 247, 235, 1);
}
</style>
