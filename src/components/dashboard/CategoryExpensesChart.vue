<template>
  <div class="card">
    <Chart
      type="bar"
      :data="chartData"
      :options="chartOptions"
      :canvasProps="{ role: 'img', 'aria-label': 'Category Expenses Chart' }"
      class="h-120"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';
import { useTheme } from '@/composables/useTheme';

interface CategoryExpensesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

const props = defineProps<{
  data: CategoryExpensesData;
}>();

const { isDark } = useTheme();

const chartData = computed(() => {
  // Force re-computation when theme changes
  isDark.value;

  const documentStyle = getComputedStyle(document.documentElement);

  // Color palette for months
  const colors = [
    documentStyle.getPropertyValue('--p-blue-400'),
    documentStyle.getPropertyValue('--p-teal-400'),
    documentStyle.getPropertyValue('--p-orange-400'),
    documentStyle.getPropertyValue('--p-cyan-500'),
    documentStyle.getPropertyValue('--p-pink-400'),
    documentStyle.getPropertyValue('--p-yellow-400'),
    documentStyle.getPropertyValue('--p-primary-400'),
  ];

  return {
    labels: props.data.labels,
    datasets: props.data.datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
    })),
  };
});

const chartOptions = computed(() => {
  // Force re-computation when theme changes
  isDark.value;

  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
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
});
</script>
