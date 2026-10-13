<template>
  <DashboardCard
    :label="monthLabel"
    icon="pi-calendar"
    :icon-color="iconColor"
    :border-color="balance >= 0 ? 'border-teal-500' : 'border-pink-500'"
    :values="[
      {
        text: formatCurrency(income),
        class: 'text-teal-600 text-lg',
        subtext: formatSecondaryCurrency(income),
        subtextClass: 'text-teal-500 text-xs',
      },
      {
        text: formatCurrency(expenses),
        class: 'text-pink-600 text-lg',
        subtext: formatSecondaryCurrency(expenses),
        subtextClass: 'text-pink-500 text-xs',
      },
    ]"
    :subtitle="`${$t('dashboard.balance')}: ${formatCurrency(balance)}`"
    :change="balance"
    :change-text="`${formatCurrency(Math.abs(balance))} ${settingsStore.showSecondaryCurrency ? '|' : ''} ${settingsStore.showSecondaryCurrency ? formatSecondaryCurrency(Math.abs(balance)) : ''}`"
  />
</template>

<script setup lang="ts">
import DashboardCard from './DashboardCard.vue';
import { formatCurrency, formatSecondaryCurrency } from '@/utils/currency';
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();
interface Props {
  monthLabel: string;
  income: number;
  expenses: number;
  iconColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'text-blue-500',
});

const balance = computed(() => props.income - props.expenses);
</script>
