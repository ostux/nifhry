<template>
  <div class="fixed size-full overflow-auto bg-white text-black dark:bg-gray-900 dark:text-white">
    <navigation-component />
    <main class="flex py-4">
      <RouterView />
    </main>
    <notifications-component />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavigationComponent from './components/NavigationComponent.vue';
import { useAppSettingStore } from '@/stores/appSetting';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { onMounted } from 'vue';
import NotificationsComponent from './components/NotificationsComponent.vue';

const appSettingStore = useAppSettingStore();
const { theme } = storeToRefs(appSettingStore);

onMounted(() => {
  setTheme(theme.value);
});

function setTheme(t: string) {
  if (t === 'light') {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
}

watch(theme, (newTheme) => {
  setTheme(newTheme);
});
</script>

<style scoped></style>
