<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="getDialogTitle()"
    :style="{ width: '50rem' }"
    @hide="handleClose"
    maximizable
    :pt="{
      root: 'max-w-screen',
    }"
  >
    <div class="space-y-4 pb-8">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center py-8"
      >
        <ProgressSpinner
          style="width: 50px; height: 50px"
          stroke-width="4"
        />
      </div>

      <!-- Content (only shown when not loading) -->
      <div v-else>
        <!-- Period Selector (hidden for default budget) -->
        <div class="flex flex-col justify-between lg:flex-row lg:flex-nowrap">
          <div
            v-if="!isDefaultMode"
            class="flex grow flex-col gap-2 lg:mr-4"
          >
            <label
              for="period"
              class="font-semibold"
            >
              {{ $t('budgets.selectPeriod') }}
            </label>
            <DatePicker
              id="period"
              v-model="selectedMonth"
              view="month"
              date-format="mm/yy"
              :disabled="isEditMode"
              fluid
            />
          </div>
          <div class="self-end">
            <Button
              v-if="!isDefaultMode"
              type="button"
              :label="$t('budgets.applyDefaults')"
              severity="help"
              outlined
              icon="pi pi-copy"
              :disabled="!defaultBudgetExists"
              @click="handleApplyDefaults"
            />
          </div>
        </div>

        <!-- Correction Warning Message -->
        <Message
          v-if="hasAnyCorrections"
          severity="warn"
          :closable="false"
          class="my-4"
        >
          <div class="flex flex-col gap-2">
            <div class="font-semibold">
              <i class="pi pi-exclamation-triangle mr-2" />
              {{ $t('budgets.correctionsExistTitle') }}
            </div>
            <div class="text-sm">
              {{ $t('budgets.correctionsExistMessage') }}
            </div>
          </div>
        </Message>

        <!-- Budget Table -->
        <div class="overflow-y-auto">
          <DataTable
            v-model:expandedRows="expandedRows"
            :value="budgetRows"
            striped-rows
            selectAll
          >
            <!-- Expander Column -->
            <Column
              expander
              style="width: 3rem"
            />

            <Column
              field="included"
              style="min-width: 80px"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="allSelected"
                    :binary="true"
                  />
                  <span>{{ $t('budgets.included') }}</span>
                </div>
              </template>
              <template #body="{ data }">
                <Checkbox
                  v-model="data.included"
                  :binary="true"
                />
              </template>
            </Column>
            <Column
              field="categoryName"
              :header="$t('budgets.category')"
              style="min-width: 200px"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i
                    v-if="data.items.some((item: BudgetItem) => item.type === 'correction')"
                    class="pi pi-exclamation-triangle text-amber-500"
                    v-tooltip.top="$t('budgets.correctionsExistTitle')"
                  />
                  <span>{{ data.categoryName }}</span>
                </div>
              </template>
            </Column>
            <Column
              field="type"
              :header="$t('budgets.type')"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                <Select
                  v-model="data.type"
                  :options="typeOptions"
                  option-label="label"
                  option-value="value"
                  fluid
                />
              </template>
            </Column>
            <Column
              field="amount"
              :header="$t('budgets.amount')"
              style="min-width: 150px"
            >
              <template #body="{ data }">
                <InputNumber
                  :model-value="calculateCategoryTotal(data.items)"
                  mode="currency"
                  currency="GBP"
                  locale="en-GB"
                  :disabled="true"
                  fluid
                />
              </template>
            </Column>

            <!-- Expansion Template for Items -->
            <template #expansion="{ data }">
              <div class="bg-surface-50 dark:bg-surface-800 p-4">
                <h4 class="mb-3 font-semibold">{{ $t('budgets.items.title') }}</h4>

                <!-- Items Table -->
                <div
                  v-if="data.items.length > 0"
                  class="mb-3"
                >
                  <DataTable
                    :value="data.items"
                    size="small"
                  >
                    <Column
                      field="name"
                      :header="$t('budgets.items.itemName')"
                      style="min-width: 200px"
                    >
                      <template #body="{ data: item }">
                        <div class="flex items-center gap-2">
                          <InputText
                            v-model="item.name"
                            :placeholder="$t('budgets.items.itemNamePlaceholder')"
                            :disabled="item.type === 'correction'"
                            :class="{
                              'bg-amber-50 dark:bg-amber-900/20': item.type === 'correction',
                            }"
                            fluid
                          />
                          <Tag
                            v-if="item.type === 'correction'"
                            :value="$t('budgets.items.autoGenerated')"
                            severity="warn"
                            icon="pi pi-exclamation-triangle"
                          />
                        </div>
                      </template>
                    </Column>

                    <Column
                      field="amount"
                      :header="$t('budgets.items.itemAmount')"
                      style="min-width: 150px"
                    >
                      <template #body="{ data: item }">
                        <InputNumber
                          v-model="item.amount"
                          mode="currency"
                          currency="GBP"
                          locale="en-GB"
                          :min="item.type === 'correction' ? undefined : 0"
                          :disabled="item.type === 'correction'"
                          :class="{
                            'border-2 border-amber-500': item.type === 'correction',
                            'bg-amber-50 dark:bg-amber-900/20': item.type === 'correction',
                          }"
                          fluid
                        />
                      </template>
                    </Column>

                    <Column style="width: 8rem">
                      <template #body="{ data: item, index }">
                        <div class="flex gap-1">
                          <Button
                            v-if="item.type === 'correction'"
                            icon="pi pi-check"
                            severity="success"
                            text
                            v-tooltip.top="$t('budgets.items.convertToItem')"
                            @click="convertCorrectionToItem(data, index)"
                          />
                          <Button
                            :icon="item.type === 'correction' ? 'pi pi-times' : 'pi pi-trash'"
                            :severity="item.type === 'correction' ? 'warn' : 'danger'"
                            text
                            v-tooltip.top="
                              item.type === 'correction' ? $t('budgets.items.deleteCorrection') : $t('budgets.items.deleteItem')
                            "
                            @click="removeItem(data, index)"
                          />
                        </div>
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <!-- Empty state -->
                <div
                  v-else
                  class="text-surface-500 mb-3 py-2 text-sm"
                >
                  {{ $t('budgets.items.noItems') }}
                </div>

                <!-- Add Item Button -->
                <Button
                  :label="$t('budgets.items.addItem')"
                  icon="pi pi-plus"
                  size="small"
                  outlined
                  @click="addItem(data)"
                />
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Actions -->
        <div class="flex justify-between gap-2">
          <div class="flex gap-2">
            <Button
              v-if="budgetExists && !isDefaultMode"
              type="button"
              :label="$t('budgets.deleteBudget')"
              severity="danger"
              outlined
              icon="pi pi-trash"
              :loading="isDeleting"
              @click="handleDelete"
            />
          </div>
          <div class="flex gap-2">
            <Button
              type="button"
              :label="$t('common.cancel')"
              severity="secondary"
              @click="handleClose"
            />
            <Button
              type="button"
              :label="hasAnyCorrections ? $t('budgets.resolveCorrectionsFirst') : $t('common.save')"
              :loading="isSubmitting"
              :disabled="!canSave"
              severity="primary"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useBudgetStore } from '@/stores/budget';
