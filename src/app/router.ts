import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../pages/HomePage.vue'),
  },
  {
    path: '/why',
    component: () => import('../pages/WhyPage.vue'),
  },
  {
    path: '/awareness',
    component: () => import('../pages/AwarenessPage.vue'),
  },
  {
    path: '/walk-planner',
    component: () => import('../pages/WalkPlannerPage.vue'),
  },
  {
    path: '/cool-routes',
    redirect: '/walk-planner',
  },
  {
    path: '/planner',
    redirect: '/walk-planner',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
