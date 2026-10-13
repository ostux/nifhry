<template>
  <Card :pt="{ root: 'grow' }">
    <template #content>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ title || $t('budgets.budgetSummary') }}</h3>

          <Button
            :label="$t('budgets.viewBudgets')"
            icon="pi pi-arrow-right"
            text
            size="small"
            @click="navigateToBudgets"
          />
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex justify-center py-4"
        >
          <ProgressSpinner
            style="width: 32px; height: 32px"
            stroke-width="4"
          />
        </div>

        <!-- Budget Status List -->
        <div
          v-else-if="budgetStatuses.length > 0"
          class="space-y-3"
        >
          <!-- Total Summary -->
          <div class="border-surface-200 dark:border-surface-700 space-y-1 border-b pb-3">
            <div class="flex items-center justify-between">
              <span class="text-base font-semibold">{{ $t('budgets.totalPlannedExpenses') }}</span>
              <span class="text-base font-bold"> {{ formatCurrency(totalActual) }} / {{ formatCurrency(totalBudgeted) }} </span>
            </div>
            <ProgressBar
              :value="Math.min(totalPercentage, 100)"
              :show-value="false"
              :pt="{
                value: {
                  style: getTotalProgressBarStyle(),
                },
              }"
            />
            <div class="text-surface-500 flex items-center justify-between text-xs">
              <span>{{ $t('budgets.spent') }}: {{ totalPercentage.toFixed(0) }}%</span>
              <span
                v-if="totalRemaining !== 0"
                :class="totalRemaining > 0 ? 'text-teal-600' : 'text-pink-600'"
              >
                {{ totalRemaining > 0 ? $t('budgets.remaining') : $t('budgets.over') }}:
                {{ formatCurrency(Math.abs(totalRemaining)) }}
              </span>
            </div>
          </div>

          <div
            v-for="status in sortedBudgetStatuses"
            :key="status.categoryId"
            class="space-y-1"
          >
            <div class="flex items-center justify-between text-sm">
              <span
                class="cursor-pointer font-medium hover:text-primary hover:underline"
                @click="navigateToCategory(status.categoryId)"
              >{{ status.categoryName }}</span>
              <span class="font-medium">{{ status.categoryDescription }}</span>
              <span
                :class="getStatusColor(status)"
                class="font-semibold"
              >
                {{ formatCurrency(status.actual) }} / {{ formatCurrency(status.budgeted) }}
              </span>
            </div>
            <ProgressBar
              :value="Math.ceil(Math.min(status.percentage, 100))"
              :show-value="false"
              :pt="{
                value: {
                  style: getProgressBarStyle(status),
                },
              }"
            />
            <div class="text-surface-500 flex items-center justify-between text-xs">
              <span
                >{{ status.type === 'income' ? $t('budgets.earned') : $t('budgets.spent') }}:
                {{ status.percentage.toFixed(0) }}%</span
              >
              <span
                v-if="status.remaining !== 0"
                :class="status.remaining > 0 ? 'text-teal-600' : 'text-pink-600'"
              >
                {{ status.remaining > 0 ? $t('budgets.remaining') : $t('budgets.over') }}:
                {{ formatCurrency(Math.abs(status.remaining)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="text-surface-500 py-4 text-center"
        >
          <p class="mb-2">{{ $t('budgets.noBudgetsSet') }}</p>
          <Button
            :label="$t('budgets.createBudget')"
            icon="pi pi-plus"
            size="small"
            @click="navigateToBudgets"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { BudgetStatus } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const props = defineProps<{
  budgetStatuses: BudgetStatus[];
  loading: boolean;
  title?: string;
}>();

const router = useRouter();

// Sort budget statuses alphabetically by category name
const sortedBudgetStatuses = computed(() => {
  return [...props.budgetStatuses].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
});

// Computed totals (only for expense budgets)
const totalBudgeted = computed(() => {
  return props.budgetStatuses.filter((status) => status.type === 'expense').reduce((sum, status) => sum + status.budgeted, 0);
});

const totalActual = computed(() => {
  return props.budgetStatuses.filter((status) => status.type === 'expense').reduce((sum, status) => sum + status.actual, 0);
});

const totalRemaining = computed(() => {
  return totalBudgeted.value - totalActual.value;
});

const totalPercentage = computed(() => {
  if (totalBudgeted.value === 0) {
    // If budget is 0 but there are actual expenses, show 100% (over budget)
    return totalActual.value > 0 ? 100 : 0;
  }
  return (totalActual.value / totalBudgeted.value) * 100;
});

const getStatusColor = (status: BudgetStatus): string => {
  if (status.type === 'income') {
    // For income: green if earning well, yellow if below target, red if far below
    if (status.percentage >= 80) return 'text-teal-600';
    if (status.percentage >= 50) return 'text-orange-600';
    return 'text-pink-600';
  } else {
    // For expenses: green if under budget, yellow if near limit, red if over
    if (status.percentage <= 80) return 'text-teal-600';
    if (status.percentage > 80 && status.percentage < 99) return 'text-orange-600';
    return 'text-pink-600';
  }
};

const getProgressBarStyle = (status: BudgetStatus): string => {
  if (status.type === 'income') {
    // For income: green if earning well, yellow if below target, red if far below
    if (status.percentage >= 80) return 'background: teal';
    if (status.percentage >= 50) return 'background: orange';
    return 'background: pink';
  } else {
    // For expenses: green until 80%, orange from 80% to 100%, red only if over budget
    if (status.percentage < 80) return 'background: teal';
    if (status.percentage <= 100) return 'background: orange';
    return 'background: crimson';
  }
};

const getTotalProgressBarStyle = (): string => {
  // For total (expenses): green if under budget, yellow if near limit, red if over
  if (totalPercentage.value <= 80) return 'background: teal';
  if (totalPercentage.value <= 100) return 'background: orange';
  return 'background: crimson';
};

const navigateToBudgets = () => {
  router.push('/app/budgets');
};

const navigateToCategory = (categoryId: string) => {
  router.push(`/app/category/details/${categoryId}`);
};
</script>