import { useCategoryStore } from '@/stores/category';
import type { BudgetDoc, BudgetItem, BudgetType } from '@/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import moment from 'moment';

const props = defineProps<{
  visible: boolean;
  period?: string;
  mode?: 'add' | 'edit' | 'default';
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  saved: [];
}>();

const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isSubmitting = ref(false);
const isDeleting = ref(false);
const isLoading = ref(false);

// Calculate default month (next month for add mode, current period for edit mode)
const getDefaultMonth = (): Date => {
  if (props.mode === 'add') {
    return moment().add(1, 'month').startOf('month').toDate();
  }
  if (props.period) {
    return moment(props.period, 'YYYY-MM').toDate();
  }
  return moment().toDate();
};

const selectedMonth = ref(getDefaultMonth());
const budgetExists = ref(false);
const isEditMode = computed(() => props.mode === 'edit');
const isDefaultMode = computed(() => props.mode === 'default');
const defaultBudgetExists = ref(false);

// Convert selectedMonth to period string (YYYY-MM format)
const selectedPeriod = computed(() => moment(selectedMonth.value).format('YYYY-MM'));

interface BudgetRow {
  categoryId: string;
  categoryName: string;
  amount: number;
  type: BudgetType;
  included: boolean;
  items: BudgetItem[];
}

