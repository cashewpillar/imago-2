<script setup>
import { onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { useTheme } from './shared/composables/useTheme';
import ToastMessage from './shared/components/ToastMessage.vue';

const { initTheme, toggleTheme, isLight } = useTheme();
const toastState = ref({ open: false, message: '', type: 'success' });
let toastTimer;

function showToast(message, type = 'success') {
  toastState.value = { open: true, message, type };
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastState.value = { ...toastState.value, open: false };
  }, 2400);
}

provide('appShell', {
  toggleTheme,
  isLight,
  showToast,
});

onMounted(() => {
  initTheme();
});

onBeforeUnmount(() => {
  clearTimeout(toastTimer);
});
</script>

<template>
  <RouterView />
  <ToastMessage :open="toastState.open" :message="toastState.message" :type="toastState.type" />
</template>
