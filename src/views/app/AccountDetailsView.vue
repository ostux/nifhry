<template>
  <div class="container mx-auto p-4">
    <!-- Account Header -->
    <div
      v-if="currentAccount"
      class="mb-6"
    >
      <div class="flex flex-row justify-between">
        <div class="flex flex-col">
          <span>
            <i class="pi pi-credit-card"></i>
            {{ currentAccount.name }}
          </span>
          <rovas-component
            class="ml-4 text-2xl"
            :msg="currentAccount.name"
          />
        </div>

        <Tag
          v-if="currentAccount.status !== 'active'"
          :value="$t(`accounts.statuses.${currentAccount.status}`)"
          severity="warn"
        />

        <div class="ml-14 flex items-center gap-4">
          <div>
            <span class="text-sm text-gray-600">{{ $t('accounts.balance') }}&nbsp;</span>
            <Tag
              :value="$t(`accounts.kinds.${currentAccount.kind}`)"
              severity="secondary"
            />
            <p class="text-xl font-bold">{{ formatCurrency(currentAccount.bal, currentAccount.cur) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <!-- Account Not Found -->
    <div
      v-else-if="!currentAccount"
      class="flex flex-col items-center justify-center py-12"
    >
      <i class="pi pi-exclamation-triangle mb-4 text-6xl text-gray-400"></i>
      <p class="text-xl text-gray-600">{{ $t('accounts.notFound') }}</p>
      <Button
        :label="$t('accounts.backToAccounts')"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="$router.push({ name: 'accounts' })"
      />
    </div>

    <!-- Transactions Section -->
    <div v-else>
      <TransactionsTable
        :account-id="accountId"
        show-title
        show-batch-edit
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TransactionsTable from '@/components/transaction/TransactionsTable.vue';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useTransactionStore } from '@/stores/transaction';
import type { Account } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const authStore = useAuthStore();

const loading = ref(true);

// Get account ID from route
const accountId = computed(() => route.params.id as string);

// Get current account
const currentAccount = computed<Account | undefined>(() => {
  return accountStore.accounts.find((a) => a.id === accountId.value);
});

// Load data when component mounts or account ID changes
const loadData = async () => {
  if (!authStore.currentUser) return;

  loading.value = true;
  try {
    // Reset transaction pagination for the new account
    transactionStore.resetPagination();

    // Check if account exists
    if (!currentAccount.value) {
      console.warn('Account not found:', accountId.value);
    }
  } catch (error) {
    console.error('Error loading account data:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('transactions.errors.loadFailed'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadData();
});

// Watch for account ID changes
watch(accountId, async () => {
  await loadData();
});
</script>
