<template>
  <div class="container mx-auto p-4">
    <div class="mb-4 flex flex-col items-center justify-between md:flex-row">
      <h1 class="mb-4 grow self-start text-2xl font-bold md:mb-0">{{ $t('budgets.title') }}</h1>
      <div class="flex gap-2">
        <Button
          v-if="defaultBudgetExists"
          :label="$t('budgets.editDefaultBudget')"
          icon="pi pi-file-edit"
          severity="help"
          outlined
          @click="openDefaultDialog"
        />
        <Button
          v-else
          :label="$t('budgets.createDefaultBudget')"
          icon="pi pi-file-plus"
          severity="help"
          outlined
          @click="openDefaultDialog"
        />
        <Button
          v-if="!noBudgetsExist"
          :label="$t('budgets.addBudget')"
          icon="pi pi-plus"
          @click="openAddDialog"
        />
        <Button
          v-if="!noBudgetsExist"
          :label="$t('budgets.editBudget')"
          icon="pi pi-pencil"
          severity="secondary"
          :disabled="!selectedBudgetRows || selectedBudgetRows.length !== 1"
          @click="openEditDialog"
        />
        <Button
          v-if="!noBudgetsExist"
          :label="$t('budgets.deleteSelected')"
          icon="pi pi-trash"
          severity="danger"
          :disabled="!selectedBudgetRows || selectedBudgetRows.length === 0"
          @click="confirmDeleteBudgets"
        />
        <Button
          v-else
          :label="$t('budgets.createBudget')"
          icon="pi pi-plus"
          @click="openAddDialog"
        />
      </div>
    </div>

    <div
      v-if="budgetStore.loading"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <div v-else>
      <!-- No budgets message -->
      <Card v-if="noBudgetsExist">
        <template #content>
          <div class="text-surface-500 py-8 text-center">
            <i class="pi pi-inbox mb-3 text-4xl" />
            <p class="text-lg">{{ $t('budgets.noBudgetsSet') }}</p>
            <p class="text-sm">{{ $t('budgets.createFirstBudget') }}</p>
          </div>
        </template>
      </Card>

      <!-- Budget Table -->
      <Card
        v-else
        :pt="{ body: 'p-0!' }"
      >
        <template #content>
          <DataTable
            v-model:selection="selectedBudgetRows"
            :value="budgetTableData"
            data-key="periodKey"
            striped-rows
            :row-hover="true"
            scrollable
            scroll-height="70vh"
          >
            <Column
              selection-mode="multiple"
              frozen
              header-style="width: 3rem"
            />
            <Column
              field="period"
              :header="$t('budgets.table.period')"
              frozen
              style="min-width: 150px"
            >
              <template #body="{ data }">
                <div class="font-semibold">{{ data.period }}</div>
              </template>
            </Column>

            <Column
              v-for="category in categoryStore.categories"
              :key="category.id"
              :field="category.id"
              :header="category.name"
              style="min-width: 150px"
            >
              <template #body="{ data }">
                <div
                  v-if="editingCell?.period === data.periodKey && editingCell?.categoryId === category.id"
                  @click.stop
                >
                  <InputNumber
                    :model-value="data[category.id]?.amount || 0"
                    mode="currency"
                    currency="GBP"
                    locale="en-GB"
                    class="w-full"
                    :autofocus="true"
                    @update:model-value="(value) => saveBudgetCell(data.periodKey, category.id, value || 0)"
                    @blur="editingCell = null"
                    @keydown.enter="editingCell = null"
                    @keydown.escape="editingCell = null"
                    fluid
                  />
                </div>
                <div
                  v-else
                  @click="editingCell = { period: data.periodKey, categoryId: category.id }"
                  class="cursor-pointer"
                >
                  <div
                    v-if="data[category.id]"
                    class="text-center"
                    :class="{
                      'text-amber-600 dark:text-amber-400': hasCorrection(data[category.id]),
                    }"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span class="font-semibold">{{ formatCurrency(data[category.id].amount) }}</span>
                      <i
                        v-if="hasCorrection(data[category.id])"
                        class="pi pi-exclamation-triangle text-amber-500"
                        v-tooltip.top="$t('budgets.hasCorrection')"
                      />
                    </div>
                    <div class="text-surface-500 text-xs">
                      {{ data[category.id].type === 'income' ? $t('budgets.income') : $t('budgets.expense') }}
                      <span v-if="data[category.id].items?.length > 0">
                        · {{ $t('budgets.items.itemCount', { count: data[category.id].items.length }) }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-else
                    class="text-surface-400 text-center"
                  >
                    {{ $t('budgets.clickToAdd') }}
                  </div>
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteConfirmDialog"
      :header="$t('budgets.deleteConfirmTitle')"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3 mb-4">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500" />
        <div>
          <p class="mb-2">
            {{ $t('budgets.deleteConfirmMessage', { count: selectedBudgetRows?.length || 0 }, selectedBudgetRows?.length || 0) }}
          </p>
          <p class="text-surface-500 text-sm">
            {{ $t('budgets.deleteConfirmWarning') }}
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          :label="$t('common.cancel')"
          icon="pi pi-times"
          text
          @click="showDeleteConfirmDialog = false"
        />
        <Button
          :label="$t('budgets.deleteButton')"
          icon="pi pi-trash"
          severity="danger"
          :loading="deletingBudgets"
          @click="deleteBudgets"
        />
      </template>
    </Dialog>

    <!-- Budget Edit Dialog -->
    <BudgetEditDialog
      v-model:visible="showEditDialog"
      :period="selectedPeriod"
      :mode="dialogMode"
      @saved="handleBudgetSaved"
    />
  </div>
</template>

<script setup lang="ts">
import BudgetEditDialog from '@/components/budget/BudgetEditDialog.vue';
import { useAuthStore } from '@/stores/auth';
import { useBudgetStore } from '@/stores/budget';
import { useCategoryStore } from '@/stores/category';
import { formatCurrency } from '@/utils/currency';
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import type { CategoryBudget } from '@/types';

interface BudgetTableRow {
  period: string;
  periodKey: string;
  [categoryId: string]: unknown;
}

const authStore = useAuthStore();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();

const showEditDialog = ref(false);
const showDeleteConfirmDialog = ref(false);
const selectedPeriod = ref<string>('');
const dialogMode = ref<'add' | 'edit' | 'default'>('edit');
const periods = ref<string[]>([]);
const selectedBudgetRows = ref<BudgetTableRow[]>([]);
const defaultBudgetExists = ref(false);
const editingCell = ref<{ period: string; categoryId: string } | null>(null);
const deletingBudgets = ref(false);

// Format period for display (YYYY-MM -> Month Year)
const formatPeriod = (period: string): string => {
  return moment(period, 'YYYY-MM').format('MMMM YYYY');
};

// Create table data: rows = periods, columns = categories
const budgetTableData = computed(() => {
  return periods.value
    .filter((period) => period !== 'default') // Exclude default budget from table
    .map((period) => {
      const budgetDoc = budgetStore.budgets.get(period) || {};
      const row: BudgetTableRow = {
        period: formatPeriod(period),
        periodKey: period,
      };

      // Add budget for each category
      categoryStore.categories.forEach((category) => {
        row[category.id] = budgetDoc[category.id] || null;
      });

      return row;
    });
});

const noBudgetsExist = computed(() => periods.value.length === 0);

// Check if a category budget has correction items
const hasCorrection = (categoryBudget: CategoryBudget): boolean => {
  return categoryBudget.items?.some((item) => item.type === 'correction') || false;
};

// Save budget cell when inline editing
const saveBudgetCell = async (period: string, categoryId: string, newAmount: number) => {
  if (!authStore.currentUser) return;

  const currentBudget = budgetStore.budgets.get(period)?.[categoryId];
  const currentAmount = currentBudget?.amount || 0;
  const items = currentBudget?.items || [];

  // Case 1: Amount unchanged - do nothing
  if (newAmount === currentAmount) return;

  // Case 2: Amount set to 0 - clear everything
  if (newAmount === 0) {
    await budgetStore.updateCategoryBudget(authStore.currentUser.uid, period, categoryId, {
      amount: 0,
      type: currentBudget?.type || 'expense',
      items: [],
    });
    await loadBudgets();
    return;
  }

  // Case 3 & 4: Calculate difference and add correction item
  const difference = newAmount - currentAmount;

  // Remove existing correction items first
  const itemsWithoutCorrection = items.filter((item) => item.type !== 'correction');

  // Always add correction item (user must resolve it in dialog)
  const updatedItems = [
    ...itemsWithoutCorrection,
    {
      name: 'Correction',
      amount: difference,
      type: 'correction' as const,
    },
  ];

  await budgetStore.updateCategoryBudget(authStore.currentUser.uid, period, categoryId, {
    amount: newAmount,
    type: currentBudget?.type || 'expense',
    items: updatedItems,
  });

  await loadBudgets();
};

// formatCurrency is imported from @/utils/currency

const openAddDialog = () => {
  dialogMode.value = 'add';
  selectedPeriod.value = ''; // Will be set to next month by dialog
  showEditDialog.value = true;
};

const openEditDialog = () => {
  if (!selectedBudgetRows.value || selectedBudgetRows.value.length !== 1) return;
  const selectedRow = selectedBudgetRows.value[0];
  if (!selectedRow) return;
  dialogMode.value = 'edit';
  selectedPeriod.value = selectedRow.periodKey;
  showEditDialog.value = true;
};

const confirmDeleteBudgets = () => {
  if (!selectedBudgetRows.value || selectedBudgetRows.value.length === 0) return;
  showDeleteConfirmDialog.value = true;
};

const deleteBudgets = async () => {
  if (!authStore.currentUser || !selectedBudgetRows.value || selectedBudgetRows.value.length === 0) return;

  deletingBudgets.value = true;

  try {
    // Delete all selected budgets
    const deletePromises = selectedBudgetRows.value.map((row) =>
      budgetStore.deleteBudget(authStore.currentUser!.uid, row.periodKey)
    );

    await Promise.all(deletePromises);

    // Clear selection and refresh
    selectedBudgetRows.value = [];
    await loadBudgets();

    showDeleteConfirmDialog.value = false;
  } catch (error) {
    console.error('Error deleting budgets:', error);
  } finally {
    deletingBudgets.value = false;
  }
};

const openDefaultDialog = () => {
  dialogMode.value = 'default';
  selectedPeriod.value = 'default';
  showEditDialog.value = true;
};

const handleBudgetSaved = () => {
  // Refresh budget data after saving
  loadBudgets();
};

const loadBudgets = async () => {
  if (!authStore.currentUser) return;

  // Fetch all budget periods from database
  periods.value = await budgetStore.fetchAllBudgets(authStore.currentUser.uid);

  // Check if default budget exists
  const defaultDoc = await budgetStore.fetchBudget(authStore.currentUser.uid, 'default');
  defaultBudgetExists.value = Object.keys(defaultDoc).length > 0;
};

// Watch budgetTableData to set default selection
watch(
  budgetTableData,
  (newData) => {
    if (newData.length > 0 && selectedBudgetRows.value.length === 0) {
      // Default to current month or first period
      const currentPeriod = moment().format('YYYY-MM');
      const currentRow = newData.find((row: BudgetTableRow) => row.periodKey === currentPeriod);
      const defaultRow = currentRow || newData[0];
      if (defaultRow) {
        selectedBudgetRows.value = [defaultRow];
      }
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await loadBudgets();
});
</script>
