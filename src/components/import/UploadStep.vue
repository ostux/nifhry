<template>
  <div class="upload-section">
    <FileUpload
      mode="basic"
      accept=".csv"
      :auto="true"
      :chooseLabel="$t('importTransactions.selectFile')"
      @select="onFileSelect"
      :maxFileSize="5000000"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useImportStore } from '@/stores/import';
import { useCategoryStore } from '@/stores/category';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import FileUpload from 'primevue/fileupload';

const { t } = useI18n();
const toast = useToast();
const importStore = useImportStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const onFileSelect = async (event: { files: File[] }) => {
  const file = event.files[0];
  if (!file) return;

  try {
    // Check and initialize categories if needed
    if (categoryStore.categories.length === 0 && authStore.currentUser) {
      try {
        await categoryStore.prepopulateCategories(authStore.currentUser.uid);
        toast.add({
          severity: 'info',
          summary: t('common.info'),
          detail: t('importTransactions.categoriesInitialized'),
          life: 5000,
        });
      } catch (error) {
        console.error('Error initializing categories:', error);
        toast.add({
          severity: 'warn',
          summary: t('common.warning'),
          detail: t('importTransactions.categoriesInitError'),
          life: 5000,
        });
      }
    }

    await importStore.uploadFile(file);
  } catch (error) {
    console.error('Error reading CSV file:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('importTransactions.csvReadError'),
      life: 5000,
    });
  }
};
</script>

<style scoped>
.upload-section {
  padding: 2rem 0;
}
</style>
