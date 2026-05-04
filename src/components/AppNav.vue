<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from './AppButton.vue';

const route = useRoute();
const scrolled = ref(false);
const open = ref(false);

const onScroll = () => {
  scrolled.value = window.scrollY > 18;
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

const links = [
  { label: 'Home', href: '/#hero', path: '/', hash: '#hero' },
  { label: 'Why', href: '/why', path: '/why' },
  { label: 'Walk Planner', href: '/walk-planner', path: '/walk-planner' },
  { label: 'Awareness Map', href: '/awareness', path: '/awareness' },
  { label: 'Self-Check', href: '/#self-check', path: '/', hash: '#self-check' },
];

const closeMenu = () => {
  open.value = false;
};

const isActive = (link: { path: string; hash?: string }) => {
  if (route.path !== link.path) return false;
  if (link.path === '/why' || link.path === '/awareness' || link.path === '/walk-planner') return true;
  if (!link.hash) return route.hash === '';
  return route.hash === link.hash || (link.hash === '#hero' && route.hash === '');
};
</script>

<template>
  <header :class="['nav', { 'nav--scrolled': scrolled }]">
    <div class="nav__inner">
      <a href="/#hero" class="brand" aria-label="Shadeo home" @click="closeMenu">Shadeo</a>

      <nav class="nav__links" aria-label="Primary">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          :class="['nav__link', { 'is-active': isActive(link) }]"
        >
          {{ link.label }}
        </a>
      </nav>

      <button
        class="nav__burger"
        :aria-expanded="open"
        aria-label="Open menu"
        @click="open = !open"
      >
        <span />
        <span />
        <span />
      </button>
    </div>

    <div :class="['nav__sheet', { 'is-open': open }]">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        :class="['nav__sheet-link', { 'is-active': isActive(link) }]"
        @click="closeMenu"
      >
        {{ link.label }}
      </a>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  inset: 24px 0 auto;
  z-index: var(--z-nav);
  pointer-events: none;
}

.nav__inner {
  width: min(100% - var(--gutter) * 2, 1120px);
  min-height: 68px;
  margin-inline: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(18px, 3vw, 32px);
  padding: 10px 16px 10px 28px;
  border-radius: 20px;
  background: rgba(252, 247, 235, 0.88);
  border: 1px solid var(--brand-line);
  box-shadow: var(--brand-shadow-nav);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  pointer-events: auto;
  transition:
    transform var(--d-base) var(--ease-out-expo),
    background-color var(--d-base) var(--ease-out-expo);
}

.nav--scrolled .nav__inner {
  transform: translateY(-6px);
  background: rgba(252, 247, 235, 0.96);
}

.brand {
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0;
}

.nav__links {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav__link {
  min-height: var(--brand-touch);
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: var(--r-pill);
  color: var(--brand-ink-muted);
  font-weight: 700;
  font-size: 1rem;
  transition:
    color var(--d-fast) ease,
    background-color var(--d-fast) ease;
}

.nav__link:hover,
.nav__link.is-active {
  color: #23342a;
  background: rgba(155, 224, 111, 0.24);
}

.nav__cta {
  justify-self: end;
}

.nav :deep(.btn) {
  --btn-bg: #9be06f;
  --btn-fg: #142016;
  --btn-border: transparent;
  box-shadow: none;
}

.nav :deep(.btn:hover) {
  --btn-bg: var(--brand-lime-hover);
}

.nav__burger {
  display: none;
  width: var(--brand-touch);
  height: var(--brand-touch);
  border-radius: 15px;
  background: rgba(155, 224, 111, 0.25);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
}

.nav__burger span {
  width: 18px;
  height: 2px;
  border-radius: 3px;
  background: var(--brand-ink-soft);
}

.nav__sheet {
  position: fixed;
  inset: 110px var(--gutter) auto;
  display: none;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(252, 247, 235, 0.96);
  border: 1px solid var(--brand-line);
  box-shadow: 0 24px 60px -36px rgba(35, 45, 39, 0.38);
  pointer-events: none;
  opacity: 0;
  transform: translateY(-8px);
  transition:
    opacity var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.nav__sheet.is-open {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.nav__sheet-link {
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 13px 16px;
  border-radius: 16px;
  color: var(--brand-ink-muted);
  font-size: 1.125rem;
  font-weight: 800;
}

.nav__sheet-link:hover {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.22);
}

.nav__sheet-link.is-active {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.24);
}

@media (max-width: 980px) {
  .nav__links,
  .nav__cta {
    display: none;
  }

  .nav__inner {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  .nav__burger,
  .nav__sheet {
    display: flex;
  }
}

@media (max-width: 640px) {
  .nav {
    inset-block-start: 14px;
  }

  .nav__inner {
    min-height: 64px;
    padding: 8px 12px 8px 18px;
    border-radius: 18px;
  }

  .brand {
    font-size: 1.25rem;
  }

  .nav__sheet {
    inset-block-start: 88px;
  }
}
</style>
