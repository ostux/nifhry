<template>
  <div class="mapping-section">
    <h3>{{ t('importTransactions.mapColumns') }}</h3>
    <div
      v-if="hasAutoMapping"
      class="auto-mapping-notice"
    >
      <i class="pi pi-check-circle"></i>
      <span>{{ t('importTransactions.autoMappingApplied') }}</span>
    </div>

    <MappingPreviewTable
      :headers="importStore.headers"
      :previewData="importStore.previewData"
    />

    <div class="mt-4 flex w-full flex-col lg:flex-row">
      <div class="lg:w-full lg:pr-4">
        <h4>{{ t('importTransactions.mapFields') }}</h4>

        <div class="field">
          <label for="date-field">{{ t('importTransactions.transactionDate') }} <span class="required">*</span></label>
          <Dropdown
            id="date-field"
            :modelValue="importStore.mapping.date"
            @update:modelValue="importStore.setMapping('date', $event)"
            :options="importStore.headers"
            :placeholder="$t('importTransactions.selectDateColumn')"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="description-field">{{ t('importTransactions.description') }} <span class="required">*</span></label>
          <Dropdown
            id="description-field"
            :modelValue="importStore.mapping.description"
            @update:modelValue="importStore.setMapping('description', $event)"
            :options="importStore.headers"
            :placeholder="$t('importTransactions.selectDescriptionColumn')"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="category-field">{{ t('importTransactions.category') }}</label>
          <Dropdown
            id="category-field"
            :modelValue="importStore.mapping.category"
            @update:modelValue="importStore.setMapping('category', $event)"
            :options="importStore.headers"
            :placeholder="$t('importTransactions.selectCategoryColumn')"
            class="w-full"
            showClear
          />
        </div>
      </div>

      <div class="lg:w-full lg:pl-4">
        <AmountModeSelector
          :modelValue="importStore.amountMode"
          @update:modelValue="importStore.setAmountMode"
        />

        <div
          v-if="importStore.amountMode === 'split'"
          class="amount-split"
        >
          <div class="field">
            <label for="credit-field">{{ t('importTransactions.creditMoneyIn') }} <span class="required">*</span></label>
            <Dropdown
              id="credit-field"
              :modelValue="importStore.mapping.credit"
              @update:modelValue="importStore.setMapping('credit', $event)"
              :options="importStore.headers"
              :placeholder="$t('importTransactions.selectCreditColumn')"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="debit-field">{{ t('importTransactions.debitMoneyOut') }} <span class="required">*</span></label>
            <Dropdown
              id="debit-field"
              :modelValue="importStore.mapping.debit"
              @update:modelValue="importStore.setMapping('debit', $event)"
              :options="importStore.headers"
              :placeholder="$t('importTransactions.selectDebitColumn')"
              class="w-full"
            />
          </div>
        </div>

        <div
          v-else
          class="amount-single"
        >
          <div class="field">
            <label for="amount-field">{{ t('importTransactions.amount') }} <span class="required">*</span></label>
            <Dropdown
              id="amount-field"
              :modelValue="importStore.mapping.amount"
              @update:modelValue="importStore.setMapping('amount', $event)"
              :options="importStore.headers"
              :placeholder="$t('importTransactions.selectAmountColumn')"
              class="w-full"
            />
          </div>

          <div class="field">
            <div class="align-items-center flex">
              <Checkbox
                :modelValue="importStore.reverseAmount"
                @update:modelValue="importStore.toggleReverseAmount"
                inputId="reverse-amount"
                :binary="true"
              />
              <label
                for="reverse-amount"
                class="ml-2"
              >
                {{ t('importTransactions.reverseAmountSigns') }}
              </label>
            </div>
            <small class="help-text">
              {{ importStore.reverseAmount ? t('importTransactions.reverseHelp') : t('importTransactions.normalHelp') }}
            </small>
          </div>
        </div>
      </div>
    </div>

    <div class="button-group">
      <Button
        :label="$t('importTransactions.back')"
        icon="pi pi-arrow-left"
        @click="importStore.resetImport"
        severity="secondary"
      />
      <Button
        :label="$t('importTransactions.previewImport')"
        icon="pi pi-eye"
        @click="handlePreview"
        :disabled="!importStore.isMappingValid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useImportStore } from '@/stores/import';
import { useTransactionStore } from '@/stores/transaction';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AmountModeSelector from './AmountModeSelector.vue';
import MappingPreviewTable from './MappingPreviewTable.vue';

const { t } = useI18n();
const toast = useToast();
const importStore = useImportStore();
const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const hasAutoMapping = computed(() => {
  return !!importStore.mapping.date || !!importStore.mapping.description;
});

const handlePreview = async () => {
  if (!authStore.currentUser) return;

  try {
    await importStore.previewImport(
      authStore.currentUser.uid,
      categoryStore.categories,
      transactionStore.findCategoryByDescription,
      categoryStore.createCategory,
      () => categoryStore.categories,
    );
  } catch (error) {
    console.error('Error previewing import:', error);
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('importTransactions.previewError'),
      life: 5000,
    });
  }
};
</script>

<style scoped>
.mapping-section {
  margin-top: 1rem;
}

.auto-mapping-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  background-color: #d1fae5;
  border: 1px solid #10b981;
  border-radius: 0.375rem;
  color: #065f46;
  font-size: 0.875rem;
}

.auto-mapping-notice i {
  color: #10b981;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
