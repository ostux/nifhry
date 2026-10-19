<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>
      <p class="text-surface-600 dark:text-surface-400 text-sm">
        {{ $t('dashboard.subtitle') }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <!-- Dashboard Content -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Financial Overview Section -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">{{ $t('dashboard.financialOverview') }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <!-- Accessible Amount Card -->
          <DashboardCard
            :label="$t('dashboard.accessibleAmount')"
            icon="pi-money-bill"
            icon-color="text-green-500"
            :icon-tooltip="$t('dashboard.tooltips.accessibleAmount')"
            border-color="border-green-500"
            :values="{
              text: formatCurrency(accessibleAmount),
              subtext: formatSecondaryCurrency(accessibleAmount),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.liquidFunds')"
          />


          <!-- Total Assets Card -->
          <DashboardCard
            :label="$t('dashboard.totalAssets')"
            icon="pi-chart-line"
            icon-color="text-teal-500"
            :icon-tooltip="$t('dashboard.tooltips.totalAssets')"
            border-color="border-teal-500"
            :values="{
              text: formatCurrency(totalAssets),
              subtext: formatSecondaryCurrency(totalAssets),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.debitsAndSavings')"
          />

          <!-- Net Worth Card -->
          <DashboardCard
            :label="$t('dashboard.netWorth')"
            icon="pi-wallet"
            icon-color="text-blue-500"
            :icon-tooltip="$t('dashboard.tooltips.netWorth')"
            border-color="border-blue-500"
            :values="{
              text: formatCurrency(netWorth),
              subtext: formatSecondaryCurrency(netWorth),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :change="netWorthChange"
            :change-text="`${formatCurrency(Math.abs(netWorthChange))} (1mo)`"
          />

          <!-- Investment Portfolio Card -->
          <DashboardCard
            v-if="accountsByKind.investment !== 0"
            :label="$t('dashboard.investment')"
            icon="pi-chart-bar"
            icon-color="text-emerald-500"
            :icon-tooltip="$t('dashboard.tooltips.investment')"
            border-color="border-emerald-500"
            :values="{
              text: formatCurrency(investedAmount),
              subtext: formatSecondaryCurrency(investedAmount),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :change="investmentProfitLoss"
            :change-text="`${formatCurrency(Math.abs(investmentProfitLoss))} (${CASH_FLOW_MONTHS}mo)`"
          />

          <!-- Total Liabilities Card -->
          <DashboardCard
            v-if="totalLiabilities >= 0.01"
            :label="$t('dashboard.totalLiabilities')"
            icon="pi-exclamation-triangle"
            icon-color="text-orange-500"
            :icon-tooltip="$t('dashboard.tooltips.totalLiabilities')"
            border-color="border-orange-500"
            :values="{
              text: formatCurrency(totalLiabilities),
              subtext: formatSecondaryCurrency(totalLiabilities),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.creditsAndLoans')"
          />

          <!-- Active Accounts Card -->
          <DashboardCard
            :label="$t('dashboard.activeAccounts')"
            icon="pi-credit-card"
            icon-color="text-purple-500"
            :icon-tooltip="$t('dashboard.tooltips.activeAccounts')"
            border-color="border-purple-500"
            :values="{ text: String(accountStats.active) }"
            :subtitle="`${accountStats.closed} ${$t('dashboard.closed')} · ${accountStats.archived} ${$t('dashboard.archived')} · ${accountStats.total} ${$t('dashboard.total')}`"
          />
        </div>
      </div>

      <!-- Account Breakdown Section -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">{{ $t('dashboard.accountBreakdown') }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <!-- Debit Accounts -->
          <DashboardCard
            border-color="border-teal-300"
            :values="{
              text: formatCurrency(accountsByKind.debit),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.debit),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.debit }, accountCountByKind.debit)"
            :card-pt="{ root: 'border border-teal-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-teal-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.debit') }}</span>
              </div>
            </template>
          </DashboardCard>

          <!-- Savings Accounts -->
          <DashboardCard
            border-color="border-sky-300"
            :values="{
              text: formatCurrency(accountsByKind.saving),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.saving),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.saving }, accountCountByKind.saving)"
            :card-pt="{ root: 'border border-sky-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-sky-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.saving') }}</span>
              </div>
            </template>
          </DashboardCard>


          <!-- Investment Accounts -->
          <DashboardCard
            border-color="border-etoro-300"
            :values="{
              text: formatCurrency(accountsByKind.investment),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.investment),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.investment }, accountCountByKind.investment)"
            :card-pt="{ root: 'border border-etoro-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-etoro-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.investment') }}</span>
              </div>
            </template>
          </DashboardCard>

          <!-- Lending Accounts -->
          <DashboardCard
            v-if="Math.abs(accountsByKind.lending) >= 0.01"
            border-color="border-violet-300"
            :values="{
              text: formatCurrency(accountsByKind.lending),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.lending),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.lending }, accountCountByKind.lending)"
            :card-pt="{ root: 'border border-violet-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-violet-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.lending') }}</span>
              </div>
            </template>
          </DashboardCard>

          <!-- Credit Accounts -->
          <DashboardCard
            v-if="Math.abs(accountsByKind.credit) >= 0.01"
            border-color="border-fuchsia-300"
            :values="{
              text: formatCurrency(accountsByKind.credit),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.credit),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.credit }, accountCountByKind.credit)"
            :card-pt="{ root: 'border border-fuchsia-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-fuchsia-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.credit') }}</span>
              </div>
            </template>
          </DashboardCard>

          <!-- Loan Accounts -->
          <DashboardCard
            v-if="Math.abs(accountsByKind.loan) >= 0.01"
            border-color="border-orange-300"
            :values="{
              text: formatCurrency(accountsByKind.loan),
              class: 'text-xl',
              subtext: formatSecondaryCurrency(accountsByKind.loan),
              subtextClass: 'text-surface-500 text-xs',
            }"
            :subtitle="$t('dashboard.accounts', { n: accountCountByKind.loan }, accountCountByKind.loan)"
            :card-pt="{ root: 'border border-orange-300' }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-orange-500"></div>
                <span class="text-sm font-medium">{{ $t('dashboard.accountTypes.loan') }}</span>
              </div>
            </template>
          </DashboardCard>
        </div>
      </div>

      <!-- Cash Flow Trend Section -->
      <div>
        <h2 class="mt-4 text-xl font-semibold">{{ $t('dashboard.cashFlowTrend') }}</h2>
        <Card>
          <template #content>
            <CashFlowChart
              :data="cashFlowData"
              showPredictions
              :predictionMonths="CHART_PREDICTION_MONTHS"
              :budgetData="budgetStore.budgets"
              :liabilityPaymentCategories="settingsStore.liabilityPaymentCategories"
              :currentSavingsBalance="accountsByKind.saving"
              />
          </template>
        </Card>

        <CashFlowTable
          :historicalData="recentCashFlowData"
          :predictedData="cashFlowPredictions"
          :historicalMonths="3"
        />
      </div>

      <!-- Monthly Summary Cards Section -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold">{{ $t('dashboard.monthlySummary') }}</h2>
          <div class="flex gap-2">
            <Button
              icon="pi pi-chevron-left"
              severity="secondary"
              text
              rounded
              :disabled="canNavigateBack === false"
              @click="navigateMonths('back')"
            />
            <Button
              icon="pi pi-chevron-right"
              severity="secondary"
              text
              rounded
              :disabled="monthOffset === 0"
              @click="navigateMonths('forward')"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MonthlySummaryCard
            v-for="(month, index) in visibleMonths"
            :key="month.offset"
            :month-label="month.label"
            :income="month.income"
            :expenses="month.expenses"
            :icon-color="getMonthIconColor(index)"
          />
        </div>
      </div>

      <!-- Category Expenses Section (only shown if current month has budget, hidden on mobile) -->
      <div v-if="categoryExpensesData.labels.length > 0" class="hidden md:block">
        <h2 class="mb-4 text-xl font-semibold">{{ $t('dashboard.categoryExpenses') }}</h2>
        <Card>
          <template #content>
            <CategoryExpensesChart :data="categoryExpensesData" />
          </template>
        </Card>
      </div>

      <!-- Budget Summary Section -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold">{{ $t('dashboard.budgetSummary') }}</h2>
          <div class="flex gap-2">
            <Button
              icon="pi pi-chevron-left"
              severity="secondary"
              text
              rounded
              :disabled="canNavigateBudgetBack === false"
              @click="navigateBudgetMonths('back')"
            />
            <Button
              icon="pi pi-chevron-right"
              severity="secondary"
              text
              rounded
              :disabled="budgetMonthOffset === 0"
              @click="navigateBudgetMonths('forward')"
            />
          </div>
        </div>
        <div class="flex w-full grow flex-col md:flex-row lg:flex-nowrap">
          <BudgetSummaryCard
            v-for="month in visibleBudgetMonths"
            :key="month.offset"
            :title="month.title"
            :budget-statuses="month.budgetStatuses"
            :loading="budgetLoading"
          />
        </div>
      </div>

      <!-- Transaction Insights Section -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">{{ $t('dashboard.transactionInsights') }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- Transactions This Month -->
          <DashboardCard
            :label="$t('dashboard.transactionsThisMonth')"
            icon="pi-list"
            icon-color="text-surface-500"
            border-color="border-grey-300"
            :values="{ text: String(transactionStats.currentMonth) }"
            :subtitle="`${transactionStats.lastMonth} ${$t('dashboard.inLastMonth')}`"
            :card-pt="{ root: 'border border-grey-300' }"
          />

          <!-- Income This Month -->
          <DashboardCard
            :label="$t('dashboard.incomeThisMonth')"
            icon="pi-arrow-up"
            icon-color="text-teal-500"
            border-color="border-teal-300"
            :values="{
              text: formatCurrency(monthlyIncome),
              class: 'text-teal-600',
              subtext: formatSecondaryCurrency(monthlyIncome),
              subtextClass: 'text-teal-500 text-xs',
            }"
            :subtitle="`${formatCurrency(lastMonthIncome)} ${$t('dashboard.inLastMonth')}`"
            :card-pt="{ root: 'border border-teal-300' }"
          />

          <!-- Expenses This Month -->
          <DashboardCard
            :label="$t('dashboard.expensesThisMonth')"
            icon="pi-arrow-down"
            icon-color="text-pink-500"
            border-color="border-pink-300"
            :values="{
              text: formatCurrency(monthlyExpenses),
              class: 'text-pink-600',
              subtext: formatSecondaryCurrency(monthlyExpenses),
              subtextClass: 'text-pink-500 text-xs',
            }"
            :subtitle="`${formatCurrency(lastMonthExpenses)} ${$t('dashboard.inLastMonth')}`"
            :card-pt="{ root: 'border border-pink-300' }"
          />

          <!-- Pending Transactions -->
          <DashboardCard
            :label="$t('dashboard.pendingTransactions')"
            icon="pi-clock"
            icon-color="text-surface-500"
            border-color="border-gray-300"
            :values="{ text: String(transactionStats.pending) }"
            :subtitle="$t('dashboard.needsAttention')"
            :card-pt="{ root: 'border border-gray-300' }"
          />
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">{{ $t('dashboard.quickActions') }}</h2>
        <div class="flex flex-col flex-wrap gap-3 md:flex-row">
          <Button
            :label="$t('dashboard.actions.viewAccounts')"
            icon="pi pi-wallet"
            severity="secondary"
            outlined
            @click="navigateTo('/app/accounts')"
          />
          <Button
            :label="$t('dashboard.actions.viewTransactions')"
            icon="pi pi-list"
            severity="secondary"
            outlined
            @click="navigateTo('/app/transactions')"
          />
          <Button
            :label="$t('dashboard.actions.viewCategories')"
            icon="pi pi-tags"
            severity="secondary"
            outlined
            @click="navigateTo('/app/categories')"
          />
          <Button
            :label="$t('dashboard.actions.recalculateBalances')"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="showRecalculateDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Recalculate Balances Dialog -->
    <RecalculateBalancesDialog
      v-model:visible="showRecalculateDialog"
      @complete="onRecalculateComplete"
    />
  </div>
