<template>
  <div class="preview-section">
    <h3>{{ t('importTransactions.previewTransactions') }}</h3>
    <p>
      <strong>{{ importStore.parsedTransactions.length }}</strong> {{ t('importTransactions.transactionsReady') }}
    </p>

    <TransactionPreviewTable
      :transactions="importStore.parsedTransactions"
      :categories="categoryStore.categories"
    />

    <ParseErrorMessage :errorCount="importStore.parseErrors" />

    <div class="button-group">
      <Button
        :label="$t('importTransactions.back')"
        icon="pi pi-arrow-left"
        @click="importStore.goToStep(2)"
        severity="secondary"
      />
      <Button
        :label="$t('importTransactions.startImport')"
        icon="pi pi-upload"
        @click="handleStartImport"
        :loading="importStore.importing"
        :disabled="importStore.parsedTransactions.length === 0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useImportStore } from '@/stores/import';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import TransactionPreviewTable from './TransactionPreviewTable.vue';
import ParseErrorMessage from './ParseErrorMessage.vue';

const { t } = useI18n();
const toast = useToast();
const importStore = useImportStore();
const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const props = defineProps<{
  accountId: string;
}>();

const handleStartImport = async () => {
  if (!authStore.currentUser) return;

  try {
    await importStore.startImport(authStore.currentUser.uid, props.accountId, transactionStore.importTransactions);
  } catch (error) {
    console.error('Error importing transactions:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('importTransactions.importError'),
      life: 5000,
    });
  }
};
</script>

<style scoped>
.preview-section {
  margin-top: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
