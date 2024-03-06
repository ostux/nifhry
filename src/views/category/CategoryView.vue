<template>
  <div
    class="max-wmx-auto w-full max-w-6xl px-2 md:px-6 lg:px-8"
    v-if="category"
  >
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
    <br />
  </div>
  <div v-else>Category not found</div>
</template>

<script setup lang="ts">
import RovasComponent from '@/components/ui/RovasComponent.vue';
import { useDataStore } from '@/stores/dataStore';
import type { Z_Category, Z_Transaction, Z_Transactions } from '@/types';
import { QueueListIcon } from '@heroicons/vue/24/outline';
import { storeToRefs } from 'pinia';
import { computed, onMounted, type ComputedRef, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const dataStore = useDataStore();
const { categories } = storeToRefs(dataStore);

const loading: Ref<boolean> = ref(true);
const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);
const transactionsToRemove: Ref<Z_Transactions> = ref([]);

const columns = [
  // { key: "sId", label: "sId" },
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

const category: ComputedRef<Z_Category | undefined> = computed(() =>
  categories.value.get(route.params.slug as unknown as string)
);

onMounted(() => {});
</script>
