<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const sections = [
  { id: 'purpose', label: 'Purpose' },
  { id: 'mission', label: 'Mission' },
  { id: 'approach', label: 'Approach' },
  { id: 'values', label: 'Values' },
  { id: 'story', label: 'Our Story' },
  { id: 'inclusion', label: 'Inclusion' },
  { id: 'explore', label: 'Explore' },
];

const activeId = ref(sections[0].id);
let observer: IntersectionObserver | undefined;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target.id) activeId.value = visible.target.id;
    },
    {
      rootMargin: '-34% 0px -52% 0px',
      threshold: [0.12, 0.24, 0.36, 0.48],
    }
  );

  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) observer?.observe(el);
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <nav class="about-subnav" aria-label="About page sections">
    <a
      v-for="section in sections"
      :key="section.id"
      :href="`#${section.id}`"
      :class="['about-subnav__link', { 'is-active': activeId === section.id }]"
    >
      {{ section.label }}
    </a>
  </nav>
</template>

<style scoped>
.about-subnav {
  position: sticky;
  top: 76px;
  z-index: calc(var(--z-nav) - 1);
  width: 100%;
  min-height: 56px;
  margin: -1px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 3.4vw, 46px);
  padding: 0 max(var(--gutter), calc((100vw - 1180px) / 2));
  border-radius: 0;
  background:
    linear-gradient(90deg, rgba(210, 226, 214, 0.94) 0%, rgba(226, 226, 198, 0.94) 58%, rgba(241, 232, 193, 0.92) 100%),
    #dfe8d9;
  border-block: 1px solid rgba(35, 45, 39, 0.08);
  box-shadow: 0 14px 32px -28px rgba(35, 45, 39, 0.32);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
}

.about-subnav__link {
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border-radius: 0;
  color: #263028;
  font-size: clamp(1rem, 1.05vw, 1.18rem);
  font-weight: 900;
  white-space: nowrap;
  border-bottom: 4px solid transparent;
  transition:
    color var(--d-fast) ease,
    border-color var(--d-fast) ease;
}

.about-subnav__link:hover,
.about-subnav__link.is-active {
  color: #2f6e69;
  border-bottom-color: #2f6e69;
}

@media (max-width: 980px) {
  .about-subnav {
    justify-content: flex-start;
    gap: 28px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .about-subnav::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 640px) {
  .about-subnav {
    top: 70px;
    min-height: 52px;
  }

  .about-subnav__link { min-height: 52px; }
}
</style>
