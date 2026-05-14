<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import ClayCard from '@/components/ClayCard.vue';
import WizardQuestion from './WizardQuestion.vue';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import type {
  AreaProfile,
  SelfCheckAnswers,
  SuburbIndexEntry,
} from '@/lib/selfcheck/types';

const props = defineProps<{
  area: AreaProfile | null;
  suburb: SuburbIndexEntry | null;
  answers: SelfCheckAnswers;
}>();

const emit = defineEmits<{
  (e: 'update:answers', value: SelfCheckAnswers): void;
  (e: 'submit'): void;
}>();

const stepLabels = ['Your area', 'Your health', 'Your home', 'Your support'];
const step = ref(0);
const progressEl = ref<HTMLElement | null>(null);
let ctx: gsap.Context | undefined;

const a = computed(() => props.answers);

function patch<K extends keyof SelfCheckAnswers>(group: K, partial: Partial<SelfCheckAnswers[K]>) {
  const next: SelfCheckAnswers = {
    ...props.answers,
    [group]: { ...props.answers[group], ...partial },
  };
  emit('update:answers', next);
}

function nextStep() {
  if (step.value < stepLabels.length - 1) step.value += 1;
  else emit('submit');
}

function prevStep() {
  if (step.value > 0) step.value -= 1;
}

const stepValid = computed(() => {
  switch (step.value) {
    case 0: return !!props.suburb;
    case 1: {
      const p = a.value.personal;
      return !!(p.age_band && p.has_chronic && p.prior_heat_discomfort && p.takes_medication && p.mobility);
    }
    case 2: {
      const h = a.value.home;
      return !!(h.has_ac && h.keeps_cool && h.sun_exposure && h.upper_floor && h.knows_cool_place);
    }
    case 3: {
      const s = a.value.social;
      return !!(s.lives_alone && s.check_in && s.emergency_contact && s.comm_frequency && s.knows_local_services);
    }
    default: return false;
  }
});

const isLast = computed(() => step.value === stepLabels.length - 1);
const progressPct = computed(() => `${((step.value + 1) / stepLabels.length) * 100}%`);

const animateProgress = () => {
  if (!progressEl.value) return;
  gsap.to(progressEl.value, {
    '--p': progressPct.value,
    duration: prefersReducedMotion() ? 0 : 0.4,
    ease: 'power3.out',
  });
};

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.set(progressEl.value, { '--p': progressPct.value });
  }, progressEl.value ?? undefined);
});

watch(step, animateProgress);

onBeforeUnmount(() => {
  ctx?.revert();
});
</script>

