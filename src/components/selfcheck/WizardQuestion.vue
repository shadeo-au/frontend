<script setup lang="ts" generic="T extends string">
defineProps<{
  question: string;
  options: { value: T; label: string; hint?: string }[];
  modelValue: T | null;
  helper?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: T): void;
}>();
</script>

<template>
  <fieldset class="wq">
    <legend class="wq__legend">{{ question }}</legend>
    <p v-if="helper" class="wq__helper">{{ helper }}</p>
    <div class="wq__options">
      <label
        v-for="opt in options"
        :key="opt.value"
        :class="['wq__option', { 'is-selected': modelValue === opt.value }]"
      >
        <input
          type="radio"
          :name="question"
          :value="opt.value"
          :checked="modelValue === opt.value"
          @change="$emit('update:modelValue', opt.value)"
        />
        <span class="wq__radio" aria-hidden="true"></span>
        <span class="wq__label">
          <strong>{{ opt.label }}</strong>
          <small v-if="opt.hint">{{ opt.hint }}</small>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.wq {
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wq__legend {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.2rem, 1.6vw, 1.45rem);
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 0;
  text-wrap: balance;
}

.wq__helper {
  color: var(--brand-ink-muted);
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 600;
  margin: -4px 0 4px;
}

.wq__options {
  display: grid;
  gap: 10px;
}

.wq__option {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1.5px solid var(--brand-line);
  cursor: pointer;
  transition: background var(--d-fast) ease, border-color var(--d-fast) ease, transform var(--d-fast) ease;
}
.wq__option:hover { background: rgba(255, 255, 255, 1); }
.wq__option.is-selected {
  background: var(--brand-lime-soft);
  border-color: rgba(91, 140, 97, 0.45);
}

.wq__option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.wq__radio {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(35, 45, 39, 0.35);
  background: #fff;
  position: relative;
  transition: border-color var(--d-fast) ease;
}
.wq__option.is-selected .wq__radio {
  border-color: var(--brand-sage);
}
.wq__option.is-selected .wq__radio::after {
  content: "";
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--brand-sage);
}

.wq__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.wq__label strong {
  color: var(--brand-ink-soft);
  font-size: 1.0625rem;
  font-weight: 800;
  line-height: 1.3;
}
.wq__label small {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.wq__option:focus-within {
  box-shadow: var(--brand-focus-ring);
}
</style>
