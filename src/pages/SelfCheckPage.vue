<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import AppNav from '@/components/AppNav.vue';
import AppButton from '@/components/AppButton.vue';
import SectionKicker from '@/components/SectionKicker.vue';
import Wizard from '@/components/selfcheck/Wizard.vue';
import ResultDashboard from '@/components/selfcheck/ResultDashboard.vue';

import {
  findSuburbByKey,
  getAreaProfile,
  listSuburbs,
} from '@/lib/selfcheck/area-profiles';
import { calculateScores, emptyAnswers } from '@/lib/selfcheck/scoring';
import type {
  SelfCheckAnswers,
  SuburbIndexEntry,
} from '@/lib/selfcheck/types';

const DEFAULT_KEY = 'carlton-vic-3053';

const suburb = ref<SuburbIndexEntry | null>(findSuburbByKey(DEFAULT_KEY) ?? listSuburbs()[0] ?? null);
const area = computed(() => (suburb.value ? getAreaProfile(suburb.value.key) : null));
const snapshot = null;

const answers = reactive<SelfCheckAnswers>(emptyAnswers());
const hasResult = ref(false);

const result = computed(() => calculateScores(area.value, answers));

const wizardRef = ref<HTMLElement | null>(null);
const resultRef = ref<HTMLElement | null>(null);

function onAnswersChange(next: SelfCheckAnswers) {
  Object.assign(answers, next);
}

