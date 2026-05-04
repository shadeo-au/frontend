<script setup lang="ts">
import ClayCard from '@/components/ClayCard.vue';
import LevelBar from './LevelBar.vue';
import type { AreaProfile, SuburbIndexEntry } from '@/lib/selfcheck/types';

defineProps<{
  area: AreaProfile | null;
  suburb: SuburbIndexEntry | null;
}>();
</script>

<template>
  <div v-if="area" class="area-grid">
    <ClayCard tone="sage" radius="xl">
      <div class="card-row">
        <div class="card-row__head">
          <small>Vegetation &amp; Greenspace</small>
          <LevelBar :level="area.tree_canopy_level" invert />
        </div>
        <p>
          About <strong>{{ area.tree_canopy_pct }}%</strong> of {{ area.area_name }} has tree cover.
          Fewer trees often means less natural cooling and shade on hot days.
        </p>
      </div>
    </ClayCard>

    <ClayCard tone="peach" radius="xl">
      <div class="card-row">
        <div class="card-row__head">
          <small>Surface heat</small>
          <LevelBar :level="area.surface_heat_level" />
        </div>
        <p>
          Roads, roofs, and concrete absorb the day's heat and release it slowly into the
          evening. Higher levels mean the area cools down later.
        </p>
      </div>
    </ClayCard>

    <ClayCard tone="sky" radius="xl">
      <div class="card-row">
        <div class="card-row__head">
          <small>Cool place access</small>
          <LevelBar :level="area.cool_place_access" invert />
        </div>
        <p>
          About <strong>{{ area.cool_place_count_within_1km }}</strong> libraries, community centres,
          or shopping centres within a 1 km walk. These are free places you can drop into on hot days.
        </p>
      </div>
    </ClayCard>

    <ClayCard tone="sun" radius="xl">
      <div class="card-row">
        <div class="card-row__head">
          <small>Older residents nearby</small>
          <LevelBar :level="area.older_population_level" />
        </div>
        <p>
          About <strong>{{ area.older_population_pct }}%</strong> of residents are 65+. On hot days,
          neighbours may benefit from your check-ins, and you from theirs.
        </p>
      </div>
    </ClayCard>
  </div>

  <ClayCard v-else tone="cream" radius="xl">
    <div class="empty">
      <strong>Local heat profile not yet available for this suburb.</strong>
      <p v-if="suburb">
        We're rolling out detailed area data across Greater Melbourne. {{ suburb.name }} isn't
        in our first batch yet. You can still complete the self-check below.
      </p>
      <p v-else>
        Choose a suburb above to see your area's heat profile.
      </p>
    </div>
  </ClayCard>
</template>

<style scoped>
.area-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}
.card-row__head small {
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-ink-soft);
}
.card-row p {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.5;
}
.card-row strong {
  color: var(--brand-ink-soft);
  font-weight: 900;
}

.empty {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.empty strong {
  color: var(--brand-ink-soft);
  font-size: 1.2rem;
  font-weight: 900;
}
.empty p {
  color: var(--brand-ink-muted);
  font-size: 1.0625rem;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .area-grid { grid-template-columns: 1fr; }
}
</style>