const budgetRows = ref<BudgetRow[]>([]);
const expandedRows = ref<BudgetRow[]>([]);

// Select All state
const allSelected = computed({
  get: () => budgetRows.value.length > 0 && budgetRows.value.every((row) => row.included),
  set: (value: boolean) => {
    budgetRows.value.forEach((row) => {
      row.included = value;
    });
  },
});

const typeOptions = computed(() => [
  { label: t('budgets.expense'), value: 'expense' },
  { label: t('budgets.income'), value: 'income' },
]);

// Check if any category has correction items
const hasAnyCorrections = computed(() => {
  return budgetRows.value.some((row) => row.items.some((item) => item.type === 'correction'));
});

// Can only save if no correction items exist
const canSave = computed(() => !hasAnyCorrections.value);

function formatPeriod(period: string): string {
  return moment(period, 'YYYY-MM').format('MMMM YYYY');
}

function getDialogTitle(): string {
  if (isDefaultMode.value) {
    return t('budgets.defaultBudget');
  }
  if (isEditMode.value) {
    return t('budgets.editBudgetFor', { period: formatPeriod(selectedPeriod.value) });
  }
  return t('budgets.addBudget');
}

// Calculate total amount from items
const calculateCategoryTotal = (items: BudgetItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};

// Add item to category (only user-type items)
const addItem = (row: BudgetRow) => {
  row.items.push({ name: '', amount: 0, type: 'user' });
};

// Remove item from category
const removeItem = (row: BudgetRow, index: number) => {
  row.items.splice(index, 1);
};

// Convert correction item to user item
const convertCorrectionToItem = (row: BudgetRow, index: number) => {
  const correctionItem = row.items[index];
  if (!correctionItem || correctionItem.type !== 'correction') return;

  // Replace correction item with user item using category name as default
  row.items[index] = {
    name: row.categoryName,
    amount: correctionItem.amount,
    type: 'user',
  };
};

const loadBudgetData = async () => {
  if (!authStore.currentUser) return;

  isLoading.value = true;

  try {
    // For default mode, use 'default' as the period
    const period = isDefaultMode.value ? 'default' : selectedPeriod.value;

    // Fetch budget for selected period
    const budgetDoc = await budgetStore.fetchBudget(authStore.currentUser.uid, period);

    // Check if budget exists (has any categories with budgets)
    budgetExists.value = Object.keys(budgetDoc).length > 0;

    // Also check if default budget exists (for Apply Defaults button)
    if (!isDefaultMode.value) {
      const defaultDoc = await budgetStore.fetchBudget(authStore.currentUser.uid, 'default');
      defaultBudgetExists.value = Object.keys(defaultDoc).length > 0;
    }

    // Create rows for all categories
    budgetRows.value = categoryStore.categories.map((category) => {
      const budget = budgetDoc[category.id];
      return {
        categoryId: category.id,
        categoryName: category.name,
        amount: budget?.amount || 0,
        type: budget?.type || 'expense',
        included: budget !== undefined, // Default to included if budget exists
        items: (budget?.items || []).map((item) => ({
          ...item,
          type: item.type || 'user', // Default old items to 'user' type
        })),
      };
    });

    // Auto-expand rows that have correction items
    expandedRows.value = budgetRows.value.filter((row) => row.items.some((item) => item.type === 'correction'));
  } finally {
    isLoading.value = false;
  }
};

