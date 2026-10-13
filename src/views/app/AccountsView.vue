<template>
  <div class="container mx-auto p-4">
    <!-- Header Actions -->
    <div class="mb-6 flex grow flex-row flex-wrap items-center md:flex-nowrap lg:justify-between">
      <div>
        <ToggleButton
          size="small"
          v-model="accountStore.showArchived"
          :onLabel="$t('accounts.hideArchived')"
          :offLabel="$t('accounts.showArchived')"
          class="order-first"
        />
        <Button
          @click="openCreateDialog"
          :label="$t('accounts.createAccount')"
          icon="pi pi-plus"
          size="small"
          outlined
          class="order-last mt-4 ml-4 md:order-2 md:mt-0 md:ml-4"
        />
      </div>
      <span class="self flex-flex-end text-surface-600 dark:text-surface-400 mt-2 text-sm md:order-last lg:mt-0">
        {{ $t('accounts.accountCount', { count: visibleAccounts.length }) }}
      </span>
    </div>

    <!-- Accounts Grid -->
    <div
      v-if="visibleAccounts.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <!-- <NewAccountCard /> -->
      <AccountCard
        v-for="account in visibleAccounts"
        :key="account.id"
        :account="account"
        @edit="openEditDialog"
        :style="{ order: account.order }"
        draggable="true"
        @dragstart="handleDragStart(account, $event)"
        @dragover.prevent="handleDragOver(account, $event)"
        @drop="handleDrop(account, $event)"
        @dragend="handleDragEnd"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="py-12 text-center"
    >
      <i class="pi pi-wallet text-surface-400 mb-4 text-6xl"></i>
      <p class="text-surface-500 text-lg">{{ $t('accounts.noAccounts') }}</p>
      <Button
        @click="openCreateDialog"
        :label="$t('accounts.createAccount')"
        icon="pi pi-plus"
        class="mt-4"
        outlined
      />
    </div>

    <!-- Dialogs -->
    <AccountFormDialog v-model:visible="createDialogVisible" />
    <AccountEditDialog
      v-model:visible="editDialogVisible"
      :account="selectedAccount"
    />
  </div>
</template>

<script setup lang="ts">
import AccountCard from '@/components/account/AccountCard.vue';
import AccountEditDialog from '@/components/account/AccountEditDialog.vue';
import AccountFormDialog from '@/components/account/AccountFormDialog.vue';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import type { Account } from '@/types';
import { computed, ref } from 'vue';

const accountStore = useAccountStore();
const authStore = useAuthStore();

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedAccount = ref<Account | null>(null);
const draggedAccount = ref<Account | null>(null);

const visibleAccounts = computed(() => accountStore.visibleAccounts);

const openCreateDialog = () => {
  createDialogVisible.value = true;
};

const openEditDialog = (account: Account) => {
  selectedAccount.value = account;
  editDialogVisible.value = true;
};

const handleDragStart = (account: Account, event: DragEvent) => {
  draggedAccount.value = account;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragOver = (account: Account, event: DragEvent) => {
  if (!draggedAccount.value || draggedAccount.value.id === account.id) return;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDrop = async (targetAccount: Account, event: DragEvent) => {
  event.preventDefault();

  if (!draggedAccount.value || draggedAccount.value.id === targetAccount.id) return;

  const userId = authStore.currentUser?.uid;
  if (!userId) return;

  // Create a working copy of visible accounts sorted by current order
  const sortedAccounts = [...visibleAccounts.value].sort((a, b) => a.order - b.order);

  // Find indices
  const draggedIndex = sortedAccounts.findIndex(a => a.id === draggedAccount.value!.id);
  const targetIndex = sortedAccounts.findIndex(a => a.id === targetAccount.id);

  if (draggedIndex === -1 || targetIndex === -1) return;

  // Remove dragged account and insert at target position
  const [removed] = sortedAccounts.splice(draggedIndex, 1);
  if (!removed) return;
  sortedAccounts.splice(targetIndex, 0, removed);

  // Create batch update with sequential order numbers
  const updates = sortedAccounts.map((account, index) => ({
    accountId: account.id,
    order: index,
  }));

  await accountStore.reorderAccounts(userId, updates);
};

const handleDragEnd = () => {
  draggedAccount.value = null;
};
</script>

<style scoped>
[draggable='true'] {
  cursor: move;
  transition: opacity 0.2s;
}

[draggable='true']:active {
  opacity: 0.5;
}
</style>