async function onSubmit() {
  hasResult.value = true;
  await nextTick();
  resultRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onRestart() {
  Object.assign(answers, emptyAnswers());
  hasResult.value = false;
  nextTick(() => wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function onBackToWizard() {
  hasResult.value = false;
  nextTick(() => wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function scrollToWizard() {
  wizardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div class="sc">
    <AppNav />

    <main>
      <section class="sc-hero" aria-labelledby="self-check-title">
        <div class="sc-hero__image" aria-hidden="true"></div>
        <div class="sc-hero__content">
          <h1 id="self-check-title">
            Build your
            <span>heat plan</span>
            before the day gets hard
          </h1>
          <p>
            Answer a few simple questions about your health, home, and support nearby.
            Shadeo turns local heat risk into practical steps for today.
          </p>
          <AppButton variant="feature" @click="scrollToWizard">Start self-check</AppButton>
        </div>
      </section>

      <!-- Section 1 Self-Check Wizard -->
      <section
        v-show="!hasResult"
        id="wizard"
        ref="wizardRef"
        class="sc-section sc-section--wizard"
      >
        <div class="sc-section__inner sc-section__inner--narrow">
          <header class="sc-head sc-head--center">
            <SectionKicker>3-minute self-check</SectionKicker>
            <h2>Tell us a little about you</h2>
            <p>
              Four short steps about your health, home, and the people around you.
              Your answers turn local heat risk into clear, personal next steps,
              not generic heat advice.
            </p>
          </header>
          <Wizard
            :area="area"
            :suburb="suburb"
            :answers="answers"
            @update:answers="onAnswersChange"
            @submit="onSubmit"
          />
        </div>
      </section>

      <!-- Section 2 Result -->
      <section
        v-if="hasResult"
        id="result"
        ref="resultRef"
        class="sc-section sc-section--result"
      >
        <div class="sc-section__inner sc-section__inner--narrow">
          <ResultDashboard
            :result="result"
            :area="area"
            :suburb="suburb"
            :snapshot="snapshot"
            :answers="answers"
            @back="onBackToWizard"
            @restart="onRestart"
          />
        </div>
      </section>

      <!-- Footer -->
      <footer class="sc-footer">
        <div class="sc-section__inner">
          <p class="sc-footer__safety">
            <strong>Safety:</strong> This tool does not replace medical advice. If you feel dizzy,
            confused, weak, very thirsty, or unwell during hot weather, seek medical help. In an
            emergency, call <strong>000</strong>.
          </p>
          <p class="sc-footer__privacy">
            Your answers stay on this device only and are cleared when you close this page.
            You do not need to create an account.
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.sc {
  min-height: 100vh;
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 22% -8%, rgba(155, 224, 111, 0.14), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.sc-section {
  position: relative;
  isolation: isolate;
  padding: clamp(64px, 9vw, 120px) 0;
}

.sc-hero {
  position: relative;
  min-height: min(760px, 92vh);
  padding: calc(var(--nav-h) + clamp(68px, 9vw, 120px)) var(--gutter) clamp(64px, 8vw, 110px);
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #fbf7ed;
  isolation: isolate;
}

.sc-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(251, 247, 237, 0.98) 0%, rgba(251, 247, 237, 0.86) 34%, rgba(251, 247, 237, 0.24) 56%, rgba(251, 247, 237, 0) 76%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(247, 242, 232, 0.28));
}

.sc-hero__image {
  position: absolute;
  inset: 0 -7vw 0 0;
  z-index: -2;
  background-image: url('/self-check-hero.png');
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  filter: saturate(1.18) contrast(1.06);
  transform: translateX(4vw);
  will-change: transform, opacity;
  animation: sc-hero-image-in 1.2s cubic-bezier(0.16, 0.84, 0.44, 1) 0.08s both;
}

.sc-hero__content {
  width: min(100%, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 30px;
  will-change: transform, opacity;
  animation: sc-hero-copy-in 0.88s cubic-bezier(0.16, 0.84, 0.44, 1) 0.32s both;
}

.sc-hero h1 {
  max-width: 12.5ch;
  color: var(--brand-ink);
  font-family: var(--font-editorial);
  font-size: clamp(3.15rem, 5.2vw, 5.85rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: balance;
  animation: sc-hero-item-in 0.76s cubic-bezier(0.16, 0.84, 0.44, 1) 0.42s both;
}

.sc-hero h1 span {
  display: inline-block;
  margin-inline: 0.04em;
  color: var(--shade-deep);
  font-family: var(--font-script);
  font-size: 1.16em;
  font-weight: 700;
  line-height: 0.8;
  transform: rotate(-1.5deg);
  transform-origin: left center;
}

.sc-hero p {
  max-width: 42ch;
  color: var(--brand-ink-muted);
  font-size: clamp(1.08rem, 1.16vw, 1.22rem);
  font-weight: 500;
  line-height: 1.72;
  animation: sc-hero-item-in 0.76s cubic-bezier(0.16, 0.84, 0.44, 1) 0.54s both;
}

.sc-hero :deep(.btn) {
  animation: sc-hero-item-in 0.76s cubic-bezier(0.16, 0.84, 0.44, 1) 0.66s both;
}

@keyframes sc-hero-image-in {
  from {
    opacity: 0;
    transform: translateX(9vw) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateX(4vw) scale(1);
  }
}

@keyframes sc-hero-copy-in {
  from {
    opacity: 0;
    transform: translateX(-36px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sc-hero-item-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sc-section--wizard {
  background:
    radial-gradient(circle at 80% 80%, rgba(155, 224, 111, 0.16), transparent 40%),
    linear-gradient(180deg, var(--brand-paper-white), #f7f2e8);
}

.sc-section--result {
  background:
    radial-gradient(circle at 20% 10%, rgba(244, 183, 158, 0.18), transparent 35%),
    linear-gradient(180deg, #f7f2e8, var(--brand-paper-white));
}

.sc-section__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(28px, 4vw, 50px);
}

.sc-section__inner--narrow {
  max-width: 880px;
  align-items: stretch;
}

.sc-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 760px;
}
.sc-head--center {
  align-items: center;
  text-align: center;
  margin-inline: auto;
}
.sc-head h2 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2rem, 3.6vw, 2.95rem);
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: 0;
  text-wrap: balance;
}

.sc-head p {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: 1.55;
  max-width: 60ch;
}
.sc-head--center p { margin-inline: auto; }

.sc-footer {
  background: var(--brand-ink-soft);
  color: var(--brand-paper);
  padding: clamp(40px, 6vw, 72px) 0;
}
.sc-footer .sc-section__inner {
  gap: 14px;
}
.sc-footer p {
  color: rgba(248, 241, 227, 0.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
  max-width: 88ch;
}
.sc-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}
.sc-footer__safety {
  padding: 18px 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.18);
}
@media (max-width: 780px) {
  .sc-hero {
    min-height: 720px;
    padding-top: calc(var(--nav-h) + 56px);
    align-items: flex-start;
  }

  .sc-hero::before {
    background:
      linear-gradient(180deg, rgba(251, 247, 237, 0.98) 0%, rgba(251, 247, 237, 0.9) 34%, rgba(251, 247, 237, 0.14) 74%, rgba(251, 247, 237, 0) 100%);
  }

  .sc-hero__image {
    inset: 0;
    background-size: auto 72%;
    background-position: center bottom;
    transform: none;
  }

  .sc-hero h1 {
    max-width: 10.5ch;
    font-size: clamp(2.85rem, 11vw, 5.25rem);
  }

  .sc-hero p {
    max-width: 34ch;
  }
}

@media (max-width: 780px) {
  @keyframes sc-hero-image-in {
    from {
      opacity: 0;
      transform: translateY(30px) scale(1.02);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .sc-hero__image,
  .sc-hero__content,
  .sc-hero h1,
  .sc-hero p,
  .sc-hero :deep(.btn) {
    animation: none;
  }
}

</style>

