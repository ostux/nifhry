<template>
  <div class="upload-section">
    <div class="flex flex-col gap-4">
      <FileUpload
        mode="basic"
        accept=".csv"
        :auto="true"
        :chooseLabel="$t('importTransactions.selectFile')"
        @select="onFileSelect"
        :maxFileSize="5000000"
      />

      <div class="flex justify-center">
        <Button
          :label="$t('importTransactions.download_template')"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="downloadTemplate"
        />
      </div>
    </div>
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

const downloadTemplate = () => {
  // Create sample CSV data with In/Out columns (recommended format)
  const csvContent = [
    ['Date', 'Description', 'In', 'Out', 'Category'],
    ['01/01/2024', 'Salary', '5000', '', 'Income'],
    ['02/01/2024', 'Groceries', '', '150', 'Food'],
    ['03/01/2024', 'Freelance income', '1200', '', 'Income'],
    ['04/01/2024', 'Restaurant', '', '45.50', 'Food'],
    ['05/01/2024', 'Rent payment', '', '1500', 'Housing'],
    ['', '', '', '', ''],
    ['# For credit card statements, you can use Amount column instead:', '', '', '', ''],
    ['Date', 'Description', 'Amount', 'Category', ''],
    ['01/02/2024', 'Payment received', '1200', 'Income', ''],
    ['02/02/2024', 'Purchase', '-45.50', 'Shopping', '']
  ];

  // Convert array to CSV string
  const csv = csvContent.map(row => row.join(',')).join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'nifhry_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.upload-section {
  padding: 2rem 0;
}
</style>
