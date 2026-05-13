<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import AppButton from '@/components/AppButton.vue';
import type { SelfCheckAnswers } from '@/lib/selfcheck/types';

const props = defineProps<{
  area: unknown;
  suburb: unknown;
  answers: SelfCheckAnswers;
}>();

const emit = defineEmits<{
  (e: 'update:answers', value: SelfCheckAnswers): void;
  (e: 'submit'): void;
}>();

type QuestionKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9';

interface Question {
  key: QuestionKey;
  number: string;
  text: string;
  icon: string;
  helper?: string;
  options: string[];
}

interface Step {
  title: string;
  subtitle: string;
  questions: Question[];
}

const steps: Step[] = [
  {
    title: 'Part 1: Your Area',
    subtitle: 'About your neighbourhood and outdoor exposure',
    questions: [
      {
        key: 'q1',
        number: 'Question 1 of 9',
        text: 'Are there places nearby (within a 5-10 minute walk) where you can cool down?',
        icon: 'material-symbols:park',
        helper: 'Such as a park, shopping centre, or library',
        options: ['Quite a few nearby', 'A few options', 'Hardly any'],
      },
      {
        key: 'q2',
        number: 'Question 2 of 9',
        text: 'On very hot days, do you need to go outside?',
        icon: 'material-symbols:directions-walk',
        options: ['Rarely go out', 'Sometimes need to', 'Must go out often'],
      },
    ],
  },
  {
    title: 'Part 2: Your Health',
    subtitle: 'How your body responds to heat',
    questions: [
      {
        key: 'q3',
        number: 'Question 3 of 9',
        text: 'Which age group are you in?',
        icon: 'material-symbols:elderly',
        options: ['65-74 years old', '75-84 years old', '85 years or older'],
      },
      {
        key: 'q4',
        number: 'Question 4 of 9',
        text: "When it's very hot, do you often feel unwell?",
        icon: 'material-symbols:thermometer',
        helper: 'Such as dizziness, tiredness, or unusual thirst',
        options: ['Rarely', 'Sometimes', 'Often'],
      },
    ],
  },
  {
    title: 'Part 3: Your Home',
    subtitle: 'Your ability to keep cool at home',
    questions: [
      {
        key: 'q5',
        number: 'Question 5 of 9',
        text: 'Do you have cooling equipment at home?',
        icon: 'material-symbols:mode-fan',
        helper: 'Such as an air conditioner or fan',
        options: ['Yes, and I use it regularly', 'Yes, but I rarely use it or find it tricky', 'No cooling equipment'],
      },
      {
        key: 'q6',
        number: 'Question 6 of 9',
        text: 'On a hot day, how does your home usually feel?',
        icon: 'material-symbols:device-thermostat',
        options: ['Fairly cool and comfortable', 'A bit warm', 'Very hot and uncomfortable'],
      },
      {
        key: 'q7',
        number: 'Question 7 of 9',
        text: 'If your home gets too hot, is there somewhere you can go to cool down?',
        icon: 'material-symbols:location-on',
        helper: 'Such as a shopping centre, library, or community centre',
        options: ['Yes, I know exactly where to go', 'Not entirely sure', "No, I don't have anywhere"],
      },
    ],
  },
  {
    title: 'Part 4: Your Support',
    subtitle: 'The people around you during hot weather',
    questions: [
      {
        key: 'q8',
        number: 'Question 8 of 9',
        text: 'Who do you currently live with?',
        icon: 'material-symbols:group',
        options: ['With family or a partner', 'Sometimes have company', 'I live alone'],
      },
      {
        key: 'q9',
        number: 'Question 9 of 9',
        text: 'During hot weather, does someone check in on you?',
        icon: 'material-symbols:phone-in-talk',
        helper: 'By phone, message, or a visit',
        options: ['Regularly', 'Occasionally', 'Rarely or never'],
      },
    ],
  },
];

const stepTabs = ['Your Area', 'Your Health', 'Your Home', 'Your Support'];
const step = reactive({ current: 0 });
const selected = reactive<Record<QuestionKey, number | null>>({
  q1: null,
  q2: null,
  q3: null,
  q4: null,
  q5: null,
  q6: null,
  q7: null,
  q8: null,
  q9: null,
});

const currentStep = computed(() => steps[step.current]);
const isLast = computed(() => step.current === steps.length - 1);
const stepValid = computed(() => currentStep.value.questions.every((q) => selected[q.key] !== null));
const sectionBody = ref<HTMLElement | null>(null);

watch(
  () => step.current,
  () => emit('update:answers', toSelfCheckAnswers()),
);

