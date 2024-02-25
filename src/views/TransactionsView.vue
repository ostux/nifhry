<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-0">
    <div class="">
      <TabGroup
        @change="changeTab"
        :defaultIndex="0"
      >
        <TabList class="flex gap-4 rounded-md p-2 shadow-md">
          <Tab
            v-for="tab in tabs"
            as="template"
            :key="tab.id"
            v-slot="{ selected }"
          >
            <button
              :class="[
                'button w-full',
                selected
                  ? 'border-0 bg-pine-green-500/50 text-black shadow ring-2 ring-pine-green-500 dark:text-white'
                  : ' hover:bg-pine-green-200/[0.12] hover:text-white'
              ]"
            >
              {{ $t(tab.label) }}
            </button>
          </Tab>
        </TabList>
        <TabPanels class="p-4">
          <TabPanel>Content 1</TabPanel>
          <TabPanel>Content 2</TabPanel>
        </TabPanels>
      </TabGroup>
    </div>

    <table-component
      :columns="columns"
      :rows="rows"
      :loading="loading"
    >
      <template #amount-data="{ row }">
        {{
          new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
          }).format(parseFloat(row.amount))
        }}
      </template>
      <template #category-data="{ row }">
        {{ categoryFromId(row.category)?.name }}
      </template>

      <template #from-data="{ row }">
        {{ accountFromId(row.from)?.name ? accountFromId(row.from)?.name : row.amount > 0 ? '💰' : '🤬' }}
      </template>

      <template #to-data="{ row }">
        {{ accountFromId(row.to)?.name || '🤬' }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <dropdown-menu
          :items="items"
          :data="row"
        >
        </dropdown-menu>
      </template>
    </table-component>
  </div>
</template>

<script setup lang="ts">
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import type { Z_Transactions } from '@/types';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/vue';
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import moment from 'moment';
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';
import { ref, type Ref } from 'vue';

interface TransactionTab {
  id: string;
  label: string;
}

const loading: Ref<boolean> = ref(true);

const pagination = usePagination();
const dataStore = useDataStore();
const { accountFromId, categoryFromId } = dataStore;

const tabs: TransactionTab[] = [
  { id: 'by-month', label: 'transaction.tab.byMonth.title' },
  { id: 'all', label: 'transaction.tab.all.title' }
];

const columns = [
  // { key: "sId", label: "sId" },
  {
    key: 'desc',
    label: 'Description'
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'from',
    label: 'From',
    sortable: true
  },
  {
    key: 'to',
    label: 'To',
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

const items = [
  [
    {
      label: 'menu.edit',
      icon: PencilSquareIcon,
      click: (data: any) => {
        console.log(data);
      }
    },
    {
      label: 'menu.delete',
      icon: TrashIcon,
      click: (data: any) => {
        console.log;
      }
    }
  ]
];

const sortIt = (event: any) => {
  // todo: setSort
};

const changeTab = (i: number) => {
  loading.value = true;

  switch (tabs[i].id) {
    case 'all':
      pagination.setDayFilter(null);
      pagination.setPagination(1, 1_000);
      rows.value = dataStore.fetchTransactions();
      break;
    default:
      pagination.setPagination(1, 12);
      pagination.setDayFilter({
        year: moment().year(),
        month: moment().month()
      });
      rows.value = dataStore.fetchTransactions();
      break;
  }
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
      console.log(`Start "${name}" with params [${args.join(', ')}].`);

      // this will trigger if the action succeeds and after it has fully run.
      // it waits for any returned promised
      after(() => {
        console.log(`Finished "${name}" after ${Date.now() - startTime}ms.\n`);
        setTimeout(() => {
          loading.value = false;
        }, 1000);
      });

      // this will trigger if the action throws or returns a promise that rejects
      onError((error) => {
        console.warn(`Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`);
      });
    }
  }
);

onMounted(() => {
  changeTab(0);
});

onUnmounted(() => {
  // manually remove the listener
  unsubscribe();
});
</script>