</template>

<script setup lang="ts">
import BudgetSummaryCard from '@/components/dashboard/BudgetSummaryCard.vue';
import CashFlowChart from '@/components/dashboard/CashFlowChart.vue';
import CashFlowTable from '@/components/dashboard/CashFlowTable.vue';
import CategoryExpensesChart from '@/components/dashboard/CategoryExpensesChart.vue';
import DashboardCard from '@/components/dashboard/DashboardCard.vue';
import MonthlySummaryCard from '@/components/dashboard/MonthlySummaryCard.vue';
import RecalculateBalancesDialog from '@/components/dashboard/RecalculateBalancesDialog.vue';
import {
  CASH_FLOW_MONTHS,
  CATEGORY_STAT_MONTHS,
  NUM_VISIBLE_MONTHS,
  NUM_VISIBLE_BUDGET_MONTHS,
  CHART_PREDICTION_MONTHS,
  TABLE_PREDICTION_MONTHS,
  RECENT_CASH_FLOW_MONTHS,
} from '@/constants/dashboard';
import { forecastCashFlow } from '@/utils/forecasting';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useBudgetStore } from '@/stores/budget';
import { useCategoryStore } from '@/stores/category';
import { useCurrenciesStore } from '@/stores/currencies';
import { useDashboardTransactionStore } from '@/stores/dashboardTransaction';
import { useSettingsStore } from '@/stores/settings';
import type { AccountKind, Transaction } from '@/types';
import { formatCurrency, formatSecondaryCurrency } from '@/utils/currency';
import { getLastMonthsRange, getMonthEnd, getMonthStart, getShortMonthLabel } from '@/utils/date';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import moment from 'moment';

