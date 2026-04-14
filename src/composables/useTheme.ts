import { ref } from "vue";

const activeTheme = ref(localStorage.getItem('app-theme') || 'theme-default');

export function useTheme() {


  function setTheme(theme: string) {
    activeTheme.value = theme;
    localStorage.setItem('app-theme', theme);
  }

  return {
    activeTheme,
    setTheme
  }
}
