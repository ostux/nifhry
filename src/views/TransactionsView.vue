<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-0">
    <div class="mb-4 flex justify-between">
      <div class="flex gap-4 p-2">
        <simple-button
          label="transaction.form.add.single.title"
          :icon="Squares2X2Icon"
          :disabled="accounts.size === 0"
          @click="
            selectedTransaction = undefined;
            openTransactionEditForm = true;
          "
        />
        <simple-button
          label="transaction.form.add.single.title"
          :icon="SquaresPlusIcon"
          :disabled="accounts.size === 0"
          @click="
            selectedTransaction = undefined;
            openScheduledTransactionEditForm = true;
          "
        />
      </div>
      <transaction-range-control-tab @change="refetch" />
    </div>

    <pagination-componnt @change="refetch" />

    <table-component
      :columns="columns"
      :rows="rows"
      :loading="loading"
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
        {{ categoryById(row.category)?.name }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <transaction-action-menu
          :row="row"
          @refetch="refetch"
        />
      </template>
    </table-component>
  </div>
</template>

<script setup lang="ts">
import TransactionRangeControlTab from '@/components/transaction/TransactionRangeControlTab.vue';
import PaginationComponnt from '@/components/ui/PaginationComponnt.vue';
import SimpleButton from '@/components/ui/SimpleButton.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { useDataStore } from '@/stores/dataStore';
import { nullUUID, type Z_Transaction, type Z_Transactions } from '@/types';
import { Squares2X2Icon, SquaresPlusIcon } from '@heroicons/vue/24/outline';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { onUnmounted, ref, type Ref } from 'vue';
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;
const { accounts } = storeToRefs(dataStore);

const loading: Ref<boolean> = ref(true);
const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);

const openTransactionEditForm: Ref<boolean> = ref(false);
const openScheduledTransactionEditForm: Ref<boolean> = ref(false);

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
  loading.value = true;

  rows.value = dataStore.fetchTransactions();
};

const unsubscribe = dataStore.$onAction(
  ({
    name, // name of the action
    store, // store instance, same as `someStore`
    args, // array of parameters passed to the action
    after, // hook after the action returns or resolves
    onError // hook if the action throws or rejects
  }) => {
    if (name === 'fetchTransactions') {
      // a shared variable for this specific action call
      const startTime = Date.now();
      // this will trigger before an action on `store` is executed
      console.log(`Start "${name}" with params [${args.join(', ')}] in ${store}.`);

      // this will trigger if the action succeeds and after it has fully run.
      // it waits for any returned promised
      after(() => {
        console.log(`Finished "${name}" after ${Date.now() - startTime}ms.\n`);
        setTimeout(() => {
          loading.value = false;
        }, 300);
      });

      // this will trigger if the action throws or returns a promise that rejects
      onError((error) => {
        console.warn(`Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`);
      });
    }
  }
);

onUnmounted(() => {
  // manually remove the listener
  unsubscribe();
});
</script>