const router = useRouter();
const accountStore = useAccountStore();
const currenciesStore = useCurrenciesStore();
const dashboardTransactionStore = useDashboardTransactionStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();
const budgetStore = useBudgetStore();
const settingsStore = useSettingsStore();

const loading = ref(true);
const budgetLoading = ref(false);
const showRecalculateDialog = ref(false);
const monthOffset = ref(0); // 0 = current month, 1 = one month back, etc.
const budgetMonthOffset = ref(0); // 0 = current month, 1 = one month back, etc. for budget summary


// Computed: Net Worth (converted to main currency)
const netWorth = computed(() => {
  return accountStore.activeAccounts.reduce((sum, account) => {
    return sum + currenciesStore.convertToMain(account.bal, account.cur || currenciesStore.mainCurrency);
  }, 0);
});

// Computed: Total Assets (debit + saving + lending, converted to main currency)
const totalAssets = computed(() => {
  return accountStore.activeAccounts
    .filter((account) => ['debit', 'saving'].includes(account.kind))
    .reduce((sum, account) => {
      return sum + currenciesStore.convertToMain(account.bal, account.cur || currenciesStore.mainCurrency);
    }, 0);
});

// Computed: Total Liabilities (credit + loan - they should be negative or we count as positive debt, converted to main currency)
const totalLiabilities = computed(() => {
  return Math.abs(
    accountStore.activeAccounts
      .filter((account) => ['credit', 'loan'].includes(account.kind))
      .reduce((sum, account) => {
        return sum + currenciesStore.convertToMain(account.bal, account.cur || currenciesStore.mainCurrency);
      }, 0),
  );
});