watch(
  () => props.answers,
  (answers) => {
    const isReset = [
      answers.personal.age_band,
      answers.personal.prior_heat_discomfort,
      answers.personal.mobility,
      answers.home.has_ac,
      answers.home.keeps_cool,
      answers.home.knows_cool_place,
      answers.social.lives_alone,
      answers.social.check_in,
      answers.social.knows_local_services,
    ].every((value) => value === null);

    if (!isReset) return;
    step.current = 0;
    Object.keys(selected).forEach((key) => {
      selected[key as QuestionKey] = null;
    });
  },
  { deep: true },
);

function choose(key: QuestionKey, value: number) {
  selected[key] = value;
  emit('update:answers', toSelfCheckAnswers());
}

function nextStep() {
  if (!stepValid.value) return;
  if (isLast.value) {
    emit('update:answers', toSelfCheckAnswers());
    emit('submit');
    return;
  }
  step.current += 1;
  scrollToFirstQuestion();
}

function prevStep() {
  if (step.current > 0) step.current -= 1;
}

async function scrollToFirstQuestion() {
  await nextTick();
  const firstQuestion = sectionBody.value?.querySelector<HTMLElement>('.question-block');
  if (!firstQuestion) return;

  const top = firstQuestion.getBoundingClientRect().top + window.scrollY - 110;
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
}

function toSelfCheckAnswers(): SelfCheckAnswers {
  const q = (key: QuestionKey, fallback = 0) => selected[key] ?? fallback;

  return {
    personal: {
      age_band: q('q3') === 0 ? '65-74' : q('q3') === 1 ? '75-84' : '85+',
      has_chronic: q('q4') === 2 ? 'yes' : q('q4') === 1 ? 'unsure' : 'no',
      prior_heat_discomfort: q('q4') === 0 ? 'never' : q('q4') === 1 ? 'sometimes' : 'often',
      takes_medication: 'unsure',
      mobility: q('q2') === 0 ? 'no' : q('q2') === 1 ? 'a_little' : 'yes',
    },
    home: {
      has_ac: q('q5') === 0 ? 'yes' : q('q5') === 1 ? 'fan_only' : 'no',
      keeps_cool: q('q6') === 0 ? 'usually' : q('q6') === 1 ? 'sometimes' : 'rarely',
      sun_exposure: q('q6') === 0 ? 'no' : q('q6') === 1 ? 'some' : 'many',
      upper_floor: q('q6') === 2 ? 'yes' : 'no',
      knows_cool_place: q('q7') === 0 ? 'yes' : q('q7') === 1 ? 'unsure' : 'no',
    },
    social: {
      lives_alone: q('q8') === 0 ? 'no' : q('q8') === 1 ? 'sometimes' : 'yes',
      check_in: q('q9') === 0 ? 'yes' : q('q9') === 1 ? 'sometimes' : 'no',
      emergency_contact: q('q9') === 2 ? 'unsure' : 'yes',
      comm_frequency: q('q9') === 0 ? 'daily' : q('q9') === 1 ? 'few_per_week' : 'rarely',
      knows_local_services: q('q1') === 2 ? 'no' : q('q1') === 1 ? 'unsure' : 'yes',
    },
  };
}
</script>

<template>
  <div class="heat-check">
    <div class="progress-strip" aria-label="Self-check progress">
      <button
        v-for="(item, i) in steps"
        :key="item.title"
        type="button"
        :class="['progress-step', { active: i === step.current, done: i < step.current }]"
        :disabled="i > step.current"
        @click="step.current = i"
      >
        <span class="step-num">{{ i + 1 }}</span>
        {{ stepTabs[i] }}
      </button>
    </div>

    <section class="section-card" :aria-labelledby="`self-check-step-${step.current}`">
      <header class="section-header">
        <div class="section-icon" aria-hidden="true">
          <span>{{ step.current + 1 }}</span>
        </div>
        <div>
          <h3 :id="`self-check-step-${step.current}`">{{ currentStep.title }}</h3>
          <p>{{ currentStep.subtitle }}</p>
        </div>
      </header>

      <div ref="sectionBody" class="section-body">
        <div
          v-for="question in currentStep.questions"
          :key="question.key"
          class="question-block"
        >
          <div class="question-num">{{ question.number }}</div>
          <fieldset>
            <legend>
              <span class="question-title-row">
                <span class="question-icon" aria-hidden="true">
                  <Icon :icon="question.icon" />
                </span>
                <span>
                  {{ question.text }}
                  <small v-if="question.helper">{{ question.helper }}</small>
                </span>
              </span>
            </legend>
            <div class="options">
              <label
                v-for="(option, index) in question.options"
                :key="option"
                :class="['option-label', { selected: selected[question.key] === index }]"
              >
                <input
                  type="radio"
                  :name="question.key"
                  :value="index"
                  :checked="selected[question.key] === index"
                  @change="choose(question.key, index)"
                />
                <span class="option-dot" aria-hidden="true"></span>
                <span class="option-icon" aria-hidden="true">{{ index + 1 }}</span>
                <span>{{ option }}</span>
              </label>
            </div>
          </fieldset>
        </div>

        <p v-if="!stepValid" class="error-msg">Please answer all questions before continuing.</p>

        <div class="btn-row">
          <AppButton v-if="step.current > 0" variant="secondary" @click="prevStep">Back</AppButton>
          <AppButton variant="primary" :disabled="!stepValid" @click="nextStep">
            {{ isLast ? 'See My Results' : 'Next' }}
          </AppButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.heat-check {
  border-radius: 18px;
  overflow: hidden;
  background: var(--brand-paper-white);
  border: 1.5px solid var(--brand-line);
  box-shadow: var(--brand-shadow-panel);
}

