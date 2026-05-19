<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useRoute } from 'vue-router';

type NavLink = {
  kind: 'link';
  label: string;
  href: string;
  path: string;
  hash?: string;
};
type NavGroup = {
  kind: 'group';
  label: string;
  href: string;
  matchPaths: string[];
  children: NavLink[];
};
type NavItem = NavLink | NavGroup;

const route = useRoute();
const scrolled = ref(false);
const open = ref(false);
const hoveredHref = ref<string | null>(null);
const linkRefs = ref<Record<string, HTMLElement | null>>({});
const activeStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 });
const hoverStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 });
const openGroup = ref<string | null>(null);

const items: NavItem[] = [
  { kind: 'link', label: 'Why', href: '/why', path: '/why' },
  { kind: 'link', label: 'Walk Planner', href: '/walk-planner', path: '/walk-planner' },
  { kind: 'link', label: 'Awareness Map', href: '/awareness', path: '/awareness' },
  {
    kind: 'group',
    label: 'Heat Check',
    href: '/self-check',
    matchPaths: ['/self-check', '/medicine-check'],
    children: [
      { kind: 'link', label: 'Heat Check', href: '/self-check', path: '/self-check' },
      { kind: 'link', label: 'Medicine Check', href: '/medicine-check', path: '/medicine-check' },
    ],
  },
];

const flatMobileLinks: NavLink[] = items.flatMap((item) =>
  item.kind === 'link' ? [item] : item.children,
);

const onScroll = () => {
  scrolled.value = window.scrollY > 18;
};

const closeMenu = () => {
  open.value = false;
};

const isItemActive = (item: NavItem) => {
  if (item.kind === 'link') return route.path === item.path;
  return item.matchPaths.includes(route.path);
};

const activeItem = computed(() => items.find((item) => isItemActive(item)) ?? null);
const activeKey = computed(() => (activeItem.value ? activeItem.value.href : null));

const setLinkRef = (href: string, el: Element | ComponentPublicInstance | null) => {
  linkRefs.value[href] = el instanceof HTMLElement ? el : null;
};

const setIndicator = (
  href: string | null,
  target: typeof activeStyle.value,
) => {
  if (!href) {
    target.opacity = 0;
    return;
  }
  const linkEl = linkRefs.value[href];
  const navEl = linkEl?.closest('.nav__links');
  if (!linkEl || !navEl) return;
  const linkRect = linkEl.getBoundingClientRect();
  const navRect = navEl.getBoundingClientRect();
  target.width = `${linkRect.width}px`;
  target.transform = `translateX(${linkRect.left - navRect.left}px)`;
  target.opacity = 1;
};

const syncIndicators = async () => {
  await nextTick();
  setIndicator(activeKey.value, activeStyle.value);
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

const onGroupEnter = (href: string) => {
  openGroup.value = href;
  onLinkEnter(href);
};
const onGroupLeave = () => {
  openGroup.value = null;
  onLinkLeave();
};
const toggleGroup = (href: string) => {
  openGroup.value = openGroup.value === href ? null : href;
};
const onGroupKeydown = (ev: KeyboardEvent, href: string) => {
  if (ev.key === 'Escape') {
    openGroup.value = null;
    (ev.currentTarget as HTMLElement).blur();
  } else if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    openGroup.value = href;
  }
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
  openGroup.value = null;
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

        <template v-for="item in items" :key="item.href">
          <!-- simple link -->
          <a
            v-if="item.kind === 'link'"
            :ref="(el) => setLinkRef(item.href, el)"
            :href="item.href"
            :class="['nav__link', { 'is-active': isItemActive(item) }]"
            @mouseenter="onLinkEnter(item.href)"
            @focus="onLinkEnter(item.href)"
            @blur="onLinkLeave"
          >{{ item.label }}</a>

          <!-- group with dropdown -->
          <div
            v-else
            :class="['nav__group', { 'is-open': openGroup === item.href }]"
            @mouseenter="onGroupEnter(item.href)"
            @mouseleave="onGroupLeave"
          >
            <a
              :ref="(el) => setLinkRef(item.href, el)"
              :href="item.href"
              :class="['nav__link', 'nav__link--group', { 'is-active': isItemActive(item) }]"
              :aria-haspopup="'menu'"
              :aria-expanded="openGroup === item.href"
              @focus="onGroupEnter(item.href)"
              @blur="onGroupLeave"
              @keydown="(ev) => onGroupKeydown(ev, item.href)"
              @click="toggleGroup(item.href)"
            >
              {{ item.label }}
              <span class="nav__caret" aria-hidden="true">▾</span>
            </a>
            <div
              v-show="openGroup === item.href"
              class="nav__dropdown"
              role="menu"
              :aria-label="`${item.label} menu`"
            >
              <a
                v-for="child in item.children"
                :key="child.href"
                :href="child.href"
                :class="['nav__dropdown-link', { 'is-active': isItemActive(child) }]"
                role="menuitem"
              >{{ child.label }}</a>
            </div>
          </div>
        </template>
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
        v-for="link in flatMobileLinks"
        :key="link.href"
        :href="link.href"
        :class="['nav__sheet-link', { 'is-active': route.path === link.path }]"
        @click="closeMenu"
      >{{ link.label }}</a>
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
  gap: 4px;
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

.nav__link--group { padding-right: 14px; }
.nav__caret {
  font-size: 0.8rem;
  line-height: 1;
  margin-left: 2px;
  transition: transform var(--d-fast) ease;
  display: inline-block;
}
.nav__group.is-open .nav__caret { transform: rotate(180deg); }

.nav__group {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: stretch;
}
.nav__dropdown {
  position: absolute;
  top: calc(100% - 2px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1.5px solid var(--brand-line);
  border-radius: 16px;
  box-shadow: 0 22px 48px -28px rgba(35, 45, 39, 0.36);
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  z-index: 5;
}
.nav__dropdown::before {
  /* invisible bridge so hover doesn't break */
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 12px;
}
.nav__dropdown-link {
  display: block;
  padding: 12px 16px;
  border-radius: 10px;
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
  transition: background var(--d-fast) ease, color var(--d-fast) ease;
}
.nav__dropdown-link:hover {
  background: var(--brand-lime-soft);
  color: var(--brand-ink);
}
.nav__dropdown-link.is-active {
  background: rgba(155, 224, 111, 0.30);
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
  .nav__links { display: none; }
  .nav__inner {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }
  .nav__burger, .nav__sheet { display: flex; }
}

@media (max-width: 640px) {
  .nav__inner { min-height: 64px; }
  .brand { width: 148px; }
  .nav__sheet { inset-block-start: 74px; }
}
</style>
