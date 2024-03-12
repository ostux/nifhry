<template>
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
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { computed } from 'vue';

const pagination = usePagination();

const showPending = computed(() => pagination.showPending.value);

const includePending = (e: boolean) => {
  pagination.setShowPending(e);
  pagination.startLoading();
};
</script>