.progress-strip {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1.5px solid var(--brand-line);
}

.progress-step {
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  padding: 14px 20px;
  color: var(--brand-ink-muted);
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 800;
  white-space: nowrap;
  transition: color var(--d-fast) ease, border-color var(--d-fast) ease, background var(--d-fast) ease;
}

.progress-step.active {
  color: var(--shade-deep);
  border-bottom-color: var(--brand-lime-hover);
  background: rgba(155, 224, 111, 0.12);
}

.progress-step.done {
  color: var(--brand-sage);
}

.progress-step:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.step-num {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(35, 45, 39, 0.1);
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  font-weight: 900;
}

.progress-step.active .step-num {
  background: var(--shade-deep);
  color: #fff;
}

.progress-step.done .step-num {
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
}

.section-card {
  background: rgba(255, 255, 255, 0.82);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 28px 32px;
  color: #fff;
  background:
    radial-gradient(circle at 92% 12%, rgba(190, 238, 139, 0.34), transparent 36%),
    linear-gradient(135deg, #31483a 0%, #4f7958 54%, #82aa73 100%);
}

.section-icon {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
}

.section-icon span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-lime);
  color: #142016;
  font-weight: 950;
}

.section-header h3 {
  color: #fff;
  font-family: var(--font-editorial);
  font-size: clamp(1.45rem, 2.1vw, 1.75rem);
  font-weight: 600;
  letter-spacing: 0;
}

.section-header p {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.98rem;
  font-weight: 500;
}

.section-body {
  padding: clamp(24px, 4vw, 34px);
}

.question-block {
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1.5px solid var(--brand-line-soft);
}

.question-block:last-of-type {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}

.question-num {
  margin-bottom: 8px;
  color: var(--brand-sage);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}

legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 18px;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(1.22rem, 1.5vw, 1.42rem);
  font-weight: 600;
  line-height: 1.35;
}

.question-title-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: flex-start;
  gap: 12px;
}

.question-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
  font-size: 1.45rem;
}

legend small {
  display: block;
  margin-top: 4px;
  color: var(--brand-ink-muted);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.45;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 66px;
  padding: 15px 20px;
  border: 1.5px solid var(--brand-line);
  border-radius: 14px;
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  font-size: 1.06rem;
  font-weight: 650;
  cursor: pointer;
  transition:
    background var(--d-fast) ease,
    border-color var(--d-fast) ease,
    color var(--d-fast) ease,
    transform var(--d-fast) var(--ease-out-expo);
}

.option-label:hover {
  transform: translateY(-1px);
  border-color: rgba(91, 140, 97, 0.36);
  background: rgba(228, 248, 213, 0.38);
}

.option-label.selected {
  border-color: rgba(91, 140, 97, 0.72);
  background: var(--brand-lime-soft);
  color: var(--shade-deep);
}

.option-label input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-dot {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(35, 45, 39, 0.24);
  background: #fff;
  position: relative;
}

.option-label.selected .option-dot {
  border-color: var(--shade-deep);
  background: var(--shade-deep);
}

.option-label.selected .option-dot::after {
  content: "";
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: #fff;
}

.option-icon {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(98, 133, 107, 0.12);
  color: var(--brand-sage);
  font-size: 0.95rem;
  font-weight: 950;
}

.option-label.selected .option-icon {
  background: rgba(91, 140, 97, 0.18);
  color: var(--shade-deep);
}

.option-label:focus-within {
  box-shadow: inset 0 0 0 2px var(--brand-sage);
  border-color: var(--brand-sage);
}

.error-msg {
  margin-top: 20px;
  color: var(--alert);
  font-size: 0.95rem;
  font-weight: 800;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 32px;
  flex-wrap: wrap;
}

@media (max-width: 680px) {
  .progress-step {
    flex-basis: auto;
    min-height: 54px;
    padding: 12px 14px;
    font-size: 0.92rem;
  }

  .section-header {
    padding: 24px 20px;
  }

  .section-body {
    padding: 24px 20px;
  }

  .option-label {
    align-items: flex-start;
    padding: 15px 16px;
  }

  .question-title-row {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .question-icon {
    width: 38px;
    height: 38px;
    font-size: 1.25rem;
  }

  .btn-row {
    flex-direction: column-reverse;
  }
}
</style>
