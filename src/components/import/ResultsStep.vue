<template>
  <div class="results-section">
    <h3>{{ t('importTransactions.importComplete') }}</h3>

    <ImportSuccessMessage :importedCount="importStore.importResults.imported" />

    <LinkedOppositesMessage :linkedCount="importStore.importResults.linkedOpposites" />

    <DuplicatesTable
      :duplicates="importStore.duplicateTransactions"
      :forceImportingId="importStore.forceImporting"
      @forceImport="handleForceImport"
    />

    <div class="button-group">
      <Button
        :label="$t('importTransactions.importMore')"
        icon="pi pi-upload"
        @click="importStore.resetImport"
      />
      <Button
        :label="$t('importTransactions.done')"
        icon="pi pi-check"
        @click="$emit('done')"
        severity="success"
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
import ImportSuccessMessage from './ImportSuccessMessage.vue';
import LinkedOppositesMessage from './LinkedOppositesMessage.vue';
import DuplicatesTable from './DuplicatesTable.vue';
import type { ParsedTransaction } from '@/stores/import';

const { t } = useI18n();
const toast = useToast();
const importStore = useImportStore();
const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const props = defineProps<{
  accountId: string;
}>();

defineEmits<{
  done: [];
}>();

const handleForceImport = async (transaction: ParsedTransaction) => {
  if (!authStore.currentUser) return;

  try {
    await importStore.forceImportTransaction(
      authStore.currentUser.uid,
      props.accountId,
      transaction,
      categoryStore.categories,
      transactionStore.forceImportTransaction,
    );
  } catch (error) {
    console.error('Error force importing transaction:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('importTransactions.forceImportError'),
      life: 5000,
    });
  }
};
</script>

<style scoped>
.results-section {
  margin-top: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
