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

    <ControlForm :categoryId="category.id" />

    <TransactionMultiEditForm v-if="selectedRows.size" />

    <table-component
      :columns="columns"
      :rows="rows"
      @select="selectedRows = $event"
      :checkbox="true"
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
        {{ categoryById(row.category)?.name }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <transaction-action-menu :row="row" />
      </template>
    </table-component>
  </div>
  <div v-else>Category not found</div>
</template>

<script setup lang="ts">
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';
import TransactionMultiEditForm from '@/components/transaction/TransactionMultiEditForm.vue';
import ControlForm from '@/components/ui/ControlForm.vue';
import RovasComponent from '@/components/ui/RovasComponent.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { z_filterBy, type Z_CategoriesArray, type Z_Category, type Z_Transaction, type Z_Transactions } from '@/types';
import { getAmountColor } from '@/utils/helpers';
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

const columns = [
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

const totalIn: ComputedRef<number> = computed(() => rows.value.reduce((acc, cur) => acc + cur.in, 0));
const totalOut: ComputedRef<number> = computed(() => rows.value.reduce((acc, cur) => acc - cur.out, 0));

const category: ComputedRef<Z_Category | undefined> = computed(() =>
  categories.value.get(route.params.slug as unknown as string)
);

const selectedRows: ComputedRef<Set<string>> = computed(() => pagination.selected.value);

const childCategories: ComputedRef<Z_Category[]> = computed(() => {
  return (Array.from(categories.value.values()) as unknown as Z_CategoriesArray).filter(
    (c: Z_Category) => c.parent === category.value?.id
  );
});

const refetch = () => {
  pagination.setFilter([{ column: 'category', by: z_filterBy.enum.eq, value: category.value?.id }]);

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

watch([category], () => {
  pagination.clearSelected();
  pagination.startLoading();
});

watch(
  [pagination.isLoading],
  (loading) => {
    if (loading) refetch();
  },
  { deep: true }
);

onMounted(() => {
  console.log('%cAccount view mouunted...', 'color:#17A589');
  pagination.reset();
  pagination.setPage(1);
  pagination.setTotalCount(0);
  pagination.setPerPage(10_000);

  refetch();
});

onUnmounted(() => {
  pagination.clearSelected();
  unsubscribe();
});
</script>
