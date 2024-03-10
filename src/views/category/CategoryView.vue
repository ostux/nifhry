<template>
  <div
    class="max-wmx-auto w-full max-w-6xl px-2 md:px-6 lg:px-8"
    v-if="category"
  >
    <div class="flex justify-between pb-4">
      <div class="flex flex-row">
        <QueueListIcon class="mr-4 size-6" />
        <div class="flex flex-col">
          <span>{{ category.name }}</span>
          <rovas-component
            class="text-3xl"
            :msg="category.name"
          />
        </div>
      </div>
      <div
        class="flex flex-row"
        v-if="category.parent"
      >
        <ArrowUpTrayIcon class="mr-4 size-6" />
        <div class="flex flex-col">
          <RouterLink :to="`${categories.get(category.parent)?.id}`">
            <span>{{ categories.get(category.parent)?.name }}</span>

            <rovas-component
              class="text-right text-3xl"
              :msg="category.name"
            />
          </RouterLink>
        </div>
      </div>
    </div>
    <div class="flex flex-row flex-wrap justify-end gap-2 pb-4">
      <div
        class="flex"
        v-for="cat in childCategories"
        :key="cat.id"
      >
        <template v-if="cat.id !== category.id">
          <ArrowUpTrayIcon class="mr-4 size-6 rotate-180" />
          <div class="flex flex-col">
            <RouterLink :to="`${cat.id}`">
              <span>{{ cat.name }}</span>

              <rovas-component
                class="text-right text-3xl"
                :msg="category.name"
              />
            </RouterLink>
          </div>
        </template>
      </div>
    </div>
    <div class="flex justify-between py-2">
      <p class="py-1">
        In:&nbsp;
        <span class="font-semibold text-pine-green-500">
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(totalIn)
          }}</span
        >
      </p>
      <p class="py-1">
        Out:
        <span class="font-semibold text-rose-500">
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(totalOut)
          }}</span
        >
      </p>
    </div>

    <pagination-componnt @change="refetch" />
    <transaction-multi-edit-form
      v-if="selectedRows.size"
      @saved="transactionChangesSaved"
    />

    <table-component
      :columns="columns"
      :rows="rows"
      :loading="loading"
      @select="selectedRows = $event"
      :checkbox="true"
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
  <div v-else>Category not found</div>
</template>

<script setup lang="ts">
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';
import TransactionMultiEditForm from '@/components/transaction/TransactionMultiEditForm.vue';
import PaginationComponnt from '@/components/ui/PaginationComponnt.vue';
import RovasComponent from '@/components/ui/RovasComponent.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { nullUUID, z_filterBy, type Z_Category, type Z_Transaction, type Z_Transactions } from '@/types';
import { ArrowUpTrayIcon, QueueListIcon } from '@heroicons/vue/24/outline';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;
const { categories } = storeToRefs(dataStore);

const pagination = usePagination();
const loading: Ref<boolean> = ref(true);

const columns = [
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

const totalIn: ComputedRef<number> = computed(() => rows.value.reduce((acc, cur) => acc + (cur.amount > 0 ? cur.amount : 0), 0));
const totalOut: ComputedRef<number> = computed(
  () => rows.value.reduce((acc, cur) => acc + (cur.amount < 0 ? Math.abs(cur.amount) : 0), 0) * -1
);

const category: ComputedRef<Z_Category | undefined> = computed(() =>
  categories.value.get(route.params.slug as unknown as string)
);

const selectedRows: ComputedRef<Set<string>> = computed(() => pagination.selected.value);

const childCategories: ComputedRef<Z_Category[]> = computed(() => {
  return Array.from(categories.value.values()).filter((c) => c.parent === category.value?.id);
});
const refetch = () => {
  loading.value = true;
  pagination.setFilter([{ column: 'category', by: z_filterBy.enum.eq, value: category.value?.name }]);

  rows.value = dataStore.fetchTransactions();
};

const getAmountColor = (row: Z_Transaction) => {
  if (row.from !== nullUUID && row.to !== nullUUID) return 'text-sky-500';

  return row.amount < 0 ? 'text-rose-500' : 'text-pine-green-500';
};

const unsubscribe = dataStore.$onAction(
  ({
    name, // name of the action
    after // hook after the action returns or resolves
  }) => {
    if (name === 'fetchTransactions') {
      after(() => {
        setTimeout(() => {
          loading.value = false;
        }, 300);
      });
    }
  }
);

const transactionChangesSaved = () => {
  pagination.clearSelected();
  refetch();
};

watch([category], () => {
  pagination.clearSelected();
  refetch();
});

onMounted(() => {
  pagination.clearSelected();
  pagination.setDayFilter(null);
  pagination.setPagination(1, 1_000);

  refetch();
});

onUnmounted(() => {
  pagination.clearSelected();
  unsubscribe();
});
</script>