<template>
  <ClayCard tone="white" radius="2xl" class="wizard">
    <div class="wizard__head">
      <div class="wizard__stepper">
        <button
          v-for="(label, i) in stepLabels"
          :key="label"
          type="button"
          :class="['wizard__step', { 'is-active': i === step, 'is-done': i < step }]"
          :disabled="i > step && !stepValid"
          @click="step = i"
        >
          <span>{{ i + 1 }}</span>{{ label }}
        </button>
      </div>
      <div ref="progressEl" class="wizard__progress"></div>
    </div>

    <!-- Step 1: Area confirm -->
    <div v-if="step === 0" class="wizard__body">
      <h3 class="wizard__title">Confirm your area</h3>
      <p class="wizard__lede">
        We use your suburb only to estimate local heat exposure — never stored, never linked to you.
      </p>
      <ClayCard v-if="suburb" tone="sage" radius="lg">
        <div class="confirm">
          <div>
            <small>Selected location</small>
            <strong>{{ suburb.name }}, {{ suburb.state }} {{ suburb.postcode }}</strong>
          </div>
          <div v-if="area" class="confirm__score">
            <small>Area exposure score</small>
            <strong>{{ area.overall_location_exposure_score }} / 5</strong>
          </div>
          <div v-else class="confirm__score">
            <small>Area exposure</small>
            <strong>Not yet available</strong>
          </div>
        </div>
      </ClayCard>
      <p v-else class="wizard__warn">
        Please choose a suburb above before continuing.
      </p>
    </div>

    <!-- Step 2: Personal -->
    <div v-else-if="step === 1" class="wizard__body">
      <h3 class="wizard__title">Your health and sensitivity</h3>
      <p class="wizard__lede">
        Five short questions. There are no wrong answers, and "Not sure" is always an option.
      </p>

      <WizardQuestion
        question="What is your age group?"
        :model-value="a.personal.age_band"
        @update:model-value="(v) => patch('personal', { age_band: v })"
        :options="[
          { value: '60-64', label: '60–64' },
          { value: '65-74', label: '65–74' },
          { value: '75-84', label: '75–84' },
          { value: '85+',   label: '85 or over' },
        ]"
      />

      <WizardQuestion
        question="Do you have any long-term health conditions?"
        :model-value="a.personal.has_chronic"
        @update:model-value="(v) => patch('personal', { has_chronic: v })"
        :options="[
          { value: 'no',          label: 'No' },
          { value: 'yes',         label: 'Yes' },
          { value: 'unsure',      label: 'Not sure' },
          { value: 'prefer_not',  label: 'Prefer not to say' },
        ]"
      />

      <WizardQuestion
        question="Do you sometimes feel dizzy, weak, or very tired during hot weather?"
        :model-value="a.personal.prior_heat_discomfort"
        @update:model-value="(v) => patch('personal', { prior_heat_discomfort: v })"
        :options="[
          { value: 'never',     label: 'Never' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often',     label: 'Often' },
        ]"
      />

      <WizardQuestion
        question="Do you take regular medication?"
        helper="Some medicines can affect how the body handles heat. If unsure, ask a GP or pharmacist."
        :model-value="a.personal.takes_medication"
        @update:model-value="(v) => patch('personal', { takes_medication: v })"
        :options="[
          { value: 'no',          label: 'No' },
          { value: 'yes',         label: 'Yes' },
          { value: 'unsure',      label: 'Not sure' },
          { value: 'prefer_not',  label: 'Prefer not to say' },
        ]"
      />

      <WizardQuestion
        question="Do you have limited mobility or need walking assistance?"
        :model-value="a.personal.mobility"
        @update:model-value="(v) => patch('personal', { mobility: v })"
        :options="[
          { value: 'no',       label: 'No' },
          { value: 'a_little', label: 'A little' },
          { value: 'yes',      label: 'Yes' },
        ]"
      />
    </div>

    <!-- Step 3: Home -->
    <div v-else-if="step === 2" class="wizard__body">
      <h3 class="wizard__title">Your home and cooling</h3>
      <p class="wizard__lede">
        How well your home stays cool during the hottest part of the day.
      </p>

      <WizardQuestion
        question="Do you have working air conditioning or a fan?"
        :model-value="a.home.has_ac"
        @update:model-value="(v) => patch('home', { has_ac: v })"
        :options="[
          { value: 'yes',      label: 'Yes, air conditioning' },
          { value: 'fan_only', label: 'Fan only' },
          { value: 'no',       label: 'No' },
          { value: 'unsure',   label: 'Not sure' },
        ]"
      />

      <WizardQuestion
        question="Can you keep your home cool during hot afternoons?"
        :model-value="a.home.keeps_cool"
        @update:model-value="(v) => patch('home', { keeps_cool: v })"
        :options="[
          { value: 'usually',   label: 'Usually' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'rarely',    label: 'Rarely' },
        ]"
      />

      <WizardQuestion
        question="Does strong sunlight enter your home during the hottest part of the day?"
        :model-value="a.home.sun_exposure"
        @update:model-value="(v) => patch('home', { sun_exposure: v })"
        :options="[
          { value: 'no',   label: 'No' },
          { value: 'some', label: 'Some rooms' },
          { value: 'many', label: 'Many rooms' },
        ]"
      />

      <WizardQuestion
        question="Do you live on an upper floor or in a home that becomes very hot?"
        :model-value="a.home.upper_floor"
        @update:model-value="(v) => patch('home', { upper_floor: v })"
        :options="[
          { value: 'no',     label: 'No' },
          { value: 'yes',    label: 'Yes' },
          { value: 'unsure', label: 'Not sure' },
        ]"
      />

      <WizardQuestion
        question="Do you know a cooler place nearby where you can go during very hot weather?"
        :model-value="a.home.knows_cool_place"
        @update:model-value="(v) => patch('home', { knows_cool_place: v })"
        :options="[
          { value: 'yes',    label: 'Yes' },
          { value: 'unsure', label: 'Not sure' },
          { value: 'no',     label: 'No' },
        ]"
      />
    </div>

    <!-- Step 4: Social -->
    <div v-else class="wizard__body">
      <h3 class="wizard__title">Support during hot days</h3>
      <p class="wizard__lede">
        Whether someone can check in with you on very hot days. There's no "right" answer here.
      </p>

      <WizardQuestion
        question="Do you live alone?"
        :model-value="a.social.lives_alone"
        @update:model-value="(v) => patch('social', { lives_alone: v })"
        :options="[
          { value: 'no',  label: 'No' },
          { value: 'yes', label: 'Yes' },
        ]"
      />

      <WizardQuestion
        question="Is there someone who checks on you during very hot days?"
        :model-value="a.social.check_in"
        @update:model-value="(v) => patch('social', { check_in: v })"
        :options="[
          { value: 'yes',       label: 'Yes' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'no',        label: 'No' },
        ]"
      />

      <WizardQuestion
        question="Do you have a clear emergency contact saved or visible?"
        :model-value="a.social.emergency_contact"
        @update:model-value="(v) => patch('social', { emergency_contact: v })"
        :options="[
          { value: 'yes',         label: 'Yes' },
          { value: 'unsure',      label: 'Not sure' },
          { value: 'no',          label: 'No' },
          { value: 'prefer_not',  label: 'Prefer not to say' },
        ]"
      />

      <WizardQuestion
        question="How often do you talk to family, friends, neighbours, or carers?"
        :model-value="a.social.comm_frequency"
        @update:model-value="(v) => patch('social', { comm_frequency: v })"
        :options="[
          { value: 'daily',         label: 'Daily' },
          { value: 'few_per_week',  label: 'A few times a week' },
          { value: 'rarely',        label: 'Rarely' },
        ]"
      />

      <WizardQuestion
        question="Do you know any local services or community groups for older people?"
        :model-value="a.social.knows_local_services"
        @update:model-value="(v) => patch('social', { knows_local_services: v })"
        :options="[
          { value: 'yes',    label: 'Yes' },
          { value: 'unsure', label: 'Not sure' },
          { value: 'no',     label: 'No' },
        ]"
      />
    </div>

    <div class="wizard__nav">
      <AppButton
        v-if="step > 0"
        variant="secondary"
        @click="prevStep"
      >Back</AppButton>
      <span v-else></span>
      <AppButton
        variant="primary"
        :disabled="!stepValid"
        @click="nextStep"
      >{{ isLast ? 'See my result' : 'Next' }}</AppButton>
    </div>
  </ClayCard>
