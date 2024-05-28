<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-0">
    <ControlForm v-if="pageMounted" />

    <table-component
      :columns="columns"
      :rows="rows"
    >
      <template #account-data="{ row }">
        {{ accountById(row.account)?.name }}
      </template>

      <template #in-data="{ row }">
        <span
          :class="getAmountColor(row as unknown as Z_Transaction)"
          v-if="row.in !== 0"
        >
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.in))
          }}
        </span>
        <span v-else>&nbsp;</span>
      </template>

      <template #out-data="{ row }">
        <span
          :class="getAmountColor(row as unknown as Z_Transaction)"
          v-if="row.out !== 0"
        >
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.out))
          }}
        </span>
        <span v-else>&nbsp;</span>
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
import { type Z_Transaction, type Z_Transactions } from '@/types';
import { getAmountColor } from '@/utils/helpers';
import moment from 'moment';
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { RouterLink } from 'vue-router';

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;

const pagination = usePagination();

const pageMounted: Ref<boolean> = ref(false);

const columns = [
  // { key: "sId", label: "sId" },
  {
    key: 'desc',
    label: 'Description'
  },
  {
    key: 'account',
    label: 'Account',
    sortable: true
  },
  {
    key: 'in',
    label: 'In',
    sortable: true
  },
  {
    key: 'out',
    label: 'Out',
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

onMounted(() => {
  console.log('%Transactions view mouunted...', 'color:#17A589');
  pagination.reset();
  pagination.setPage(1);
  pagination.setTotalCount(0);
  pagination.setPerPage(50);

  pageMounted.value = true;
});

onUnmounted(() => {
  pagination.reset();
  unsubscribe();
});
</script>
