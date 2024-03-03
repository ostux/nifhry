<template>
  <div class="w-full">
    <table class="min-w-full table-fixed divide-y divide-gray-300 dark:divide-gray-700">
      <thead>
        <tr class="border-b border-gray-200">
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
              class="relative"
            >
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
import { DocumentMagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import type { PropType } from 'vue';

defineProps({
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
  }
});
</script>
