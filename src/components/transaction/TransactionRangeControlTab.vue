<template>
  <div class="flex flex-col-reverse justify-between gap-4 p-2 md:flex-row">
    <TabGroup
      @change="changeTab"
      :defaultIndex="0"
    >
      <TabPanels class="flex items-center justify-center">
        <TabPanel>
          <div class="m-auto flex w-full gap-4">
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
        </TabPanel>
        <TabPanel> </TabPanel>
      </TabPanels>
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
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { z_month, z_year } from '@/types';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue';
import { ArrowLeftCircleIcon, ArrowRightCircleIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/solid';
import moment, { type Moment } from 'moment';
import { onMounted } from 'vue';
import SimpleButton from '../ui/SimpleButton.vue';

interface TransactionTab {
  id: string;
  label: string;
}

const emit = defineEmits(['change']);

const pagination = usePagination();

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

  pagination.startLoading();
};

const changeTab = (i: number) => {
  pagination.setDayFilter(null);

  switch (tabs[i].id) {
    case 'all':
      pagination.clearFilter();
      pagination.setShowPending(false);
      pagination.setPagination(1, 10);
      pagination.startLoading();
      break;
    default:
      pagination.clearFilter();
      pagination.setPagination(1, 1_00);
      pagination.setDayFilter({
        year: moment().year(),
        month: moment().month()
      });
      pagination.startLoading();
      break;
  }
};

onMounted(() => {
  changeTab(0);
});
</script>
