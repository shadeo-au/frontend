<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const scrolled = ref(false);
const open = ref(false);
const aboutOpen = ref(false);
const aboutPinned = ref(false);
const mobileAboutOpen = ref(false);
const aboutRef = ref<HTMLElement | null>(null);
let aboutCloseTimer = 0;

const onScroll = () => {
  scrolled.value = window.scrollY > 18;
};

const clearAboutCloseTimer = () => {
  window.clearTimeout(aboutCloseTimer);
};

const closeAbout = () => {
  clearAboutCloseTimer();
  aboutOpen.value = false;
  aboutPinned.value = false;
};

const onDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null;
  if (target && aboutRef.value?.contains(target)) return;
  closeAbout();
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('pointerdown', onDocumentPointerDown);
});

onBeforeUnmount(() => {
  clearAboutCloseTimer();
  window.removeEventListener('scroll', onScroll);
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});

const aboutLinks = [
  { label: 'About Us', href: '/about-us', path: '/about-us' },
  { label: 'Why This Matters', href: '/why', path: '/why' },
];

const links = [
  { label: 'Awareness Map', href: '/awareness', path: '/awareness' },
  { label: 'Walk Planner', href: '/walk-planner', path: '/walk-planner' },
  { label: 'Self-Check', href: '/self-check', path: '/self-check' },
];

const closeMenu = () => {
  open.value = false;
  mobileAboutOpen.value = false;
};

const openAbout = () => {
  clearAboutCloseTimer();
  aboutOpen.value = true;
};

const scheduleCloseAbout = () => {
  if (aboutPinned.value) return;
  clearAboutCloseTimer();
  aboutCloseTimer = window.setTimeout(() => {
    aboutOpen.value = false;
  }, 240);
};

const toggleAbout = () => {
  clearAboutCloseTimer();
  if (aboutOpen.value && aboutPinned.value) {
    closeAbout();
    return;
  }

  aboutPinned.value = true;
  aboutOpen.value = true;
};

const onAboutFocusout = (event: FocusEvent) => {
  const next = event.relatedTarget as HTMLElement | null;
  if (next && (event.currentTarget as HTMLElement).contains(next)) return;
  scheduleCloseAbout();
};

const onAboutKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAbout();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleAbout();
  }
};

const isActive = (link: { path: string; hash?: string }) => {
  if (route.path !== link.path) return false;
  if (link.path === '/awareness' || link.path === '/walk-planner' || link.path === '/self-check') return true;
  if (!link.hash) return route.hash === '';
  return route.hash === link.hash || (link.hash === '#hero' && route.hash === '');
};

const isAboutActive = () => aboutLinks.some((link) => route.path === link.path);
</script>

<template>
  <header :class="['nav', { 'nav--scrolled': scrolled }]">
    <div class="nav__inner">
      <a href="/#hero" class="brand" aria-label="Shadeo home" @click="closeMenu">
        <img src="/logo.png" alt="Shadeo" />
      </a>

      <nav class="nav__links" aria-label="Primary">
        <div
          ref="aboutRef"
          class="nav__item nav__item--dropdown"
          @pointerenter="openAbout"
          @pointerleave="scheduleCloseAbout"
          @focusout="onAboutFocusout"
        >
          <button
            type="button"
            :class="['nav__link', 'nav__link--button', { 'is-active': isAboutActive(), 'is-open': aboutOpen }]"
            aria-haspopup="true"
            :aria-expanded="aboutOpen"
            aria-controls="about-menu"
            @click="toggleAbout"
            @keydown="onAboutKeydown"
          >
            About
            <span class="nav__chevron" aria-hidden="true" />
          </button>

          <div
            id="about-menu"
            :class="['nav__dropdown', { 'is-open': aboutOpen }]"
            role="menu"
            @pointerenter="openAbout"
            @pointerleave="scheduleCloseAbout"
            @keydown.esc.stop="closeAbout"
          >
            <a
              v-for="link in aboutLinks"
              :key="link.href"
              :href="link.href"
              :class="['nav__dropdown-link', { 'is-active': isActive(link) }]"
              role="menuitem"
              @click="closeAbout"
            >
              {{ link.label }}
            </a>
          </div>
        </div>

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
      <button
        type="button"
        :class="['nav__sheet-link', 'nav__sheet-link--button', { 'is-active': isAboutActive() }]"
        :aria-expanded="mobileAboutOpen"
        aria-controls="mobile-about-menu"
        @click="mobileAboutOpen = !mobileAboutOpen"
      >
        About
        <span class="nav__chevron" aria-hidden="true" />
      </button>
      <div id="mobile-about-menu" :class="['nav__sheet-children', { 'is-open': mobileAboutOpen }]">
        <a
          v-for="link in aboutLinks"
          :key="link.href"
          :href="link.href"
          :class="['nav__sheet-link', 'nav__sheet-link--child', { 'is-active': isActive(link) }]"
          @click="closeMenu"
        >
          {{ link.label }}
        </a>
      </div>

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
  inset: 8px 0 auto;
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
  background: rgba(255, 255, 252, 0.9);
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
  background: rgba(255, 255, 252, 0.96);
}

