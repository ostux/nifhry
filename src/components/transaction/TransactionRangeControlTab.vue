<template>
  <div class="block min-w-96">
    <TabGroup
      @change="changeTab"
      :defaultIndex="0"
    >
      <TabList class="flex justify-between gap-4 rounded-md p-2 shadow-md">
        <Tab
          v-for="tab in tabs"
          as="component"
          :key="tab.id"
          v-slot="{ selected }"
          class="flex-grow"
        >
          <simple-button
            class="w-full"
            :label="tab.label"
            :active="selected"
          />
        </Tab>
      </TabList>
      <TabPanels class="p-4">
        <TabPanel>
          <div class="m-auto flex w-full gap-4 pb-4">
            <ArrowLeftCircleIcon
              class="size-8 text-pine-green-700 hover:cursor-pointer hover:text-pine-green-500"
              @click="changeMonth('previous')"
            />
            <span
              class="w-[200px] self-center text-center"
              v-if="pagination.dayFilter.value?.year !== undefined && pagination.dayFilter.value?.month !== undefined"
            >
              {{ pagination.dayFilter.value.year }} - {{ moment().month(pagination.dayFilter.value.month).format('MMMM') }}
            </span>
            <ArrowRightCircleIcon
              class="size-8 text-pine-green-700 hover:cursor-pointer hover:text-pine-green-500"
              @click="changeMonth('next')"
            />
            <ArrowUturnLeftIcon
              v-if="
                pagination.dayFilter.value?.year !== moment().year() || pagination.dayFilter.value?.month !== moment().month()
              "
              class="size-8 text-pine-green-700 hover:cursor-pointer hover:text-pine-green-500"
              @click="changeMonth('reset')"
            />
          </div>
          <label
            class="flex w-full flex-row-reverse items-center justify-end gap-4 text-sm font-medium leading-6 text-gray-900 dark:text-white"
          >
            <span>{{ $t('transaction.tab.includePending') }}</span>
            <input
              type="checkbox"
              :checked="showPending"
              class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-pine-green-600 accent-pine-green-400 focus:ring-2 focus:ring-pine-green-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-pine-green-600"
              @change="includePending(($event?.target as HTMLInputElement)?.checked)"
            />
          </label>
        </TabPanel>
        <TabPanel>
          <label
            class="flex w-full flex-row-reverse items-center justify-end gap-4 text-sm font-medium leading-6 text-gray-900 dark:text-white"
          >
            <span>{{ $t('transaction.tab.includePending') }}</span>
            <input
              type="checkbox"
              :checked="showPending"
              class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-pine-green-600 accent-pine-green-400 focus:ring-2 focus:ring-pine-green-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-pine-green-600"
              @change="includePending(($event?.target as HTMLInputElement)?.checked)"
            />
          </label>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { z_month, z_transactionStatus, z_year } from '@/types';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/vue';
import { ArrowLeftCircleIcon, ArrowRightCircleIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/solid';
import moment, { type Moment } from 'moment';
import { onMounted, ref, type Ref } from 'vue';
import SimpleButton from '../ui/SimpleButton.vue';

interface TransactionTab {
  id: string;
  label: string;
}

const emit = defineEmits(['change']);

const pagination = usePagination();

const showPending: Ref<boolean> = ref(false);

const tabs: TransactionTab[] = [
  { id: 'by-month', label: 'transaction.tab.byMonth.title' },
  { id: 'all', label: 'transaction.tab.all.title' }
];

const changeMonth = (direction: 'previous' | 'next' | 'reset') => {
  let y = moment().year();
  let m = moment().month();

  if (z_year.safeParse(pagination.dayFilter.value?.year).success) {
    y = z_year.parse(pagination.dayFilter.value?.year);
  }

  if (z_month.safeParse(pagination.dayFilter.value?.month).success) {
    m = z_month.parse(pagination.dayFilter.value?.month);
  }

  let t: Moment = moment();

  switch (direction) {
    case 'previous':
      t = moment().year(y).month(m).startOf('month').subtract(1, 'month');
      break;
    case 'next':
      t = moment().year(y).month(m).startOf('month').add(1, 'month');
      break;
    default:
      t = moment();
      break;
  }

  pagination.pagination.value.page = 1;
  pagination.pagination.value.totalCount = 0;
  pagination.filters.value = [];
  pagination.dayFilter.value = {
    year: t.year(),
    month: t.month()
  };

  emit('change', true);
};

const includePending = (e: boolean) => {
  showPending.value = e;
  if (!showPending.value) {
    pagination.setFilter([
      {
        column: 'status',
        by: 'eq',
        value: z_transactionStatus.enum.Paid
      }
    ]);
  } else {
    pagination.setFilter([]);
  }
  emit('change', true);
};

const changeTab = (i: number) => {
  if (!showPending.value) {
    pagination.setFilter([
      {
        column: 'status',
        by: 'eq',
        value: z_transactionStatus.enum.Paid
      }
    ]);
  } else {
    pagination.setFilter([]);
  }
  pagination.setDayFilter(null);

  switch (tabs[i].id) {
    case 'all':
      pagination.setPagination(1, 1_000);
      emit('change', true);
      break;
    default:
      pagination.setPagination(1, 1_000);
      pagination.setDayFilter({
        year: moment().year(),
        month: moment().month()
      });
      emit('change', true);
      break;
  }
};

onMounted(() => {
  changeTab(0);
});
</script>