</template>

<style scoped>
.wizard {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.wizard__head {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wizard__stepper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wizard__step {
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
  letter-spacing: 0;
  cursor: pointer;
  border: 0;
  transition: background var(--d-fast) ease, color var(--d-fast) ease;
}
.wizard__step span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(35, 45, 39, 0.12);
  font-weight: 900;
}
.wizard__step.is-done {
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
}
.wizard__step.is-done span { background: var(--brand-sage); color: #fff; }
.wizard__step.is-active {
  background: var(--brand-ink-soft);
  color: #fff;
}
.wizard__step.is-active span { background: var(--brand-lime); color: #142016; }
.wizard__step:disabled { cursor: not-allowed; opacity: 0.7; }

.wizard__progress {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.08);
  overflow: hidden;
}
.wizard__progress::after {
  content: "";
  position: absolute;
  inset: 0;
  width: var(--p, 25%);
  background: linear-gradient(90deg, var(--brand-lime), var(--brand-sage));
  border-radius: 999px;
}

.wizard__body {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.wizard__title {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 950;
  line-height: 1.15;
  letter-spacing: 0;
}

.wizard__lede {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.55;
  max-width: 56ch;
}

.wizard__warn {
  padding: 14px 18px;
  border-radius: 16px;
  background: var(--peach-soft);
  color: #8b3f25;
  font-weight: 800;
  font-size: 1rem;
}

.confirm {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.confirm small {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.confirm strong {
  display: block;
  color: var(--brand-ink-soft);
  font-size: 1.4rem;
  font-weight: 900;
  margin-top: 2px;
}
.confirm__score {
  text-align: right;
}

.wizard__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .wizard__nav {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
