<template>
  <div class="card">
    <Chart
      type="line"
      :data="chartData"
      :options="chartOptions"
      :canvasProps="{ role: 'img', 'aria-label': 'Cash Flow Trend Chart' }"
      class="h-120"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Chart from 'primevue/chart';
import { forecastCashFlow } from '@/utils/forecasting';
import type { BudgetDoc } from '@/types';
import { useTheme } from '@/composables/useTheme';

interface CashFlowData {
  labels: string[];
  income: number[];
  expenses: number[];
  accessible?: number[];
  liabilities?: number[];
  netWorth?: number[];
  accessibleSavings?: number[];
  investment?: number[];
}

const props = withDefaults(
  defineProps<{
    data: CashFlowData;
    showPredictions?: boolean;
    predictionMonths?: number;
    excludeCurrentMonth?: boolean;
    budgetData?: Map<string, BudgetDoc>;
    liabilityPaymentCategories?: string[];
    currentSavingsBalance?: number;
  }>(),
  {
    showPredictions: false,
    predictionMonths: 0, // Will default to same as historical length if 0
    excludeCurrentMonth: true, // Exclude incomplete current month from regression
  },
);

const { t } = useI18n();
const { isDark } = useTheme();

const chartData = computed(() => {
  // Force re-computation when theme changes
  isDark.value;

  const documentStyle = getComputedStyle(document.documentElement);

  // Calculate predictions if enabled
  let predictions = null;
  let combinedLabels = props.data.labels;
  let investmentPredicted: number[] | null = null;

  if (props.showPredictions && props.data.labels.length > 0) {
    const months = props.predictionMonths || props.data.labels.length;
    predictions = forecastCashFlow(
      props.data,
      months,
      props.excludeCurrentMonth,
      undefined, // Let it calculate inflation automatically
      props.budgetData,
      props.liabilityPaymentCategories,
      props.currentSavingsBalance,
    );
    combinedLabels = [...props.data.labels, ...predictions.labels];

    if (props.data.investment && props.data.investment.length > 0) {
      const months = props.predictionMonths || props.data.labels.length;
      const monthlyGrowth = Math.pow(1.01, 1 / 12);
      const lastValue = props.data.investment[props.data.investment.length - 1] ?? 0;
      investmentPredicted = Array.from({ length: months }, (_, i) =>
        lastValue * Math.pow(monthlyGrowth, i + 1),
      );
    }
  }

  // Helper to create prediction-only dataset (with nulls for historical period)
  // Includes the last historical value as a bridge point to connect the lines
  const predictionOnlyData = (predicted?: number[], historical?: number[]) => {
    if (!predictions || !predicted) return [];
    // Fill historical period with nulls, but include last historical value as bridge
    const historicalLength = props.data.labels.length;
    const bridgeValue = historical && historical.length > 0 ? historical[historical.length - 1] : null;
    return [...Array(historicalLength - 1).fill(null), bridgeValue, ...predicted];
  };

  interface ChartDataset {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
    tension: number;
    borderDash?: number[];
    pointStyle?: string;
    pointRadius?: number;
  }

  const datasets: ChartDataset[] = [
    {
      label: t('dashboard.income'),
      data: props.data.income,
      borderColor: documentStyle.getPropertyValue('--p-teal-500'),
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    },
    {
      label: t('dashboard.expenses'),
      data: props.data.expenses,
      borderColor: documentStyle.getPropertyValue('--p-pink-500'),
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    },
  ];

  // Add prediction datasets if enabled
  if (predictions) {
    datasets.push(
      {
        label: t('dashboard.income') + ' (Predicted)',
        data: predictionOnlyData(predictions.income, props.data.income),
        borderColor: documentStyle.getPropertyValue('--p-teal-500'),
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      },
      {
        label: t('dashboard.expenses') + ' (Predicted)',
        data: predictionOnlyData(predictions.expenses, props.data.expenses),
        borderColor: documentStyle.getPropertyValue('--p-pink-500'),
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      },
    );
  }

  // Add accessible amount dataset if provided
  if (props.data.accessible) {
    datasets.push({
      label: t('dashboard.accessibleAmount'),
      data: props.data.accessible,
      borderColor: documentStyle.getPropertyValue('--p-blue-500'),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    });

    if (predictions?.accessible) {
      datasets.push({
        label: t('dashboard.accessibleAmount') + ' (Predicted)',
        data: predictionOnlyData(predictions.accessible, props.data.accessible),
        borderColor: documentStyle.getPropertyValue('--p-blue-500'),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      });
    }
  }

  // Add liabilities dataset if provided
  if (props.data.liabilities) {
    datasets.push({
      label: t('dashboard.totalLiabilities'),
      data: props.data.liabilities,
      borderColor: documentStyle.getPropertyValue('--p-orange-500'),
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    });

    if (predictions?.liabilities) {
      datasets.push({
        label: t('dashboard.totalLiabilities') + ' (Predicted)',
        data: predictionOnlyData(predictions.liabilities, props.data.liabilities),
        borderColor: documentStyle.getPropertyValue('--p-orange-500'),
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      });
    }
  }

  // Add net worth dataset if provided
  if (props.data.netWorth) {
    datasets.push({
      label: t('dashboard.netWorth'),
      data: props.data.netWorth,
      borderColor: documentStyle.getPropertyValue('--p-purple-500'),
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderWidth: 3,
      fill: false,
      tension: 0.4,
    });

    if (predictions?.netWorth) {
      datasets.push({
        label: t('dashboard.netWorth') + ' (Predicted)',
        data: predictionOnlyData(predictions.netWorth, props.data.netWorth),
        borderColor: documentStyle.getPropertyValue('--p-purple-500'),
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 3,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      });
    }
  }

  // Add investment dataset if provided
  if (props.data.investment) {
    datasets.push({
      label: t('dashboard.accountTypes.investment'),
      data: props.data.investment,
      borderColor: documentStyle.getPropertyValue('--color-etoro-500') || '#13c636',
      backgroundColor: 'rgba(19, 198, 54, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    });

    if (investmentPredicted) {
      const historicalLength = props.data.labels.length;
      const bridgeValue = props.data.investment[props.data.investment.length - 1] ?? null;
      datasets.push({
        label: t('dashboard.accountTypes.investment') + ' (Predicted)',
        data: [...Array(historicalLength - 1).fill(null), bridgeValue, ...investmentPredicted],
        borderColor: documentStyle.getPropertyValue('--color-etoro-500') || '#13c636',
        backgroundColor: 'rgba(19, 198, 54, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 3,
      });
    }
  }

  return {
    labels: combinedLabels,
    datasets,
  };
});

const chartOptions = computed(() => {
  // Force re-computation when theme changes
  isDark.value;

  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  interface ChartOptions {
    maintainAspectRatio: boolean;
    aspectRatio: number;
    plugins: {
      legend: {
        labels: {
          color: string;
        };
      };
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => string;
        };
      };
      annotation?: {
        annotations: {
          predictionLine: {
            type: string;
            xMin: number;
            xMax: number;
            borderColor: string;
            borderWidth: number;
            borderDash: number[];
            label: {
              display: boolean;
              content: string;
              position: string;
              color: string;
              backgroundColor: string;
              font: {
                size: number;
              };
            };
          };
        };
      };
    };
    scales: {
      x: {
        ticks: {
          color: string;
        };
        grid: {
          color: string;
        };
      };
      y: {
        ticks: {
          color: string;
          callback: (value: string | number) => string;
        };
        grid: {
          color: string;
        };
      };
    };
  }

  const options: ChartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: { dataset: { label?: string }; parsed: { y: number | null } }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        ticks: {
          color: textColorSecondary,
          callback: function (value: string | number) {
            return new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP',
              notation: 'compact',
            }).format(Number(value));
          },
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  };

  // Add annotation line to mark prediction start if predictions are enabled
  if (props.showPredictions && props.data.labels.length > 0) {
    options.plugins.annotation = {
      annotations: {
        predictionLine: {
          type: 'line',
          xMin: props.data.labels.length - 0.5,
          xMax: props.data.labels.length - 0.5,
          borderColor: textColorSecondary,
          borderWidth: 2,
          borderDash: [10, 5],
          label: {
            display: true,
            content: 'Predictions',
            position: 'start',
            color: textColor,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            font: {
              size: 11,
            },
          },
        },
      },
    };
  }

  return options;
});
</script>
