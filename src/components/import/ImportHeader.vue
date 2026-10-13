<template>
  <div class="flex justify-between">
    <h2>{{ t('importTransactions.title') }}</h2>
    <div
      v-if="account"
      class="account-badge"
    >
      <i class="pi pi-wallet"></i>
      <span
        >{{ t('importTransactions.account') }}: <strong>{{ account.name }}</strong></span
      >
    </div>
  </div>

  <Message
    severity="warn"
    class="mb-2"
  >
    <i class="pi pi-exclamation-triangle"></i>
    {{ t('importTransactions.warningPaidOnly') }}
  </Message>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Account } from '@/types';

const { t } = useI18n();

defineProps<{
  account?: Account;
}>();
</script>

<style scoped>
.account-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.account-badge i {
  color: #6366f1;
  font-size: 1.1rem;
}
</style>
