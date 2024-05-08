<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-0">
    <ControlForm />

    <table-component
      :columns="columns"
      :rows="rows"
    >
      <template #from-data="{ row }">
        {{ accountById(row.from)?.name }}
      </template>

      <template #amount-data="{ row }">
        <span :class="getAmountColor(row as unknown as Z_Transaction)">
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.amount))
          }}
        </span>
      </template>

      <template #to-data="{ row }">
        {{ accountById(row.to)?.name }}
      </template>

      <template #category-data="{ row }">
        <RouterLink :to="`/category/${row.category}`">
          {{ categoryById(row.category)?.name }}
        </RouterLink>
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <transaction-action-menu :row="row" />
      </template>
    </table-component>
  </div>
</template>

<script setup lang="ts">
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';
import ControlForm from '@/components/ui/ControlForm.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { nullUUID, type Z_Transaction, type Z_Transactions } from '@/types';
import moment from 'moment';
import { onUnmounted, ref, watch, type Ref } from 'vue';
import { RouterLink } from 'vue-router';

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;

const pagination = usePagination();

const columns = [
  // { key: "sId", label: "sId" },
  {
    key: 'desc',
    label: 'Description'
  },
  {
    key: 'from',
    label: 'From',
    sortable: true
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true
  },
  {
    key: 'to',
    label: 'To',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'when',
    label: 'When',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'actions'
  }
];

const rows: Ref<Z_Transactions> = ref([]);

const getAmountColor = (row: Z_Transaction) => {
  if (row.from !== nullUUID && row.to !== nullUUID) return 'text-sky-500';

  return row.amount < 0 ? 'text-rose-500' : 'text-pine-green-500';
};

const refetch = () => {
  rows.value = dataStore.fetchTransactions();
};

const unsubscribe = dataStore.$onAction(
  ({
    name, // name of the action
    after // hook after the action returns or resolves
  }) => {
    if (name === 'fetchTransactions') {
      after(() => {
        setTimeout(() => {
          pagination.finishLoading();
        }, 300);
      });
    }
  }
);

watch(
  [pagination.isLoading],
  (loading) => {
    if (loading) refetch();
  },
  { deep: true }
);

onUnmounted(() => {
  pagination.reset();
  unsubscribe();
});
</script>