// Computed: Accessible Amount (debit + saving accounts - liquid funds available, converted to main currency)
const accessibleAmount = computed(() => {
  return accountStore.activeAccounts
    .filter((account) => ['debit'].includes(account.kind))
    .reduce((sum, account) => {
      return sum + currenciesStore.convertToMain(account.bal, account.cur || currenciesStore.mainCurrency);
    }, 0);
});

// Computed: Account stats
const accountStats = computed(() => ({
  active: accountStore.activeAccounts.length,
  closed: accountStore.closedAccounts.length,
  archived: accountStore.archivedAccounts.length,
  total: accountStore.accounts.length,
}));

// Computed: Accounts by kind (balances converted to main currency)
const accountsByKind = computed(() => {
  const kinds: Record<AccountKind, number> = {
    debit: 0,
    credit: 0,
    saving: 0,
    loan: 0,
    lending: 0,
    investment: 0,
  };

  accountStore.activeAccounts.forEach((account) => {
    kinds[account.kind] += currenciesStore.convertToMain(account.bal, account.cur || currenciesStore.mainCurrency);
  });

  return kinds;
});

// Computed: Account count by kind
const accountCountByKind = computed(() => {
  const counts: Record<AccountKind, number> = {
    debit: 0,
    credit: 0,
    saving: 0,
    loan: 0,
    lending: 0,
    investment: 0,
  };

  accountStore.activeAccounts.forEach((account) => {
    counts[account.kind]++;
  });

  return counts;
});

// Helper function to get the currency for a transaction
// Priority: transaction.cur > account.cur > mainCurrency
const getTransactionCurrency = (transaction: Transaction): string => {
  if (transaction.cur) return transaction.cur;

  const account = accountStore.accounts.find((a) => a.id === transaction.a);
  if (account?.cur) return account.cur;

  return currenciesStore.mainCurrency;
};

// Helper function to check if a transaction should be included in expense/income calculations
// Excludes opposite transactions (internal transfers) EXCEPT liability payments
const shouldIncludeInStats = (transaction: Transaction): boolean => {
  // No opposite transaction = always include
  if (!transaction.op) return true;

  // Find the opposite transaction
  const oppositeTransaction = dashboardTransactionStore.transactions.find((t) => t.id === transaction.op);
  if (!oppositeTransaction) return true; // Include if opposite not found

  // Find the opposite account
  const oppositeAccount = accountStore.accounts.find((a) => a.id === oppositeTransaction.a);
  if (!oppositeAccount) return true; // Include if account not found

  // Include if opposite account is a liability (loan/credit - these are real expenses)
  // Exclude if opposite account is debit/saving/lending (internal transfers)
  return oppositeAccount.kind === 'loan' || oppositeAccount.kind === 'credit';
};

