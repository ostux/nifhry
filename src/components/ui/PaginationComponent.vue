<template>
  <div class="flex w-full flex-col justify-between gap-4 md:flex-row">
    <div class="flex w-full flex-col justify-between gap-4 md:flex-row">
      <div class="flex items-center justify-center">
        <button
          class="hover:text-pine-green-700 disabled:cursor-not-allowed disabled:text-gray-600"
          :disabled="isFirstPage"
          @click="firstPage"
        >
          <ChevronDoubleLeftIcon class="h-6 w-10" />
        </button>
        <button
          class="hover:text-pine-green-700 disabled:cursor-not-allowed disabled:text-gray-600"
          :disabled="isFirstPage"
          @click="previousPage"
        >
          <ChevronLeftIcon class="h-6 w-10" />
        </button>
      </div>

      <div class="flex items-center justify-center">
        <button
          class="h-6 w-10 hover:text-pine-green-700 disabled:cursor-not-allowed disabled:text-gray-600"
          v-for="page in pages"
          :key="page"
          @click="page !== '...' ? setPage(page) : null"
          :disabled="pagination.pagination.value.page === page"
        >
          <span :class="[page === pagination.pagination.value?.page ? 'text-pine-green-500' : '']"> {{ page }}&nbsp; </span>
        </button>
      </div>

      <div class="flex items-center justify-center">
        <button
          class="hover:text-pine-green-700 disabled:cursor-not-allowed disabled:text-gray-600"
          :disabled="isLastPage"
          @click="nextPage"
        >
          <ChevronRightIcon class="h-6 w-10" />
        </button>
        <button
          class="hover:text-pine-green-700 disabled:cursor-not-allowed disabled:text-gray-600"
          :disabled="isLastPage"
          @click="lastPage"
        >
          <ChevronDoubleRightIcon class="h-6 w-10" />
        </button>
      </div>
    </div>
    <show-pending-checkbox class="md:max-w-40" />
    <input-field
      name="description"
      type="text"
      v-model="search"
      :placeholder="$t('pagination.search')"
      class="md:max-w-64"
    />
  </div>
</template>

<script setup lang="ts">
import InputField from '@/components/ui/InputField.vue';
import ShowPendingCheckbox from '@/components/ui/ShowPendingCheckbox.vue';
import { usePagination } from '@/composables/usePagination';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { computed, ref, type ComputedRef, type Ref, watch } from 'vue';
import { z } from 'zod';

const pagination = usePagination();

const search: Ref<string> = ref('');

const pages: ComputedRef<any[]> = computed(() => {
  const p = pagination.pagination.value;
  const pagesCount = Math.ceil(p.totalCount / p.perPage);
  const allPages: number[] = [];

  Array.from(Array(pagesCount).keys())
    .map((n) => n + 1)
    .forEach((n) => {
      if (n === 1 || n === pagesCount || n === p.page || (n > p.page - 3 && n < p.page + 3)) {
        allPages.push(n);
      } else {
        allPages.push(0);
      }
    });

  const res: any[] = [];

  allPages.forEach((a) => {
    if (a !== 0) {
      res.push(a);
    } else if (res[res.length - 1] !== '...') {
      res.push('...');
    }
  });

  return res;
});

const pagesCount = computed(() => {
  const p = pagination.pagination.value;

  return Math.ceil(p.totalCount / p.perPage);
});

const isFirstPage: Ref<boolean> = computed(() => {
  return pagination.pagination.value.page === 1 || pagination.pagination.value.totalCount === 0;
});

const firstPage = () => {
  if (!isFirstPage.value) {
    pagination.setPage(1);
    pagination.startLoading();
  }
};

const previousPage = () => {
  if (!isFirstPage.value) {
    pagination.setPage(pagination.pagination.value.page - 1);
    pagination.startLoading();
  }
};

const isLastPage: Ref<boolean> = computed(() => {
  return pagination.pagination.value.page === pagesCount.value || pagination.pagination.value.totalCount === 0;
});

const nextPage = () => {
  if (!isLastPage.value) {
    pagination.setPage(pagination.pagination.value.page + 1);
    pagination.startLoading();
  }
};

const lastPage = () => {
  if (!isLastPage.value) {
    pagination.setPage(pagesCount.value);
    pagination.startLoading();
  }
};

const setPage = (p: number) => {
  pagination.setPage(p);
  pagination.startLoading();
};

let timer: any;

function debounce(func: any, timeout = 300) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    func();
  }, timeout);
}

watch([search], (newValue) => {
  debounce(() => {
    const str = z.string().safeParse(newValue[0]);

    if (str.success && str.data !== '') {
      pagination.setFilter([
        {
          column: 'desc',
          by: 'in',
          value: str.data
        }
      ]);

      pagination.startLoading();
    } else {
      pagination.removeFilter('desc');
      pagination.startLoading();
    }
  });
});
</script>
