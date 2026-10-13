<template>
  <div class="container mx-auto p-4">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t('categories.title') }}</h1>
      <Button
        :label="$t('categories.createCategory')"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <div
      v-if="categoryStore.loading && categoryStore.categories.length === 0"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <div
      v-else-if="categoryStore.categories.length === 0"
      class="items-between flex flex-col items-center justify-center py-12"
    >
      <i class="pi pi-tag mb-4 text-6xl text-gray-400"></i>
      <p class="mb-4 text-xl text-gray-600">{{ $t('categories.noCategories') }}</p>
      <div class="flex gap-2">
        <Button
          :label="$t('categories.createFirst')"
          icon="pi pi-plus"
          @click="openCreateDialog"
        />
        <Button
          :label="$t('categories.prepopulate')"
          icon="pi pi-database"
          severity="secondary"
          :loading="isPrepopulating"
          @click="handlePrepopulate"
        />
      </div>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <CategoryCard
        v-for="category in categoryStore.categories"
        :key="category.id"
        :category="category"
        @edit="handleEditCategory"
      />
    </div>

    <CategoryFormDialog
      v-model:visible="showFormDialog"
      :category="selectedCategory"
    />
  </div>
</template>

<script setup lang="ts">
import CategoryCard from '@/components/category/CategoryCard.vue';
import CategoryFormDialog from '@/components/category/CategoryFormDialog.vue';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import type { Category } from '@/types';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const toast = useToast();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();
// const accountStore = useAccountStore();

const showFormDialog = ref(false);
const selectedCategory = ref<Category | undefined>(undefined);
const isPrepopulating = ref(false);

const openCreateDialog = () => {
  selectedCategory.value = undefined;
  showFormDialog.value = true;
};

const handleEditCategory = (category: Category) => {
  selectedCategory.value = category;
  showFormDialog.value = true;
};

const handlePrepopulate = async () => {
  if (!authStore.currentUser) return;

  isPrepopulating.value = true;

  try {
    await categoryStore.prepopulateCategories(authStore.currentUser.uid);
    toast.add({
      severity: 'success',
      summary: t('categories.prepopulateSuccess'),
      life: 3000,
    });
  } catch (error) {
    console.error('Error prepopulating categories:', error);
    toast.add({
      severity: 'error',
      summary: t('categories.errors.prepopulateFailed'),
      life: 3000,
    });
  } finally {
    isPrepopulating.value = false;
  }
};
</script>
