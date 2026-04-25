import { computed, ref } from 'vue';
import { THEME_KEY } from '../constants/tableVault';

const theme = ref('light');

export function useTheme() {
  const isLight = computed(() => theme.value === 'light');

  function applyTheme(nextTheme) {
    theme.value = nextTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('light', theme.value === 'light');
    localStorage.setItem(THEME_KEY, theme.value);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme || 'light');
  }

  function toggleTheme() {
    applyTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  return {
    theme,
    isLight,
    initTheme,
    applyTheme,
    toggleTheme,
  };
}
