<template>
  <div class="flex w-full justify-between">
    <div class="flex w-full justify-between">
      <div class="flex">
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

      <div class="flex">
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

      <div class="flex">
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
    <input-field
      name="description"
      type="text"
      v-model="search"
      @change="searchIt"
      :placeholder="$t('pagination.search')"
      class="max-w-64"
    />
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
import InputField from '@/components/ui/InputField.vue';
import { z } from 'zod';

const pagination = usePagination();

const emit = defineEmits(['change']);

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
    emit('change', 1);
  }
};

const previousPage = () => {
  if (!isFirstPage.value) {
    pagination.setPage(pagination.pagination.value.page - 1);
    emit('change', pagination.pagination.value.page - 1);
  }
};

const isLastPage: Ref<boolean> = computed(() => {
  return pagination.pagination.value.page === pagesCount.value || pagination.pagination.value.totalCount === 0;
});

const nextPage = () => {
  if (!isLastPage.value) {
    pagination.setPage(pagination.pagination.value.page + 1);
    emit('change', pagination.pagination.value.page + 1);
  }
};

const lastPage = () => {
  if (!isLastPage.value) {
    pagination.setPage(pagesCount.value);
    emit('change', pagesCount.value);
  }
};

const setPage = (p: number) => {
  pagination.setPage(p);
  emit('change', p);
};

const searchIt = (text: string) => {
  const str = z.string().safeParse(text.trim());

  if (str.success && str.data !== '') {
    pagination.setFilter([
      {
        column: 'desc',
        by: 'in',
        value: str.data
      }
    ]);

    emit('change', true);
  } else {
    pagination.removeFilter('desc');
    emit('change', true);
  }
};
</script>
