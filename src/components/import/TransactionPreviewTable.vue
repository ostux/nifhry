<template>
  <DataTable
    :value="transactions"
    class="p-datatable-sm"
    :paginator="true"
    :rows="10"
    :rowsPerPageOptions="[10, 25, 50, 100]"
    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
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
    <Column :header="$t('importTransactions.category')">
      <template #body="slotProps">
        <div class="align-items-center flex gap-2">
          <Dropdown
            v-model="slotProps.data.categoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="$t('importTransactions.selectCategory')"
            class="w-full"
            showClear
          />
          <i
            v-if="slotProps.data.autoSuggestedCategory"
            class="pi pi-sparkles"
            style="color: #6366f1; font-size: 1rem"
            v-tooltip.top="$t('importTransactions.autoSuggested')"
          ></i>
        </div>
      </template>
    </Column>
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
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import type { ParsedTransaction } from '@/stores/import';
import type { Category } from '@/types';

const { t } = useI18n();

const props = defineProps<{
  transactions: ParsedTransaction[];
  categories: Category[];
}>();

const categoryOptions = computed(() => [
  { label: t('importTransactions.noCategory'), value: null },
  ...props.categories.map((c) => ({
    label: c.name,
    value: c.id,
  })),
]);

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
</script>
