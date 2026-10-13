<template>
  <div class="card">
    <DataTable
      :value="tableRows"
      :rows="tableRows.length"
      :paginator="false"
      stripedRows
      responsiveLayout="scroll"
    >
      <!-- Metric Column (Frozen) -->
      <Column
        field="metric"
        frozen
        class="font-semibold"
      >
        <template #header>
          <div class="flex flex-col gap-1">
            <span>{{ t('dashboard.metric') }}</span>
            <div v-if="showSecondaryCurrency" class="flex items-center gap-1">
              <span class="text-xs font-normal">{{ settingsStore.defaultCurrency }}</span>
              <ToggleSwitch v-model="useSecondary" size="small" />
              <span class="text-xs font-normal">{{ settingsStore.secondaryCurrency }}</span>
            </div>
          </div>
        </template>
        <template #body="slotProps">
          {{ slotProps.data.metric }}
        </template>
      </Column>

      <!-- Dynamic Month Columns -->
      <Column
        v-for="(monthData, index) in allMonths"
        :key="monthData.label"
        :field="`month_${index}`"
        class="text-right"
      >
        <template #header>
          <div class="flex flex-col items-center">
            <span>{{ monthData.label }}</span>
            <Tag
              v-if="monthData.type === 'past'"
              value="Past"
              severity="secondary"
              class="mt-1"
            />
            <Tag
              v-else-if="monthData.type === 'current'"
              value="Current"
              severity="warn"
              class="mt-1"
            />
            <Tag
              v-else-if="monthData.type === 'predicted'"
              value="Predicted"
              severity="info"
              class="mt-1"
            />
          </div>
        </template>
        <template #body="slotProps">
          <span
            :class="[
              monthData.type === 'current'
                ? 'font-bold text-orange-500'
                : [
                    { 'text-muted': monthData.type === 'predicted' },
                    getCellClass(slotProps.data.metric, slotProps.data[`month_${index}`], index),
                  ],
            ]"
          >
            {{ formatCurrency(slotProps.data[`month_${index}`]) }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import moment from 'moment';
import { FINANCIAL_THRESHOLDS } from '@/constants/dashboard';
import { useSettingsStore } from '@/stores/settings';
import { formatCurrency as formatPrimary, formatSecondaryCurrency } from '@/utils/currency';

interface CashFlowData {
  labels: string[];
  income: number[];
  expenses: number[];
  accessible?: number[];
  liabilities?: number[];
  accessibleSavings?: number[];
}

interface MonthData {
  label: string;
  type: 'past' | 'current' | 'predicted';
}

interface TableRow {
  metric: string;
  [key: string]: number | null | string; // month_0, month_1, etc.
}

const props = withDefaults(
  defineProps<{
    historicalData: CashFlowData;
    predictedData?: CashFlowData;
    historicalMonths?: number; // How many historical months to show
  }>(),
  {
    historicalMonths: 3,
  },
);

const { t } = useI18n();

const settingsStore = useSettingsStore();
const showSecondaryCurrency = computed(() => settingsStore.showSecondaryCurrency);
const useSecondary = ref(false);

const showAccessible = computed(() => !!props.historicalData.accessible);
const showLiabilities = computed(() => !!props.historicalData.liabilities);
const showAccessibleSavings = computed(() => !!props.historicalData.accessibleSavings);

// Build list of all months (historical + predicted)
const allMonths = computed(() => {
  const months: MonthData[] = [];

  // Get last X historical months
  const historicalCount = props.historicalData.labels.length;
  const startIndex = Math.max(0, historicalCount - props.historicalMonths);

  // Helper to normalize label to include year
  const normalizeLabel = (label: string, isPast: boolean): string => {
    // Try to parse with formats that include year first
    const formatsWithYear = ['MMM YYYY', 'MMMM YYYY'];
    const formatsWithoutYear = ['MMM', 'MMMM'];
    let parsed = null;
    let hasYear = false;

    // First try formats with year
    for (const format of formatsWithYear) {
      parsed = moment(label, format, true);
      if (parsed.isValid()) {
        hasYear = true;
        break;
      }
    }

    // If no year in label, try formats without year
    if (!hasYear) {
      for (const format of formatsWithoutYear) {
        parsed = moment(label, format, true);
        if (parsed.isValid()) break;
      }
    }

    // If valid, format consistently as "MMM YYYY"
    if (parsed && parsed.isValid()) {
      // If the label didn't include a year and it's a past month,
      // check if we need to adjust the year
      if (!hasYear && isPast) {
        const now = moment();
        // If the parsed month is after the current month, it must be from last year
        if (parsed.month() > now.month()) {
          parsed.subtract(1, 'year');
        }
      }
      return parsed.format('MMM YYYY');
    }

    // Fallback: return as-is
    return label;
  };

  // Determine current month
  const currentMonth = moment().format('MMM YYYY');

  // Add historical months
  for (let i = startIndex; i < historicalCount; i++) {
    const normalizedLabel = normalizeLabel(props.historicalData.labels[i] || '', true);
    const isCurrent = normalizedLabel === currentMonth;

    months.push({
      label: normalizedLabel,
      type: isCurrent ? 'current' : 'past',
    });
  }

  // Add predicted months if available
  if (props.predictedData) {
    for (let i = 0; i < props.predictedData.labels.length; i++) {
      months.push({
        label: normalizeLabel(props.predictedData.labels[i] || '', false),
        type: 'predicted',
      });
    }
  }

  return months;
});

// Build transposed table rows (one row per metric)
const tableRows = computed(() => {
  const rows: TableRow[] = [];
  const historicalCount = props.historicalData.labels.length;
  const startIndex = Math.max(0, historicalCount - props.historicalMonths);

  // Helper to build a row for a specific metric
  const buildRow = (metricName: string, historicalValues: number[], predictedValues?: number[]): TableRow => {
    const row: TableRow = { metric: metricName };
    let monthIndex = 0;

    // Add historical values
    for (let i = startIndex; i < historicalCount; i++) {
      row[`month_${monthIndex}`] = historicalValues[i] ?? null;
      monthIndex++;
    }

    // Add predicted values
    if (predictedValues) {
      for (let i = 0; i < predictedValues.length; i++) {
        row[`month_${monthIndex}`] = predictedValues[i] ?? null;
        monthIndex++;
      }
    }

    return row;
  };

  // Income row
  rows.push(buildRow(t('dashboard.income'), props.historicalData.income, props.predictedData?.income));

  // Expenses row
  rows.push(buildRow(t('dashboard.expenses'), props.historicalData.expenses, props.predictedData?.expenses));

  // Accessible Amount row (if available)
  if (showAccessible.value && props.historicalData.accessible) {
    rows.push(buildRow(t('dashboard.accessibleAmount'), props.historicalData.accessible, props.predictedData?.accessible));
  }

  // Liabilities row (if available)
  if (showLiabilities.value && props.historicalData.liabilities) {
    rows.push(buildRow(t('dashboard.totalLiabilities'), props.historicalData.liabilities, props.predictedData?.liabilities));
  }

  // Accessible Savings row (if available)
  if (showAccessibleSavings.value && props.historicalData.accessibleSavings) {
    rows.push(buildRow(t('dashboard.accessibleSavings'), props.historicalData.accessibleSavings, props.predictedData?.accessibleSavings));
  }

  return rows;
});

// Helper to get income for a specific month index
const getIncomeForMonth = (monthIndex: number): number => {
  const incomeRow = tableRows.value.find((row) => row.metric === t('dashboard.income'));
  if (!incomeRow) return 0;
  const income = incomeRow[`month_${monthIndex}`];
  return typeof income === 'number' ? income : 0;
};

// Helper to determine color class based on metric and value
const getCellClass = (metricName: string, value: number | null | string, monthIndex: number): string => {
  if (typeof value !== 'number') return '';

  const income = getIncomeForMonth(monthIndex);
  if (income <= 0) return ''; // Avoid division by zero

  const ratio = value / income;

  // Accessible Amount: bold + color coding
  if (metricName === t('dashboard.accessibleAmount')) {
    if (ratio < FINANCIAL_THRESHOLDS.ACCESSIBLE_LOW) return 'font-bold text-red-500';
    if (ratio >= FINANCIAL_THRESHOLDS.ACCESSIBLE_HIGH) return 'font-bold text-green-500';
    return 'font-bold text-blue-500';
  }

  // Expenses: color coding
  if (metricName === t('dashboard.expenses')) {
    if (ratio < FINANCIAL_THRESHOLDS.EXPENSE_LOW) return 'text-green-500';
    if (ratio >= FINANCIAL_THRESHOLDS.EXPENSE_HIGH) return 'text-red-500';
    return 'text-blue-500';
  }

  // Accessible Savings: blue if >= 2x income
  if (metricName === t('dashboard.accessibleSavings')) {
    if (ratio >= FINANCIAL_THRESHOLDS.ACCESSIBLE_SAVINGS) return 'text-blue-500';
  }

  return '';
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return useSecondary.value ? formatSecondaryCurrency(value) : formatPrimary(value);
};
</script>