.brand {
  width: 176px;
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
}

.brand img {
  width: 100%;
  height: 58px;
  display: block;
  object-fit: cover;
  object-position: center;
  filter: brightness(0) saturate(100%);
}

.nav__links {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav__item {
  position: relative;
}

.nav__item--dropdown {
  padding-bottom: 16px;
  margin-bottom: -16px;
}

.nav__link {
  min-height: var(--brand-touch);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: var(--r-pill);
  color: var(--brand-ink-muted);
  font-weight: 700;
  font-size: 1rem;
  transition:
    color var(--d-fast) ease,
    background-color var(--d-fast) ease;
}

.nav__link--button {
  background: transparent;
}

.nav__link:hover,
.nav__link.is-active {
  color: #23342a;
  background: rgba(155, 224, 111, 0.24);
}

.nav__chevron {
  width: 0.65em;
  height: 0.65em;
  flex: 0 0 auto;
  border-right: 0.16em solid currentColor;
  border-bottom: 0.16em solid currentColor;
  border-radius: 0.08em;
  transform: translateY(-0.12em) rotate(45deg);
  transition: transform var(--d-fast) ease;
}

.nav__link.is-open .nav__chevron,
.nav__sheet-link[aria-expanded="true"] .nav__chevron {
  transform: translateY(0.12em) rotate(225deg);
}

.nav__dropdown {
  position: absolute;
  top: calc(100% - 2px);
  left: 0;
  z-index: 2;
  min-width: 210px;
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 252, 0.98);
  border: 1px solid var(--brand-line);
  box-shadow: 0 24px 56px -34px rgba(35, 45, 39, 0.45);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition:
    opacity var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.nav__dropdown.is-open {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.nav__dropdown-link {
  min-height: 46px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 13px;
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 800;
}

.nav__dropdown-link:hover,
.nav__dropdown-link.is-active {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.22);
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
  background: rgba(255, 255, 252, 0.96);
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
  justify-content: space-between;
  padding: 13px 16px;
  border-radius: 16px;
  color: var(--brand-ink-muted);
  font-size: 1.125rem;
  font-weight: 800;
}

.nav__sheet-link--button {
  width: 100%;
  text-align: left;
  background: transparent;
}

.nav__sheet-link:hover {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.22);
}

.nav__sheet-link.is-active {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.24);
}

.nav__sheet-children {
  display: none;
  gap: 8px;
  padding: 0 0 2px 14px;
}

.nav__sheet-children.is-open {
  display: grid;
}

.nav__sheet-link--child {
  min-height: 48px;
  justify-content: flex-start;
  border-radius: 14px;
  font-size: 1.02rem;
  background: rgba(255, 255, 255, 0.42);
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
    inset-block-start: 6px;
  }

  .nav__inner {
    min-height: 64px;
    padding: 8px 12px 8px 18px;
    border-radius: 18px;
  }

  .brand {
    width: 148px;
  }

  .nav__sheet {
    inset-block-start: 88px;
  }
}
</style>
