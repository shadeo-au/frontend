<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useRoute } from 'vue-router';

type NavLink = {
  label: string;
  href: string;
  path: string;
  hash?: string;
};

const route = useRoute();
const scrolled = ref(false);
const open = ref(false);
const hoveredHref = ref<string | null>(null);
const linkRefs = ref<Record<string, HTMLElement | null>>({});
const activeStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 });
const hoverStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 });

const links: NavLink[] = [
  { label: 'Why', href: '/why', path: '/why' },
  { label: 'Walk Planner', href: '/walk-planner', path: '/walk-planner' },
  { label: 'Awareness Map', href: '/awareness', path: '/awareness' },
  { label: 'Self-Check', href: '/self-check', path: '/self-check' },
];

const onScroll = () => {
  scrolled.value = window.scrollY > 18;
};

const closeMenu = () => {
  open.value = false;
};

const isActive = (link: NavLink) => {
  if (route.path !== link.path) return false;
  if (
    link.path === '/why' ||
    link.path === '/awareness' ||
    link.path === '/walk-planner' ||
    link.path === '/self-check'
  ) return true;
  if (!link.hash) return route.hash === '';
  return route.hash === link.hash || (link.hash === '#hero' && route.hash === '');
};

const activeLink = computed(() => links.find((link) => isActive(link)) ?? null);

const setLinkRef = (href: string, el: Element | ComponentPublicInstance | null) => {
  linkRefs.value[href] = el instanceof HTMLElement ? el : null;
};

const setIndicator = (
  href: string | null,
  target: typeof activeStyle.value
) => {
  if (!href) {
    target.opacity = 0;
    return;
  }

  const linkEl = linkRefs.value[href];
  const navEl = linkEl?.parentElement;
  if (!linkEl || !navEl) return;

  const linkRect = linkEl.getBoundingClientRect();
  const navRect = navEl.getBoundingClientRect();
  target.width = `${linkRect.width}px`;
  target.transform = `translateX(${linkRect.left - navRect.left}px)`;
  target.opacity = 1;
};

const syncIndicators = async () => {
  await nextTick();
  setIndicator(activeLink.value?.href ?? null, activeStyle.value);
  setIndicator(hoveredHref.value, hoverStyle.value);
};

const onLinkEnter = (href: string) => {
  hoveredHref.value = href;
  void syncIndicators();
};

const onLinkLeave = () => {
  hoveredHref.value = null;
  hoverStyle.value.opacity = 0;
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncIndicators);
  void syncIndicators();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', syncIndicators);
});

watch(() => [route.path, route.hash], () => {
  closeMenu();
  void syncIndicators();
});
</script>

<template>
  <header :class="['nav', { 'nav--scrolled': scrolled }]">
    <div class="nav__inner">
      <a href="/#hero" class="brand" aria-label="Shadeo home" @click="closeMenu">
        <img src="/logo.png" alt="Shadeo" />
      </a>

      <nav class="nav__links" aria-label="Primary" @mouseleave="onLinkLeave">
        <span class="nav__hover-bg" :style="hoverStyle" aria-hidden="true" />
        <span class="nav__active-line" :style="activeStyle" aria-hidden="true" />
        <span class="nav__hover-line" :style="hoverStyle" aria-hidden="true" />
        <a
          v-for="link in links"
          :key="link.href"
          :ref="(el) => setLinkRef(link.href, el)"
          :href="link.href"
          :class="['nav__link', { 'is-active': isActive(link) }]"
          @mouseenter="onLinkEnter(link.href)"
          @focus="onLinkEnter(link.href)"
          @blur="onLinkLeave"
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
  inset: 0 0 auto;
  z-index: var(--z-nav);
  background: var(--brand-paper-white);
  border-bottom: 1px solid transparent;
  transition:
    background-color var(--d-base) var(--ease-out-expo),
    border-color var(--d-base) var(--ease-out-expo),
    box-shadow var(--d-base) var(--ease-out-expo);
}

.nav--scrolled {
  background: var(--brand-paper-white);
  border-bottom-color: var(--brand-line-soft);
  box-shadow: 0 14px 34px -28px rgba(35, 45, 39, 0.42);
}

.nav__inner {
  width: min(100% - var(--gutter) * 2, 1120px);
  min-height: var(--nav-h);
  margin-inline: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(18px, 3vw, 32px);
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
}

.nav__links {
  position: relative;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav__link {
  position: relative;
  z-index: 1;
  min-height: var(--brand-touch);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  color: rgba(38, 48, 40, 0.78);
  font-size: 0.98rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color var(--d-fast) ease;
}

.nav__link:hover,
.nav__link.is-active {
  color: var(--shade-deep);
}

.nav__hover-bg,
.nav__active-line,
.nav__hover-line {
  position: absolute;
  left: 0;
  pointer-events: none;
  transition:
    transform 260ms var(--ease-out-expo),
    width 260ms var(--ease-out-expo),
    opacity var(--d-fast) ease;
}

.nav__hover-bg {
  inset-block: 8px;
  border-radius: 6px;
  background: rgba(155, 224, 111, 0.06);
}

.nav__active-line,
.nav__hover-line {
  bottom: 7px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand-gold), var(--brand-lime-hover));
}

.nav__hover-line {
  background: linear-gradient(90deg, var(--brand-lime-hover), var(--shade-deep));
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
  inset: calc(var(--nav-h) + 10px) var(--gutter) auto;
  display: none;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(252, 247, 235, 0.98);
  border: 1px solid var(--brand-line);
  box-shadow: 0 18px 42px -34px rgba(35, 45, 39, 0.38);
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
  border-radius: 8px;
  color: var(--brand-ink-muted);
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav__sheet-link:hover {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.18);
}

.nav__sheet-link.is-active {
  color: var(--brand-ink-soft);
  background: rgba(155, 224, 111, 0.24);
}

@media (max-width: 980px) {
  .nav__links {
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
  .nav__inner {
    min-height: 64px;
  }

  .brand {
    width: 148px;
  }

  .nav__sheet {
    inset-block-start: 74px;
  }
}
</style>