// Transaction stats
const transactionStats = computed(() => {
  const currentMonthStart = getMonthStart(0);
  const currentMonthEnd = getMonthEnd(0);
  const lastMonthStart = getMonthStart(1);
  const threeMonthsStart = getMonthStart(3);

  const currentMonthCount = dashboardTransactionStore.transactions.filter(
    (t) => t.at >= currentMonthStart && t.at <= currentMonthEnd && t.s !== 'pending',
  ).length;

  const lastMonthsCount = dashboardTransactionStore.transactions.filter(
    (t) => t.at >= lastMonthStart && t.s !== 'pending',
  ).length;

  const lastThreeMonthsCount = dashboardTransactionStore.transactions.filter(
    (t) => t.at >= threeMonthsStart && t.s !== 'pending',
  ).length;

  const pendingCount = dashboardTransactionStore.transactions.filter((t) => t.s === 'pending').length;

  return {
    currentMonth: currentMonthCount,
    lastThreeMonths: lastThreeMonthsCount,
    lastMonth: lastMonthsCount,
    pending: pendingCount,
  };
});

// Monthly income/expenses
const monthlyIncome = computed(() => {
  const monthStart = moment().startOf('month').toDate();

  return dashboardTransactionStore.transactions
    .filter((t) => t.at >= monthStart && t.s === 'paid' && shouldIncludeInStats(t))
    .reduce((sum, t) => sum + currenciesStore.convertToMain(t.i, getTransactionCurrency(t)), 0);
});

const monthlyExpenses = computed(() => {
  const monthStart = moment().startOf('month').toDate();

  return dashboardTransactionStore.transactions
    .filter((t) => t.at >= monthStart && t.s === 'paid' && shouldIncludeInStats(t))
    .reduce((sum, t) => sum + currenciesStore.convertToMain(t.o, getTransactionCurrency(t)), 0);
});

// Get data for configurable number of months (current + previous)
const cashFlowData = computed(() => {
  const labels: string[] = [];
  const income: number[] = [];
  const expenses: number[] = [];
  const accessible: number[] = [];
  const liabilities: number[] = [];
  const netWorth: number[] = [];
  const accessibleSavings: number[] = [];
  const investment: number[] = [];

  // Generate data for CASH_FLOW_MONTHS (previous months + current)
  for (let i = CASH_FLOW_MONTHS - 1; i >= 0; i--) {
    const monthStart = getMonthStart(i);
    const monthEnd = getMonthEnd(i);

    labels.push(getShortMonthLabel(i));

    // Calculate income for this month (converted to main currency)
    const monthIncome = dashboardTransactionStore.transactions
      .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
      .reduce((sum, t) => sum + currenciesStore.convertToMain(t.i, getTransactionCurrency(t)), 0);

    // Calculate expenses for this month (converted to main currency)
    const monthExpenses = dashboardTransactionStore.transactions
      .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
      .reduce((sum, t) => sum + currenciesStore.convertToMain(t.o, getTransactionCurrency(t)), 0);

    // Calculate balances for all account types at the end of this month
    let monthAccessible = 0;
    let monthLiabilities = 0;
    let monthNetWorth = 0;
    let monthSavingsBalance = 0;
    let monthInvestmentBalance = 0;

    accountStore.activeAccounts.forEach((account) => {
      // Calculate the balance at the end of this month
      // Start with current balance
      let balanceAtMonth = account.bal;

      // Get all transactions for this account after the month end
      const futureTransactions = dashboardTransactionStore.transactions.filter(
        (t) => t.a === account.id && t.at > monthEnd && t.s === 'paid',
      );

      // Subtract future transactions to get balance at month end
      futureTransactions.forEach((t) => {
        balanceAtMonth = balanceAtMonth - t.i + t.o;
      });

      // Convert balance to main currency for aggregation
      const balanceInMainCurrency = currenciesStore.convertToMain(balanceAtMonth, account.cur || currenciesStore.mainCurrency);

      // Track savings account balance at end of this month
      if (account.kind === 'saving') {
        monthSavingsBalance += balanceInMainCurrency;
      }

      if (account.kind === 'investment') {
        monthInvestmentBalance += balanceInMainCurrency;
      }

      // Calculate accessible amount: debit + saving - abs(credit)
      if (account.kind === 'debit' || account.kind === 'saving') {
        monthAccessible += balanceInMainCurrency;
      } else if (account.kind === 'credit') {
        monthAccessible -= Math.abs(balanceInMainCurrency);
      }

      // Calculate liabilities: abs(credit + loan balances)
      if (account.kind === 'credit' || account.kind === 'loan') {
        monthLiabilities += Math.abs(balanceInMainCurrency);
      }

      // Net worth includes all account types
      monthNetWorth += balanceInMainCurrency;
    });

    income.push(monthIncome);
    expenses.push(monthExpenses);
    accessible.push(monthAccessible);
    liabilities.push(monthLiabilities);
    netWorth.push(monthNetWorth);

    // Accessible savings = savings account balance at end of this month
    accessibleSavings.push(monthSavingsBalance);
    investment.push(monthInvestmentBalance);
  }

  return { labels, income, expenses, accessible, liabilities, netWorth, accessibleSavings, investment };
});

