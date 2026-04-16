<template>
  <header class="site-header" :class="{ solid: isSolid }">
    <div class="shell header-inner">
      <RouterLink class="brand" to="/">
        <BrandMark class="brand-mark" />
        <span>GreenPath</span>
      </RouterLink>

      <nav class="main-nav" aria-label="Primary">
        <RouterLink :class="{ active: route.path === '/' }" to="/">Home</RouterLink>
        <RouterLink :class="{ active: route.path === '/why-walk' }" to="/why-walk">Why Walk</RouterLink>
        <RouterLink :class="{ active: route.path === '/planner' }" to="/planner">Plan a Route</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import BrandMark from './BrandMark.vue'

const route = useRoute()

defineProps({
  isSolid: {
    type: Boolean,
    default: false
  }
})
</script>
