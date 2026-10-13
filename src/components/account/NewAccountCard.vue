<template>
  <Card
    style="width: 25rem; overflow: hidden"
    :pt="passThrough"
    @click="openCreateDialog"
  >
    <template #header>
      <div class="flex flex-col px-2 pt-2">
        <span><i class="pi pi-plus"></i> {{ $t('accounts.createAccount') }}</span>
        <rovas-component
          class="ml-4 text-2xl"
          :msg="$t('accounts.createAccount')"
        />
      </div>
    </template>
    <template #content>
      <div class="mt-4 flex grow justify-center font-mono text-4xl text-gray-700 dark:text-white"></div>
    </template>
  </Card>
  <AccountFormDialog v-model:visible="createDialogVisible" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AccountFormDialog from '@/components/account/AccountFormDialog.vue';

const createDialogVisible = ref(false);

const passThrough = computed(() => {
  return {
    body: '!p-0',
    root: 'border-2 border-teal-500 !bg-teal-600/20 hover:!bg-teal-600/10',
  };
});

const openCreateDialog = () => {
  createDialogVisible.value = true;
};
</script>
