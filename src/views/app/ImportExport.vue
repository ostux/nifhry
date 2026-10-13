<template>
  <div class="container mx-auto p-4">
    <div class="mb-6">
      <h1 class="mb-2 text-3xl font-bold">{{ t('importExport.title') }}</h1>
      <p class="text-surface-600 dark:text-surface-400">{{ t('importExport.subtitle') }}</p>
    </div>

    <div class="flex flex-col justify-between lg:flex-row">
      <!-- Export Card -->
      <Card class="mb-6 max-w-2xl">
        <template #content>
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <i class="pi pi-download text-primary text-2xl"></i>
              <div class="flex-1">
                <h3 class="text-lg font-semibold">{{ t('importExport.export.title') }}</h3>
                <p class="text-surface-600 dark:text-surface-400 text-sm">
                  {{ t('importExport.export.description') }}
                </p>
              </div>
            </div>

            <Divider />

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div class="flex gap-3">
                <i class="pi pi-info-circle text-xl text-blue-600 dark:text-blue-400"></i>
                <div class="flex-1">
                  <h4 class="mb-2 font-semibold text-blue-800 dark:text-blue-300">{{ t('importExport.export.infoTitle') }}</h4>
                  <ul class="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.export.info1') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.export.info2') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.export.info3') }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-surface-700 dark:text-surface-300 text-sm font-medium">
                {{ t('importExport.export.rangeLabel') }}
              </label>
              <SelectButton
                v-model="exportRange"
                :options="exportRangeOptions"
                option-label="label"
                option-value="value"
                class="w-full"
              />
            </div>

            <div class="flex justify-end">
              <Button
                :label="t('importExport.export.button')"
                icon="pi pi-download"
                severity="success"
                :loading="exporting"
                @click="handleExport"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Import Card -->
      <Card class="max-w-2xl">
        <template #content>
          <div class="space-y-6">
            <!-- File Upload Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <i class="pi pi-upload text-primary text-2xl"></i>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">{{ t('importExport.import.title') }}</h3>
                  <p class="text-surface-600 dark:text-surface-400 text-sm">
                    {{ t('importExport.import.description') }}
                  </p>
                </div>
              </div>

              <FileUpload
                mode="basic"
                accept=".json"
                :maxFileSize="52428800"
                :auto="false"
                :chooseLabel="t('importExport.import.chooseFile')"
                class="w-full"
                @select="onFileSelect"
              />

              <div
                v-if="selectedFile"
                class="bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 rounded-lg border p-4"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-file text-primary text-xl"></i>
                    <div>
                      <p class="font-medium">{{ selectedFile.name }}</p>
                      <p class="text-surface-600 dark:text-surface-400 text-sm">
                        {{ formatFileSize(selectedFile.size) }}
                      </p>
                    </div>
                  </div>
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    text
                    rounded
                    @click="clearFile"
                  />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Warning Section: full import -->
            <div
              v-if="!isPartialImport"
              class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
            >
              <div class="flex gap-3">
                <i class="pi pi-exclamation-triangle text-xl text-yellow-600 dark:text-yellow-400"></i>
                <div class="flex-1">
                  <h4 class="mb-2 font-semibold text-yellow-800 dark:text-yellow-300">
                    {{ t('importExport.import.warningTitle') }}
                  </h4>
                  <ul class="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.warning1') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.warning2') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.warning3') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.warning4') }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Info Section: partial import -->
            <div
              v-else
              class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
            >
              <div class="flex gap-3">
                <i class="pi pi-info-circle text-xl text-blue-600 dark:text-blue-400"></i>
                <div class="flex-1">
                  <h4 class="mb-2 font-semibold text-blue-800 dark:text-blue-300">
                    {{ t('importExport.import.partialInfoTitle') }}
                  </h4>
                  <ul class="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.partialInfo1') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.partialInfo2') }}</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i
                        class="pi pi-circle-fill mt-1.5"
                        style="font-size: 0.375rem"
                      ></i>
                      <span>{{ t('importExport.import.partialInfo3') }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="flex justify-end">
              <Button
                :label="t('importExport.import.button')"
                icon="pi pi-download"
                severity="danger"
                :disabled="!selectedFile || importing"
                :loading="importing"
                @click="confirmImport"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      modal
      :closable="!importing"
      :closeOnEscape="!importing"
      :header="t('importExport.import.confirmTitle')"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <!-- Full import warning -->
        <div
          v-if="!isPartialImport"
          class="rounded-lg border border-pink-200 bg-pink-50 p-4 dark:border-pink-800 dark:bg-pink-900/20"
        >
          <div class="flex gap-3">
            <i class="pi pi-exclamation-circle text-2xl text-pink-600 dark:text-pink-400"></i>
            <div class="flex-1">
              <h4 class="mb-2 font-semibold text-pink-800 dark:text-pink-300">{{ t('importExport.import.confirmMessage') }}</h4>
              <p class="text-sm text-pink-700 dark:text-pink-400">
                {{ t('importExport.import.confirmDetail') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Partial import info -->
        <div
          v-else
          class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div class="flex gap-3">
            <i class="pi pi-info-circle text-2xl text-blue-600 dark:text-blue-400"></i>
            <div class="flex-1">
              <h4 class="mb-2 font-semibold text-blue-800 dark:text-blue-300">{{ t('importExport.import.partialConfirmMessage') }}</h4>
              <p class="text-sm text-blue-700 dark:text-blue-400">
                {{ t('importExport.import.partialConfirmDetail') }}
              </p>
            </div>
          </div>
        </div>

        <p class="text-surface-700 dark:text-surface-300">{{ t('importExport.import.confirmQuestion') }}</p>

        <div class="bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 rounded-lg border p-3">
          <p class="text-surface-600 dark:text-surface-400 mb-2 text-sm font-medium">
            {{ t('importExport.import.summaryTitle') }}
          </p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.summaryFile') }}</span>
              <span class="font-medium">{{ selectedFile?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.summarySize') }}</span>
              <span class="font-medium">{{ selectedFile ? formatFileSize(selectedFile.size) : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="t('common.cancel')"
            severity="secondary"
            outlined
            :disabled="importing"
            @click="showConfirmDialog = false"
          />
          <Button
            :label="t('importExport.import.confirmButton')"
            severity="danger"
            :loading="importing"
            @click="handleImport"
          />
        </div>
      </template>
    </Dialog>

    <!-- Progress Dialog -->
    <Dialog
      v-model:visible="showProgressDialog"
      modal
      :closable="false"
      :closeOnEscape="false"
      :header="t('importExport.import.progressTitle')"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-6">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-surface-700 dark:text-surface-300 font-medium">
              {{ progress.step }}
            </span>
            <span class="text-surface-600 dark:text-surface-400 text-sm"> {{ progress.current }} / {{ progress.total }} </span>
          </div>
          <ProgressBar :value="progress.percentage" />
        </div>

        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div class="flex gap-3">
            <i class="pi pi-info-circle text-xl text-blue-600 dark:text-blue-400"></i>
            <div>
              <p class="text-sm text-blue-700 dark:text-blue-400">
                {{ t('importExport.import.progressMessage') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Import Steps -->
        <div class="space-y-2">
          <div
            v-for="step in importSteps"
            :key="step.name"
            class="flex items-center gap-3 rounded-lg p-2"
            :class="{
              'bg-teal-50 dark:bg-teal-900/20': step.completed,
              'bg-blue-50 dark:bg-blue-900/20': step.active && !step.completed,
              'bg-surface-50 dark:bg-surface-800': !step.active && !step.completed,
            }"
          >
            <i
              class="text-xl"
              :class="{
                'pi pi-check-circle text-teal-600 dark:text-teal-400': step.completed,
                'pi pi-spin pi-spinner text-blue-600 dark:text-blue-400': step.active && !step.completed,
                'pi pi-circle text-surface-400': !step.active && !step.completed,
              }"
            ></i>
            <span
              class="text-sm"
              :class="{
                'font-medium text-teal-700 dark:text-teal-400': step.completed,
                'font-medium text-blue-700 dark:text-blue-400': step.active && !step.completed,
                'text-surface-600 dark:text-surface-400': !step.active && !step.completed,
              }"
            >
              {{ step.name }}
            </span>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="showSuccessDialog"
      modal
      :header="t('importExport.import.successTitle')"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <div class="rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
          <div class="flex gap-3">
            <i class="pi pi-check-circle text-2xl text-teal-600 dark:text-teal-400"></i>
            <div class="flex-1">
              <h4 class="mb-2 font-semibold text-teal-800 dark:text-teal-300">{{ t('importExport.import.successMessage') }}</h4>
              <p class="text-sm text-teal-700 dark:text-teal-400">
                {{ t('importExport.import.successDetail') }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 rounded-lg border p-3">
          <p class="text-surface-600 dark:text-surface-400 mb-2 text-sm font-medium">{{ t('importExport.import.statsTitle') }}</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.statsCategories') }}</span>
              <span class="font-medium">{{ importStats.categories }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.statsAccounts') }}</span>
              <span class="font-medium">{{ importStats.accounts }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.statsTransactions') }}</span>
              <span class="font-medium">{{ importStats.transactions }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-600 dark:text-surface-400">{{ t('importExport.import.statsBudgets') }}</span>
              <span class="font-medium">{{ importStats.budgets }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="t('common.close')"
            @click="handleSuccessClose"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useDataImport, type ExportRange } from '@/composables/useDataImport';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const toast = useToast();
const authStore = useAuthStore();
const router = useRouter();
const { importing, exporting, progress, importData, exportData, validateFile, detectExportType } = useDataImport();

const selectedFile = ref<File | null>(null);
const isPartialImport = ref(false);
const exportRange = ref<ExportRange>('all');
const showConfirmDialog = ref(false);
const showProgressDialog = ref(false);
const showSuccessDialog = ref(false);
const importStats = ref({
  accounts: 0,
  categories: 0,
  transactions: 0,
  budgets: 0,
});

const exportRangeOptions = computed(() => [
  { label: t('importExport.export.rangeAll'), value: 'all' },
  { label: t('importExport.export.rangeThisYear'), value: 'this-year' },
  { label: t('importExport.export.rangeThisAndLastMonth'), value: 'this-and-last-month' },
]);

const importSteps = computed(() => {
  const currentStep = progress.value.step.toLowerCase();

  const steps = [
    {
      name: t('importExport.import.steps.parsing'),
      active: currentStep.includes('parsing'),
      completed: currentStep !== 'parsing file' && progress.value.percentage > 0,
    },
    ...(!isPartialImport.value
      ? [
          {
            name: t('importExport.import.steps.clearing'),
            active: currentStep.includes('clearing'),
            completed: currentStep.includes('importing') || currentStep.includes('complete'),
          },
        ]
      : []),
    {
      name: t('importExport.import.steps.importingCategories'),
      active: currentStep.includes('categories'),
      completed: currentStep.includes('accounts') || currentStep.includes('transactions') || currentStep.includes('budgets') || currentStep.includes('complete'),
    },
    {
      name: t('importExport.import.steps.importingAccounts'),
      active: currentStep.includes('accounts'),
      completed: currentStep.includes('transactions') || currentStep.includes('budgets') || currentStep.includes('complete'),
    },
    {
      name: t('importExport.import.steps.importingTransactions'),
      active: currentStep.includes('transactions') && !currentStep.includes('complete'),
      completed: currentStep.includes('budgets') || currentStep.includes('complete'),
    },
    {
      name: t('importExport.import.steps.importingBudgets'),
      active: currentStep.includes('budgets') && !currentStep.includes('complete'),
      completed: currentStep.includes('complete'),
    },
  ];

  return steps;
});

const onFileSelect = async (event: { files: File[] }) => {
  const file = event.files[0];
  if (!file) return;

  const validation = validateFile(file);
  if (!validation.valid) {
    toast.add({
      severity: 'error',
      summary: t('importExport.import.errorInvalidFile'),
      detail: validation.error,
      life: 5000,
    });
    return;
  }

  selectedFile.value = file;
  const exportType = await detectExportType(file);
  isPartialImport.value = exportType === 'partial';

  toast.add({
    severity: 'success',
    summary: t('importExport.import.fileSelected'),
    detail: t('importExport.import.fileSelectedDetail', { name: file.name }),
    life: 3000,
  });
};

const clearFile = () => {
  selectedFile.value = null;
  isPartialImport.value = false;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const confirmImport = () => {
  if (!selectedFile.value) return;
  showConfirmDialog.value = true;
};

const handleImport = async () => {
  if (!selectedFile.value || !authStore.currentUser) return;

  showConfirmDialog.value = false;
  showProgressDialog.value = true;

  try {
    // Parse file to get stats before import
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importStats.value = {
          accounts: data.accounts?.length || 0,
          categories: data.categories?.length || 0,
          transactions: data.transactions?.length || 0,
          budgets: data.budgets?.length || 0,
        };

        await importData(selectedFile.value!, authStore.currentUser!.uid);

        showProgressDialog.value = false;
        showSuccessDialog.value = true;
        selectedFile.value = null;

        toast.add({
          severity: 'success',
          summary: t('importExport.import.successTitle'),
          detail: t('importExport.import.successDetail'),
          life: 5000,
        });
      } catch (error) {
        showProgressDialog.value = false;
        toast.add({
          severity: 'error',
          summary: t('importExport.import.error'),
          detail: error instanceof Error ? error.message : t('importExport.import.errorDetail'),
          life: 8000,
        });
      }
    };
    reader.readAsText(selectedFile.value);
  } catch (error) {
    showProgressDialog.value = false;
    toast.add({
      severity: 'error',
      summary: t('importExport.import.error'),
      detail: error instanceof Error ? error.message : t('importExport.import.errorDetail'),
      life: 8000,
    });
  }
};

const handleSuccessClose = () => {
  showSuccessDialog.value = false;
  router.push('/app/accounts');
};

const handleExport = async () => {
  if (!authStore.currentUser) return;

  try {
    await exportData(authStore.currentUser.uid, exportRange.value);
    toast.add({
      severity: 'success',
      summary: t('importExport.export.success'),
      detail: t('importExport.export.successDetail'),
      life: 5000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('importExport.export.error'),
      detail: error instanceof Error ? error.message : t('importExport.export.errorDetail'),
      life: 8000,
    });
  }
};

// Watch for import completion
watch(importing, (newValue) => {
  if (!newValue && showProgressDialog.value && progress.value.step.includes('complete')) {
    setTimeout(() => {
      showProgressDialog.value = false;
    }, 1000);
  }
});
</script>
