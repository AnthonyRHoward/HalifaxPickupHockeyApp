import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Theme store - currently light theme only
// Dark theme support can be added later
export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light')

  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  // Placeholder for future dark mode support
  const toggleTheme = () => {
    // Currently disabled - light theme only
    // theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const setTheme = (newTheme) => {
    // Currently disabled - light theme only
    // if (newTheme === 'light' || newTheme === 'dark') {
    //   theme.value = newTheme
    // }
  }

  return {
    theme,
    isDark,
    isLight,
    toggleTheme,
    setTheme
  }
})
