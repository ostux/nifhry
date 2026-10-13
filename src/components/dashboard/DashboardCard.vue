<template>
  <Card
    :class="['border-2', borderColor]"
    :pt="{ body: 'h-full', content: 'h-full' }"
  >
    <template #content>
      <div :class="['flex h-full grow flex-col justify-between space-y-2', contentClass]">
        <div class="flex grow flex-col">
          <!-- Custom Header Slot or Default Header -->
          <slot name="header">
            <div
              v-if="label"
              class="flex items-center justify-between pb-2"
            >
              <span class="text-surface-600 dark:text-surface-400 text-sm">{{ label }}</span>
              <i
                v-if="icon"
                v-tooltip.bottom="iconTooltip"
                :class="['pi', icon, iconColor]"
              ></i>
            </div>
          </slot>

          <!-- Main Value(s) -->
          <div class="flex flex-row">
            <div
              v-for="(value, index) in values"
              :key="index"
              class="flex flex-col"
            >
              <div
                class="pr-8"
                :class="['text-2xl font-bold', value.class || valueClass]"
              >
                {{ value.text }}
              </div>
              <div
                v-if="value.subtext && settingsStore.showSecondaryCurrency"
                :class="value.subtextClass || 'text-surface-500 text-xs'"
              >
                {{ value.subtext }}
              </div>
            </div>
          </div>
        </div>

        <!-- Subtitle/Secondary Text -->
        <div
          v-if="subtitle"
          class="text-surface-500 text-xs"
        >
          {{ subtitle }}
        </div>

        <!-- Change Indicator (optional) -->
        <div
          v-if="change !== undefined && change !== 0"
          class="flex items-center gap-1 text-sm"
          :class="change > 0 ? 'text-teal-600' : 'text-pink-600'"
        >
          <i
            class="pi"
            :class="change > 0 ? 'pi-arrow-up' : 'pi-arrow-down'"
          ></i>
          <span>{{ changeText }}</span>
        </div>

        <!-- Custom Footer Slot -->
        <slot name="footer"></slot>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';

interface CardValue {
  text: string;
  class?: string;
  subtext?: string;
  subtextClass?: string;
}

interface Props {
  label?: string;
  icon?: string;
  iconColor?: string;
  iconTooltip?: string;
  borderColor?: string;
  values?: CardValue | CardValue[];
  valueClass?: string;
  subtitle?: string;
  change?: number;
  changeText?: string;
  contentClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  icon: undefined,
  iconColor: '',
  iconTooltip: undefined,
  borderColor: 'border-gray-300',
  values: () => [],
  valueClass: '',
  subtitle: undefined,
  change: undefined,
  changeText: undefined,
  contentClass: '',
});

const settingsStore = useSettingsStore();

// Normalize values to always be an array
const values = computed(() => {
  if (!props.values) return [];
  return Array.isArray(props.values) ? props.values : [props.values];
});
</script>