const handleApplyDefaults = async () => {
  if (!authStore.currentUser) return;

  try {
    // Fetch default budget
    const defaultDoc = await budgetStore.fetchBudget(authStore.currentUser.uid, 'default');

    // Apply default budget to current rows
    budgetRows.value = categoryStore.categories.map((category) => {
      const defaultBudget = defaultDoc[category.id];
      return {
        categoryId: category.id,
        categoryName: category.name,
        amount: defaultBudget?.amount || 0,
        type: defaultBudget?.type || 'expense',
        included: defaultBudget !== undefined,
        items: defaultBudget?.items ? JSON.parse(JSON.stringify(defaultBudget.items)) : [], // Deep copy
      };
    });

    toast.add({
      severity: 'success',
      summary: t('budgets.defaultsApplied'),
      life: 3000,
    });
  } catch (error) {
    console.error('Error applying defaults:', error);
    toast.add({
      severity: 'error',
      summary: t('budgets.errors.applyDefaultsFailed'),
      life: 3000,
    });
  }
};

const handleSubmit = async () => {
  if (!authStore.currentUser) return;

  isSubmitting.value = true;

  try {
    // Build budget document from rows
    const budgetDoc: BudgetDoc = {};

    budgetRows.value.forEach((row) => {
      if (row.included) {
        // Calculate amount from items
        const calculatedAmount = calculateCategoryTotal(row.items);

        budgetDoc[row.categoryId] = {
          amount: calculatedAmount,
          type: row.type,
          items: row.items,
        };
      }
    });

    // For default mode, use 'default' as the period
    const period = isDefaultMode.value ? 'default' : selectedPeriod.value;

    // If budget is empty, delete it instead of saving empty document
    if (Object.keys(budgetDoc).length === 0) {
      if (budgetExists.value) {
        await budgetStore.deleteBudget(authStore.currentUser.uid, period);
      }
    } else {
      await budgetStore.updateBudget(authStore.currentUser.uid, period, budgetDoc);
    }

    toast.add({
      severity: 'success',
      summary: t('budgets.budgetSaved'),
      life: 3000,
    });

    emit('saved');
    handleClose();
  } catch (error) {
    console.error('Error saving budget:', error);
    toast.add({
      severity: 'error',
      summary: t('budgets.errors.saveFailed'),
      life: 3000,
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async () => {
  if (!authStore.currentUser) return;

  const period = isDefaultMode.value ? 'default' : selectedPeriod.value;
  const message = isDefaultMode.value
    ? t('budgets.confirmDeleteDefault')
    : t('budgets.confirmDelete', { period: formatPeriod(selectedPeriod.value) });

  confirm.require({
    message,
    header: t('budgets.deleteBudget'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: t('common.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('common.delete'),
      severity: 'danger',
    },
    accept: async () => {
      isDeleting.value = true;

      try {
        await budgetStore.deleteBudget(authStore.currentUser!.uid, period);

        toast.add({
          severity: 'success',
          summary: t('budgets.budgetDeleted'),
          life: 3000,
        });

        emit('saved');
        handleClose();
      } catch (error) {
        console.error('Error deleting budget:', error);
        toast.add({
          severity: 'error',
          summary: t('budgets.errors.deleteFailed'),
          life: 3000,
        });
      } finally {
        isDeleting.value = false;
      }
    },
  });
};

const handleClose = () => {
  isVisible.value = false;
};

// Watch for month changes
watch(selectedMonth, () => {
  loadBudgetData();
});

// Load data when dialog opens
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      selectedMonth.value = getDefaultMonth();
      loadBudgetData();
    }
  },
);

// Update month when props change (edit mode)
watch(
  () => props.period,
  (newPeriod) => {
    if (newPeriod && props.mode === 'edit') {
      selectedMonth.value = moment(newPeriod, 'YYYY-MM').toDate();
    }
  },
  { immediate: true },
);
</script>
