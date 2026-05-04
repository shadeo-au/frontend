<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import PasswordGate from '../components/PasswordGate.vue';

const SESSION_KEY = 'shadeo_gate_unlocked_v1';
const unlocked = ref(readSessionFlag());

function readSessionFlag(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function onUnlock() {
  unlocked.value = true;
}
</script>

<template>
  <RouterView v-if="unlocked" />
  <PasswordGate v-else @unlock="onUnlock" />
</template>
