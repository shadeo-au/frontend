import { createRouter, createWebHistory } from 'vue-router'
import AccessGatePage from '../pages/AccessGatePage.vue'
import HomePage from '../pages/HomePage.vue'
import WhyWalkPage from '../pages/WhyWalkPage.vue'
import PlannerPage from '../pages/PlannerPage.vue'

const DEFAULT_SITE_PASSWORD_HASH = '348a1f0bf99cad5a994150e7ba43d109a1b9a3ee8d442950570519bacfd0f934'
const ACCESS_STORAGE_KEY = 'greenpath-site-access'
const configuredSitePasswordHash = (import.meta.env.VITE_SITE_PASSWORD_HASH || DEFAULT_SITE_PASSWORD_HASH).trim().toLowerCase()

const isRouteUnlocked = () => {
  if (!configuredSitePasswordHash) return true
  return sessionStorage.getItem(ACCESS_STORAGE_KEY) === configuredSitePasswordHash
}

const routes = [
  {
    path: '/unlock',
    name: 'access-gate',
    component: AccessGatePage,
    meta: {
      public: true,
      hideChrome: true,
    },
  },
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/why-walk',
    name: 'why-walk',
    component: WhyWalkPage,
  },
  {
    path: '/planner',
    name: 'planner',
    component: PlannerPage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.public) {
    if (to.name === 'access-gate' && isRouteUnlocked()) {
      const redirectTarget = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      return redirectTarget
    }
    return true
  }

  if (isRouteUnlocked()) return true

  return {
    name: 'access-gate',
    query: { redirect: to.fullPath },
  }
})

export default router