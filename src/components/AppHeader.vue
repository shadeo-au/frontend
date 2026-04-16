<template>
  <header class="site-header" :class="{ solid: isSolid }">
    <div class="shell header-inner">
      <a class="brand" href="#/">
        <BrandMark class="brand-mark" />
        <span>GreenPath</span>
      </a>

      <nav class="main-nav" aria-label="Primary">
        <a :class="{ active: currentPath === '/' }" href="#/">Home</a>
        <a :class="{ active: currentPath === '/why-walk' }" href="#/why-walk">Why Walk</a>
        <a :class="{ active: currentPath === '/planner' }" href="#/planner">Plan a Route</a>
      </nav>
    </div>
  </header>
</template>

<script setup>
import BrandMark from './BrandMark.vue'

defineProps({
  currentPath: {
    type: String,
    required: true
  },
  isSolid: {
    type: Boolean,
    default: false
  }
})
</script>
