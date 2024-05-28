<template>
  <div class="fixed size-full overflow-auto bg-gray-100 text-black dark:bg-gray-900 dark:text-white">
    <NavigationComponent />
    <main class="m-auto flex max-w-6xl justify-center py-4">
      <RouterView />
    </main>
    <TransactionEditForm
      v-if="openTransactionEditForm"
      :modal-open="openTransactionEditForm"
      @close="openTransactionEditForm = false"
      :selectedTransaction="selectedTransaction"
    />
    <ScheduledTransactionEditForm
      v-if="openScheduledTransactionEditForm"
      :modal-open="openScheduledTransactionEditForm"
      @close="openScheduledTransactionEditForm = false"
      :selectedTransaction="selectedTransaction"
    />
    <NotificationsComponent />
  </div>
</template>

<script setup lang="ts">
import ScheduledTransactionEditForm from '@/components/transaction/ScheduledTransactionEditForm.vue';
import TransactionEditForm from '@/components/transaction/TransactionEditForm.vue';
import { useTransactions } from '@/composables/useTransactions';
import { useAppSettingStore } from '@/stores/appSetting';
import { storeToRefs } from 'pinia';
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import NavigationComponent from './components/NavigationComponent.vue';
import NotificationsComponent from './components/NotificationsComponent.vue';

const tr = useTransactions();
const { selectedTransaction, openTransactionEditForm, openScheduledTransactionEditForm } = tr;

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
