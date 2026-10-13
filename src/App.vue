<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <Toast />
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useCategoryStore } from '@/stores/category';
import { onBeforeUnmount } from 'vue';
import AppLayout from './components/common/AppLayout.vue';

const accountStore = useAccountStore();
const categoryStore = useCategoryStore();

// Cleanup on component unmount
onBeforeUnmount(() => {
  accountStore.cleanupListener();
  categoryStore.cleanupListener();
});
</script>
