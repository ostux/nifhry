<template>
  <div class="amount-mode-selector">
    <h4>{{ t('importTransactions.amountConfiguration') }}</h4>
    <div class="field">
      <div class="align-items-center flex">
        <RadioButton
          :modelValue="modelValue"
          @update:modelValue="$emit('update:modelValue', $event)"
          inputId="mode-split"
          value="split"
        />
        <label
          for="mode-split"
          class="ml-2"
        >{{ t('importTransactions.separateColumns') }}</label>
      </div>
      <div class="align-items-center mt-2 flex">
        <RadioButton
          :modelValue="modelValue"
          @update:modelValue="$emit('update:modelValue', $event)"
          inputId="mode-single"
          value="single"
        />
        <label
          for="mode-single"
          class="ml-2"
        >{{ t('importTransactions.singleColumn') }}</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import RadioButton from 'primevue/radiobutton';

const { t } = useI18n();

defineProps<{
  modelValue: 'split' | 'single';
}>();

defineEmits<{
  'update:modelValue': [value: 'split' | 'single'];
}>();
</script>

<style scoped>
.amount-mode-selector h4 {
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1.5rem;
}
</style>
