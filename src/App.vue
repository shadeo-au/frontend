<template>
  <div class="app-wrap">
    <AppHeader v-if="!hideChrome" :is-solid="isSolidHeader" />

    <RouterView />

    <AppFooter v-if="!hideChrome" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
const isSolidHeader = ref(false)
const hideChrome = computed(() => route.meta.hideChrome === true)

const onScroll = () => {
  isSolidHeader.value = window.scrollY > 24
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
