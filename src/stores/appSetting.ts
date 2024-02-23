import { ref, type Ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppSettingStore = defineStore('appSetting', () => {
  const theme: Ref<string> = ref(localStorage.getItem('theme') || 'dark');

  function setTheme(t: string) {
    theme.value = t;
    localStorage.setItem('theme', t);
  }

  return { theme, setTheme };
});