// Recent cash flow data (last 3 months for table)
const recentCashFlowData = computed(() => {
  const startIndex = Math.max(0, cashFlowData.value.labels.length - RECENT_CASH_FLOW_MONTHS);

  return {
    labels: cashFlowData.value.labels.slice(startIndex),
    income: cashFlowData.value.income.slice(startIndex),
    expenses: cashFlowData.value.expenses.slice(startIndex),
    accessible: cashFlowData.value.accessible?.slice(startIndex),
    liabilities: cashFlowData.value.liabilities?.slice(startIndex),
    accessibleSavings: cashFlowData.value.accessibleSavings?.slice(startIndex),
    investment: cashFlowData.value.investment?.slice(startIndex),
  };
});

// Cash flow predictions (same as chart: 6 months ahead)
const cashFlowPredictions = computed(() => {
  if (!authStore.currentUser || cashFlowData.value.labels.length === 0) {
    return {
      labels: [],
      income: [],
      expenses: [],
      accessible: [],
      liabilities: [],
      netWorth: [],
      accessibleSavings: [],
    };
  }

  return forecastCashFlow(
    cashFlowData.value,
    TABLE_PREDICTION_MONTHS,
    true, // exclude current month from regression
    undefined, // auto-calculate inflation
    budgetStore.budgets,
    settingsStore.liabilityPaymentCategories,
    accountsByKind.value.saving,
  );
});


// Investment account IDs (active only)
const investmentAccountIds = computed(() =>
  new Set(
    accountStore.activeAccounts
      .filter((a) => a.kind === 'investment')
      .map((a) => a.id),
  ),
);

// Find Investment category ID by name
const investmentCategoryId = computed(() => {
  const investmentCategory = categoryStore.categories.find((c) => c.name === 'Investment');
  return investmentCategory?.id;
});

// Calculate total invested amount (sum of all Investment category transactions in investment accounts)
// This represents the user's actual capital deposited into investment accounts
const investedAmount = computed(() => {
  if (!investmentCategoryId.value) return 0;

  const periodStart = getMonthStart(CASH_FLOW_MONTHS - 1);
  const periodEnd = getMonthEnd(0);

  return dashboardTransactionStore.transactions
    .filter(
      (t) =>
        t.at >= periodStart &&
        t.at <= periodEnd &&
        t.s === 'paid' &&
        investmentAccountIds.value.has(t.a) &&
        t.c === investmentCategoryId.value,
    )
    .reduce((sum, t) => sum + currenciesStore.convertToMain(t.i - t.o, getTransactionCurrency(t)), 0);
});

// Calculate investment profit/loss
// Profit/Loss = Current Balance - Invested Amount
// This includes fees, profits, losses, unrealized gains/losses
const investmentProfitLoss = computed(() => {
  return accountsByKind.value.investment - investedAmount.value;
});

// Investment value change over the full fetched data window (CASH_FLOW_MONTHS) from investmentValueChangeCategories
const investmentPeriodChange = computed(() => {
  const changeCategories = new Set(settingsStore.investmentValueChangeCategories);
  if (changeCategories.size === 0) return 0;

  const periodStart = getMonthStart(CASH_FLOW_MONTHS - 1);
  const periodEnd = getMonthEnd(0);

  return dashboardTransactionStore.transactions
    .filter(
      (t) =>
        t.at >= periodStart &&
        t.at <= periodEnd &&
        t.s === 'paid' &&
        investmentAccountIds.value.has(t.a) &&
        t.c !== undefined &&
        changeCategories.has(t.c),
    )
    .reduce((sum, t) => sum + t.i - t.o, 0);
});

// Percentage of investmentPeriodChange relative to invested capital (current balance minus value changes)
const investmentPeriodChangePercent = computed(() => {
  if (investmentPeriodChange.value === 0) return 0;

  // Invested capital = what's in the portfolio excluding market returns
  const investedCapital = accountsByKind.value.investment - investmentPeriodChange.value;
  if (Math.abs(investedCapital) < 0.01) return 0;

  return (investmentPeriodChange.value / Math.abs(investedCapital)) * 100;
});

// Net worth change (last full month only) - end of last month minus end of month before
const netWorthChange = computed(() => {
  const nw = cashFlowData.value.netWorth;
  const lastMonth = nw[nw.length - 2];
  const monthBefore = nw[nw.length - 3];
  if (lastMonth === undefined || monthBefore === undefined) return 0;
  return lastMonth - monthBefore;
});

