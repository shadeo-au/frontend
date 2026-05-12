<script setup lang="ts">
import { ref } from 'vue';
import AppNav from '@/components/AppNav.vue';
import SectionKicker from '@/components/SectionKicker.vue';
import ClayCard from '@/components/ClayCard.vue';
import MedicationPicker from '@/components/medicine/MedicationPicker.vue';
import MedicationRiskPanel from '@/components/medicine/MedicationRiskPanel.vue';
import { DISCLAIMER, SOURCES } from '@/lib/selfcheck/medication-data';

const STORAGE_KEY = 'shadeo:medicine-check:selected';

const selected = ref<string[]>(loadSelected());

function loadSelected(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
  } catch {
    // ignore parse errors
  }
  return [];
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected.value));
  } catch {
    // ignore quota errors
  }
}

function toggle(id: string) {
  const set = new Set(selected.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  selected.value = Array.from(set);
  persist();
}

function clearAll() {
  selected.value = [];
  persist();
}

const sourceList = Object.values(SOURCES);
</script>

<template>
  <div class="mc">
    <AppNav />
    <main>
      <!-- §1 Hero -->
      <section class="mc-section mc-section--hero">
        <div class="mc-section__inner">
          <header class="mc-head">
            <SectionKicker>Medicine Check</SectionKicker>
            <h1>Which of your medicines need extra care on hot days?</h1>
            <p>
              Some medicines can raise the risk of heat-related illness — through dehydration,
              reduced sweating, sedation, or by stressing the heart and kidneys. Tick the
              medicines you take and we will show what published research says, with sources.
            </p>
          </header>
          <ClayCard tone="peach" radius="xl" class="mc-disclaimer">
            <strong>Important.</strong>
            <p>{{ DISCLAIMER }}</p>
          </ClayCard>
        </div>
      </section>

      <!-- §2 Two-column working area -->
      <section class="mc-section mc-section--work">
        <div class="mc-section__inner">
          <div class="mc-grid">
            <ClayCard tone="white" radius="2xl" class="mc-card mc-card--picker">
              <header class="mc-card-head">
                <SectionKicker>Step 1</SectionKicker>
                <h2>Tick the medicines you take</h2>
                <p>Search by name or browse the categories. Your selection stays on this device only.</p>
              </header>
              <MedicationPicker
                :selected-ids="selected"
                @toggle="toggle"
                @clear="clearAll"
              />
            </ClayCard>

            <ClayCard tone="cream" radius="2xl" class="mc-card mc-card--result">
              <header class="mc-card-head">
                <SectionKicker>Step 2</SectionKicker>
                <h2>What this means on hot days</h2>
                <p>
                  Updates as you tick medicines. Every warning lists the published research it is
                  based on — open <strong>"View source"</strong> for full citations.
                </p>
              </header>
              <MedicationRiskPanel :selected-ids="selected" />
            </ClayCard>
          </div>
        </div>
      </section>

      <!-- §3 Sources -->
      <section class="mc-section mc-section--sources">
        <div class="mc-section__inner sc-section__inner--narrow">
          <header class="mc-head">
            <SectionKicker>Evidence base</SectionKicker>
            <h2>Sources we use on this page</h2>
            <p>
              This page lists evidence from peer-reviewed studies and government heat-health
              guidance. The complete framework, including effect sizes and combination rules, is
              documented at <a href="https://github.com/" rel="noopener" target="_blank">docs/MedicationHeatEvidence.md</a> in our repository.
            </p>
          </header>
          <ol class="mc-sources">
            <li v-for="s in sourceList" :key="s.id">
              <strong>{{ s.id }}.</strong>
              <span>{{ s.citation }}</span>
              <a :href="s.url" target="_blank" rel="noopener">Open ↗</a>
            </li>
          </ol>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mc-footer">
        <div class="mc-section__inner">
          <p class="mc-footer__safety">
            <strong>Safety:</strong> If you feel dizzy, confused, weak, very thirsty, or unwell during
            hot weather, seek medical help. In an emergency, call <strong>000</strong>.
          </p>
          <p class="mc-footer__privacy">
            The medicines you tick are stored on this device only. They are not sent anywhere and are
            not linked to you. You can clear them at any time using the "Clear all" button above.
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.mc {
  min-height: 100vh;
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 22% -8%, rgba(155, 224, 111, 0.14), transparent 32%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.mc-section {
  position: relative;
  padding: clamp(48px, 7vw, 96px) 0;
}
.mc-section--hero {
  padding-top: calc(var(--nav-h) + 64px);
  background:
    radial-gradient(circle at 84% 30%, rgba(244, 183, 158, 0.18), transparent 30%),
    var(--brand-paper-white);
}
.mc-section--work {
  background: linear-gradient(180deg, var(--brand-paper-white), #f7f2e8);
}
.mc-section--sources {
  background:
    radial-gradient(circle at 16% 10%, rgba(168, 212, 226, 0.22), transparent 32%),
    linear-gradient(180deg, #f7f2e8, var(--brand-paper-white));
}

.mc-section__inner {
  width: min(100% - var(--gutter) * 2, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(22px, 3vw, 40px);
}
.sc-section__inner--narrow {
  max-width: 880px;
}

.mc-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
}
.mc-head h1 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 950;
  line-height: 1.08;
  text-wrap: balance;
}
.mc-head h2 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.6rem, 2.6vw, 2.1rem);
  font-weight: 950;
  line-height: 1.12;
  text-wrap: balance;
}
.mc-head p {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: 1.55;
}

.mc-disclaimer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mc-disclaimer strong {
  color: #8b3f25;
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 1.05rem;
}
.mc-disclaimer p {
  color: #6f3322;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
}

.mc-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.mc-card { display: flex; flex-direction: column; gap: 18px; }
.mc-card-head { display: flex; flex-direction: column; gap: 8px; }
.mc-card-head h2 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-weight: 950;
  line-height: 1.15;
}
.mc-card-head p {
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}
.mc-card-head strong { color: var(--brand-ink); font-weight: 900; }

.mc-card--result { position: sticky; top: calc(var(--nav-h) + 16px); }

.mc-sources {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mc-sources li {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1.5px solid var(--brand-line);
  color: var(--brand-ink-soft);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.5;
}
.mc-sources strong { color: var(--brand-ink); font-weight: 900; }
.mc-sources a {
  color: var(--shade-deep);
  font-weight: 800;
  white-space: nowrap;
  text-decoration: underline;
}

.mc-footer {
  background: var(--brand-ink-soft);
  color: var(--brand-paper);
  padding: clamp(36px, 5vw, 64px) 0;
}
.mc-footer .mc-section__inner { gap: 12px; }
.mc-footer p {
  color: rgba(248, 241, 227, 0.85);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.6;
  max-width: 88ch;
}
.mc-footer strong {
  color: var(--brand-paper-white);
  font-weight: 900;
}
.mc-footer__safety {
  padding: 16px 22px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(248, 241, 227, 0.18);
}

@media (max-width: 980px) {
  .mc-grid { grid-template-columns: 1fr; }
  .mc-card--result { position: static; }
}
</style>
