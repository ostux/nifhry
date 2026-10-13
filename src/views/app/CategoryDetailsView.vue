<template>
  <div class="container mx-auto p-4">
    <!-- Category Header -->
    <div
      v-if="currentCategory"
      class="mb-6"
    >
      <div class="flex flex-row justify-between">
        <div class="flex flex-col">
          <span>
            <i class="pi pi-tag"></i>
            {{ currentCategory.name }}
          </span>
          <rovas-component
            class="ml-4 text-2xl"
            :msg="currentCategory.name"
          />
        </div>

        <div class="ml-14 flex items-center gap-4">
          <div>
            <span class="text-sm text-gray-600">{{ $t('categories.description') }}</span>
            <p class="text-xl font-bold">{{ currentCategory.desc || $t('categories.noDescription') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <!-- Category Not Found -->
    <div
      v-else-if="!currentCategory"
      class="flex flex-col items-center justify-center py-12"
    >
      <i class="pi pi-exclamation-triangle mb-4 text-6xl text-gray-400"></i>
      <p class="text-xl text-gray-600">{{ $t('categories.notFound') }}</p>
      <Button
        :label="$t('categories.backToCategories')"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="$router.push({ name: 'categories' })"
      />
    </div>

    <!-- Transactions Section -->
    <div v-else>
      <TransactionsTable
        :category-id="categoryId"
        show-title
        show-batch-edit
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TransactionsTable from '@/components/transaction/TransactionsTable.vue';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import type { Category } from '@/types';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const loading = ref(true);

// Get category ID from route
const categoryId = computed(() => route.params.id as string);

// Get current category
const currentCategory = computed<Category | undefined>(() => {
  return categoryStore.categories.find((c) => c.id === categoryId.value);
});

// Load data when component mounts or category ID changes
const loadData = async () => {
  if (!authStore.currentUser) return;

  loading.value = true;
  try {
    // Initialize category listener
    categoryStore.initCategoriesListener(authStore.currentUser.uid);

    // Reset transaction pagination for the new category
    transactionStore.resetPagination();

    // Check if category exists
    if (!currentCategory.value) {
      console.warn('Category not found:', categoryId.value);
    }
  } catch (error) {
    console.error('Error loading category data:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('transactions.errors.loadFailed'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadData();
});

// Watch for category ID changes
watch(categoryId, async () => {
  await loadData();
});
</script>