// Category expenses data (last 3 months + current month, shown month by month)
// Only shows categories that are in the current month's budget
const categoryExpensesData = computed(() => {
  // Get current month's budget
  const currentPeriod = moment().format('YYYY-MM');
  const currentBudget = budgetStore.budgets.get(currentPeriod);

  // If no budget exists for current month, return empty data
  if (!currentBudget || Object.keys(currentBudget).length === 0) {
    return { labels: [], datasets: [] };
  }

  // Get category IDs that are in the current month's budget
  const budgetedCategoryIds = new Set(Object.keys(currentBudget));

  // Get all expense transactions (excluding opposite transfers but including loan payments)
  const expenseTransactions = dashboardTransactionStore.transactions.filter(
    (t) => t.s === 'paid' && shouldIncludeInStats(t) && t.o > 0, // Only expenses (out > 0), excluding transfers except loan payments, paid status
  );

  // Create a map to store expenses by category for each month
  // Structure: Map<categoryId, Map<monthIndex, amount>>
  const categoryExpensesByMonth = new Map<string, Map<number, number>>();

  // Process transactions for last 3 months + current month (4 months total)
  for (let monthIndex = CATEGORY_STAT_MONTHS; monthIndex >= 0; monthIndex--) {
    const monthStart = getMonthStart(monthIndex);
    const monthEnd = getMonthEnd(monthIndex);

    expenseTransactions
      .filter((t) => t.at >= monthStart && t.at <= monthEnd)
      .forEach((t) => {
        const categoryId = t.c || 'uncategorized';

        // Only include categories that are in the current month's budget
        if (!budgetedCategoryIds.has(categoryId)) {
          return;
        }

        if (!categoryExpensesByMonth.has(categoryId)) {
          categoryExpensesByMonth.set(categoryId, new Map());
        }

        const monthlyData = categoryExpensesByMonth.get(categoryId)!;
        // Convert expense amount to main currency
        const expenseInMainCurrency = currenciesStore.convertToMain(t.o, getTransactionCurrency(t));
        monthlyData.set(monthIndex, (monthlyData.get(monthIndex) || 0) + expenseInMainCurrency);
      });
  }

  // Calculate total expenses per category for sorting
  const categoryTotals = new Map<string, number>();
  categoryExpensesByMonth.forEach((monthlyData, categoryId) => {
    let total = 0;
    monthlyData.forEach((amount) => {
      total += amount;
    });
    categoryTotals.set(categoryId, total);
  });

  // Sort categories by total expenses descending
  const sortedCategories = Array.from(categoryExpensesByMonth.keys()).sort((a, b) => {
    return (categoryTotals.get(b) || 0) - (categoryTotals.get(a) || 0);
  });

  // Convert to chart data format
  const labels: string[] = [];
  const datasets: { label: string; data: number[] }[] = [];

  // Create labels (category names)
  sortedCategories.forEach((categoryId) => {
    const category = categoryStore.categories.find((c) => c.id === categoryId);
    labels.push(category?.name || 'Uncategorized');
  });

  // Create datasets (one per month)
  for (let monthIndex = CATEGORY_STAT_MONTHS; monthIndex >= 0; monthIndex--) {
    const monthLabel = getShortMonthLabel(monthIndex);
    const data: number[] = [];

    sortedCategories.forEach((categoryId) => {
      const monthlyData = categoryExpensesByMonth.get(categoryId);
      data.push(monthlyData?.get(monthIndex) || 0);
    });

    datasets.push({
      label: monthLabel,
      data,
    });
  }

  return { labels, datasets };
});

// Monthly summary cards - Navigable months (shows 3 months at a time)
const visibleMonths = computed(() => {
  const months = [];

  for (let i = NUM_VISIBLE_MONTHS - 1; i >= 0; i--) {
    const offset = monthOffset.value + i;
    const monthStart = getMonthStart(offset);
    const monthEnd = getMonthEnd(offset);

    const income = dashboardTransactionStore.transactions
      .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
      .reduce((sum, t) => sum + currenciesStore.convertToMain(t.i, getTransactionCurrency(t)), 0);

    const expenses = dashboardTransactionStore.transactions
      .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
      .reduce((sum, t) => sum + currenciesStore.convertToMain(t.o, getTransactionCurrency(t)), 0);

    months.push({
      offset,
      label: moment().subtract(offset, 'months').format('MMMM YYYY'),
      income,
      expenses,
    });
  }

  return months;
});

// Helper to get month icon color based on position
const getMonthIconColor = (index: number) => {
  const colors = ['text-indigo-500', 'text-purple-500', 'text-blue-500'];
  return colors[index] || 'text-blue-500';
};

