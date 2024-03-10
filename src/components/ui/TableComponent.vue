<template>
  <div class="w-full">
    <table class="min-w-full table-fixed divide-y divide-gray-300 dark:divide-gray-700">
      <thead class="bg-background/75 sticky top-[65px] z-50 -mb-px backdrop-blur">
        <tr>
          <th
            class="w-6 p-2"
            v-if="checkbox"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-pine-green-600 accent-pine-green-400 focus:ring-2 focus:ring-pine-green-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-pine-green-600"
              @change="selectAll(($event?.target as HTMLInputElement)?.checked)"
            />
          </th>
          <th
            v-for="(column, index) in columns"
            :key="index"
            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white rtl:text-right"
          >
            <slot
              :name="`${column.key}-header`"
              :column="column"
            >
              <!-- TODO: sortable -->
              <template v-if="column.label">
                {{ column.label }}
              </template>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
        <template v-if="loading">
          <tr>
            <td class="w-6 p-2"></td>
            <td
              v-for="(column, subIndex) in columns"
              :key="subIndex"
              class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="flex h-2 min-w-4 animate-ping rounded-full bg-pine-green-600 dark:bg-pine-green-300">&nbsp;</span>
            </td>
          </tr>
        </template>
        <template v-else>
          <template v-if="rows.length > 0">
            <tr
              v-for="(row, index) in rows"
              :key="index"
              class="relative hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <td
                class="w-6 p-2"
                v-if="checkbox"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-pine-green-600 accent-pine-green-400 focus:ring-2 focus:ring-pine-green-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-pine-green-600"
                  :checked="selected.has(row.id)"
                  @change="select(($event?.target as HTMLInputElement)?.checked, row.id)"
                />
              </td>
              <td
                v-for="(column, subIndex) in columns"
                :key="subIndex"
                class="relative max-w-[300px] text-ellipsis whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400"
                :class="[column.key === 'actions' ? 'overflow-visible' : 'overflow-clip']"
              >
                <slot
                  :name="`${column.key}-data`"
                  :column="column"
                  :row="row"
                  :index="index"
                >
                  {{ row[column.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
    <div
      v-if="!loading && rows.length === 0"
      class="flex w-full flex-col items-center justify-center gap-4 p-4"
    >
      <DocumentMagnifyingGlassIcon class="size-12" />
      {{ $t('table.empty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { DocumentMagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { computed, type ComputedRef, type PropType } from 'vue';

const pagination = usePagination();

const selected: ComputedRef<Set<string>> = computed(() => pagination.selected.value);

const props = defineProps({
  columns: {
    type: Array as PropType<
      {
        key: string;
        label?: string;
        sortable?: boolean;
        direction?: 'asc' | 'desc';
        [key: string]: any;
      }[]
    >,
    default: null
  },
  rows: {
    type: Array as PropType<{ [key: string]: any }[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  checkbox: {
    type: Boolean,
    default: false
  }
});

const selectAll = (s: boolean) => {
  if (s) {
    props.rows.forEach((row) => {
      pagination.addToSelected(row.id);
    });
  } else {
    props.rows.forEach((row) => {
      pagination.removeFromSelected(row.id);
    });
  }
};

const select = (s: boolean, id: string) => {
  if (s) {
    pagination.addToSelected(id);
  } else {
    pagination.removeFromSelected(id);
  }
};
</script>
