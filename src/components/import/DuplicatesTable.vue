<template>
  <div
    v-if="duplicates.length > 0"
    class="duplicates-section"
  >
    <Message
      severity="info"
      :closable="false"
    >
      <strong>{{ duplicates.length }}</strong> {{ t('importTransactions.duplicatesSkipped') }}
    </Message>

    <h4>{{ t('importTransactions.skippedTransactions') }}</h4>
    <p>
      {{ t('importTransactions.duplicatesInfo') }}
    </p>

    <DataTable
      :value="duplicates"
      class="p-datatable-sm"
    >
      <Column
        field="date"
        :header="$t('importTransactions.date')"
      >
        <template #body="slotProps">
          {{ formatDate(slotProps.data.date) }}
        </template>
      </Column>
      <Column
        field="description"
        :header="$t('importTransactions.description')"
      />
      <Column
        field="category"
        :header="$t('importTransactions.category')"
      />
      <Column
        field="inAmount"
        :header="$t('importTransactions.in')"
      >
        <template #body="slotProps">
          {{ slotProps.data.inAmount > 0 ? slotProps.data.inAmount.toFixed(2) : '' }}
        </template>
      </Column>
      <Column
        field="outAmount"
        :header="$t('importTransactions.out')"
      >
        <template #body="slotProps">
          {{ slotProps.data.outAmount > 0 ? slotProps.data.outAmount.toFixed(2) : '' }}
        </template>
      </Column>
      <Column :header="$t('importTransactions.action')">
        <template #body="slotProps">
          <Button
            :label="$t('importTransactions.forceImport')"
            icon="pi pi-plus"
            size="small"
            @click="$emit('forceImport', slotProps.data)"
            :loading="forceImportingId === slotProps.data.importId"
            :disabled="forceImportingId !== null"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import type { ParsedTransaction } from '@/stores/import';

const { t } = useI18n();

defineProps<{
  duplicates: ParsedTransaction[];
  forceImportingId: string | null;
}>();

defineEmits<{
  forceImport: [transaction: ParsedTransaction];
}>();

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
</script>

<style scoped>
.duplicates-section {
  margin-top: 2rem;
}

.duplicates-section h4 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>