// Check if we can navigate back (limited by fetched data)
const canNavigateBack = computed(() => {
  const MAX_MONTHS_BACK = CASH_FLOW_MONTHS - 1; // 12 months - 1 = 11 (since we fetch 12 months including current)
  return monthOffset.value < MAX_MONTHS_BACK - (NUM_VISIBLE_MONTHS - 1); // -3 because we show 3 months at a time
});

// Navigate months backward or forward
const navigateMonths = (direction: 'back' | 'forward') => {
  if (direction === 'back' && canNavigateBack.value) {
    monthOffset.value += 1;
  } else if (direction === 'forward' && monthOffset.value > 0) {
    monthOffset.value -= 1;
  }
};

// Keep lastMonthIncome and lastMonthExpenses for other parts of the dashboard
const lastMonthIncome = computed(() => {
  const monthStart = getMonthStart(1);
  const monthEnd = getMonthEnd(1);
  return dashboardTransactionStore.transactions
    .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
    .reduce((sum, t) => sum + currenciesStore.convertToMain(t.i, getTransactionCurrency(t)), 0);
});

const lastMonthExpenses = computed(() => {
  const monthStart = getMonthStart(1);
  const monthEnd = getMonthEnd(1);
  return dashboardTransactionStore.transactions
    .filter((t) => t.at >= monthStart && t.at <= monthEnd && t.s === 'paid' && shouldIncludeInStats(t))
    .reduce((sum, t) => sum + currenciesStore.convertToMain(t.o, getTransactionCurrency(t)), 0);
});

// Budget months - showing 2 months at a time based on offset
const visibleBudgetMonths = computed(() => {
  const months = [];

  for (let i = NUM_VISIBLE_BUDGET_MONTHS - 1; i >= 0; i--) {
    const offset = budgetMonthOffset.value + i;
    const monthStart = getMonthStart(offset);
    const monthEnd = getMonthEnd(offset);
    const period = moment().subtract(offset, 'months').format('YYYY-MM');
    const title = moment().subtract(offset, 'months').format('MMMM YYYY');

    const transactions = dashboardTransactionStore.transactions.filter(
      (t) => t.at >= monthStart && t.at <= monthEnd && shouldIncludeInStats(t)
    );
    const budgetStatuses = budgetStore.calculateBudgetStatus(period, transactions);

    months.push({
      offset,
      title,
      budgetStatuses,
    });
  }

  return months;
});

// Check if we can navigate back for budgets (limited by fetched data)
const canNavigateBudgetBack = computed(() => {
  const MAX_MONTHS_BACK = CASH_FLOW_MONTHS - 1; // 12 months - 1 = 11 (since we fetch 12 months including current)
  return budgetMonthOffset.value < MAX_MONTHS_BACK - (NUM_VISIBLE_BUDGET_MONTHS - 1); // -1 because we show 2 months at a time
});

// Navigate budget months backward or forward
const navigateBudgetMonths = (direction: 'back' | 'forward') => {
  if (direction === 'back' && canNavigateBudgetBack.value) {
    budgetMonthOffset.value += 1;
  } else if (direction === 'forward' && budgetMonthOffset.value > 0) {
    budgetMonthOffset.value -= 1;
  }
};

const navigateTo = (path: string) => {
  router.push(path);
};

const onRecalculateComplete = () => {
  // Optionally refresh the dashboard data
  showRecalculateDialog.value = false;
};

// Lifecycle
onMounted(async () => {
  loading.value = true;

  if (authStore.currentUser) {
    // Fetch transactions for the configured number of months
    const { start, end } = getLastMonthsRange(CASH_FLOW_MONTHS - 1);

    await dashboardTransactionStore.fetchDashboardTransactions(authStore.currentUser.uid, start, end);

    // Fetch budgets for past months (for display) and future months (for predictions)
    budgetLoading.value = true;
    try {
      const budgetFetchPromises = [];

      // Fetch past budgets for display (current month + 11 previous months = 12 total, matching CASH_FLOW_MONTHS)
      for (let i = 0; i < CASH_FLOW_MONTHS; i++) {
        const period = moment().subtract(i, 'months').format('YYYY-MM');
        budgetFetchPromises.push(budgetStore.fetchBudget(authStore.currentUser.uid, period));
      }

      // Fetch future budgets for predictions (use max of chart/table prediction months)
      const maxPredictionMonths = Math.max(CHART_PREDICTION_MONTHS, TABLE_PREDICTION_MONTHS);
      for (let i = 1; i <= maxPredictionMonths; i++) {
        const period = moment().add(i, 'months').format('YYYY-MM');
        budgetFetchPromises.push(budgetStore.fetchBudget(authStore.currentUser.uid, period));
      }

      await Promise.all(budgetFetchPromises);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      budgetLoading.value = false;
    }
  }

  loading.value = false;
});
</script>
