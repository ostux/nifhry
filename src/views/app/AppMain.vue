<template>
  <router-view />
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useSettingsStore } from '@/stores/settings';
import { useCurrenciesStore } from '@/stores/currencies';
import { watch } from 'vue';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const currenciesStore = useCurrenciesStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();

// Watch for auth state changes and initialize/cleanup account listener
watch(
  () => authStore.currentUser,
  (currentUser) => {
    if (currentUser) {
      settingsStore.initSettings();
      currenciesStore.initCurrencies();

      // User logged in - initialize accounts listener
      accountStore.initAccountsListener(currentUser.uid);

      // Initialize category listener
      categoryStore.initCategoriesListener(currentUser.uid);
    } else {
      // User logged out - cleanup listener
      settingsStore.cleanupListener();
      currenciesStore.cleanupListener();
      accountStore.cleanupListener();
      categoryStore.cleanupListener();
    }
  },
  { immediate: true },
);
</script>
