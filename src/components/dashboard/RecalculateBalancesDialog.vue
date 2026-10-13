<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="!isRecalculating"
    :close-on-escape="!isRecalculating"
    :header="$t('dashboard.recalculate.title')"
    :style="{ width: '600px' }"
  >
    <div class="space-y-6">
      <!-- Warning Message -->
      <Message
        v-if="!isRecalculating && !isComplete"
        severity="warn"
        :closable="false"
      >
        {{ $t('dashboard.recalculate.warning') }}
      </Message>

      <!-- Progress Steps -->
      <div class="space-y-4">
        <!-- Step 1: Fetching Accounts -->
        <div class="flex items-start gap-3">
          <div class="mt-1 shrink-0">
            <ProgressSpinner
              v-if="currentStep === 'accounts' && !steps.accounts.error"
              style="width: 24px; height: 24px"
              stroke-width="4"
            />
            <i
              v-else-if="steps.accounts.complete && !steps.accounts.error"
              class="pi pi-check-circle text-teal-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else-if="steps.accounts.error"
              class="pi pi-times-circle text-pink-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else
              class="pi pi-circle text-surface-300"
              style="font-size: 24px"
            ></i>
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ $t('dashboard.recalculate.steps.accounts') }}</div>
            <div
              v-if="steps.accounts.complete && !steps.accounts.error"
              class="text-surface-600 dark:text-surface-400 text-sm"
            >
              {{ $t('dashboard.recalculate.accountsFound', { count: steps.accounts.count }) }}
            </div>
            <div
              v-if="steps.accounts.error"
              class="text-sm text-pink-600"
            >
              {{ steps.accounts.error }}
            </div>
          </div>
        </div>

        <!-- Step 2: Fetching Transactions -->
        <div class="flex items-start gap-3">
          <div class="mt-1 shrink-0">
            <ProgressSpinner
              v-if="currentStep === 'transactions' && !steps.transactions.error"
              style="width: 24px; height: 24px"
              stroke-width="4"
            />
            <i
              v-else-if="steps.transactions.complete && !steps.transactions.error"
              class="pi pi-check-circle text-teal-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else-if="steps.transactions.error"
              class="pi pi-times-circle text-pink-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else
              class="pi pi-circle text-surface-300"
              style="font-size: 24px"
            ></i>
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ $t('dashboard.recalculate.steps.transactions') }}</div>
            <div
              v-if="steps.transactions.complete && !steps.transactions.error"
              class="text-surface-600 dark:text-surface-400 text-sm"
            >
              {{ $t('dashboard.recalculate.transactionsFound', { count: steps.transactions.count }) }}
            </div>
            <div
              v-if="steps.transactions.error"
              class="text-sm text-pink-600"
            >
              {{ steps.transactions.error }}
            </div>
          </div>
        </div>

        <!-- Step 3: Calculating Balances -->
        <div class="flex items-start gap-3">
          <div class="mt-1 shrink-0">
            <ProgressSpinner
              v-if="currentStep === 'calculating' && !steps.calculating.error"
              style="width: 24px; height: 24px"
              stroke-width="4"
            />
            <i
              v-else-if="steps.calculating.complete && !steps.calculating.error"
              class="pi pi-check-circle text-teal-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else-if="steps.calculating.error"
              class="pi pi-times-circle text-pink-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else
              class="pi pi-circle text-surface-300"
              style="font-size: 24px"
            ></i>
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ $t('dashboard.recalculate.steps.calculating') }}</div>
            <div
              v-if="steps.calculating.error"
              class="text-sm text-pink-600"
            >
              {{ steps.calculating.error }}
            </div>
          </div>
        </div>

        <!-- Step 4: Updating Accounts -->
        <div class="flex items-start gap-3">
          <div class="mt-1 shrink-0">
            <ProgressSpinner
              v-if="currentStep === 'updating' && !steps.updating.error"
              style="width: 24px; height: 24px"
              stroke-width="4"
            />
            <i
              v-else-if="steps.updating.complete && !steps.updating.error"
              class="pi pi-check-circle text-teal-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else-if="steps.updating.error"
              class="pi pi-times-circle text-pink-500"
              style="font-size: 24px"
            ></i>
            <i
              v-else
              class="pi pi-circle text-surface-300"
              style="font-size: 24px"
            ></i>
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ $t('dashboard.recalculate.steps.updating') }}</div>
            <div
              v-if="steps.updating.complete && !steps.updating.error"
              class="text-surface-600 dark:text-surface-400 text-sm"
            >
              {{ $t('dashboard.recalculate.accountsUpdated', { count: steps.updating.count }) }}
            </div>
            <div
              v-if="steps.updating.error"
              class="text-sm text-pink-600"
            >
              {{ steps.updating.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <Message
        v-if="isComplete && !hasError"
        severity="success"
        :closable="false"
      >
        {{ $t('dashboard.recalculate.success') }}
      </Message>

      <!-- Error Message -->
      <Message
        v-if="hasError"
        severity="error"
        :closable="false"
      >
        {{ $t('dashboard.recalculate.error') }}
      </Message>
    </div>

    <template #footer>
      <Button
        v-if="!isRecalculating && !isComplete"
        :label="$t('common.cancel')"
        severity="secondary"
        outlined
        @click="visible = false"
      />
      <Button
        v-if="!isRecalculating && !isComplete"
        :label="$t('dashboard.recalculate.start')"
        severity="danger"
        @click="startRecalculation"
      />
      <Button
        v-if="isComplete || hasError"
        :label="$t('common.close')"
        @click="handleClose"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useTransactionStore } from '@/stores/transaction';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  complete: [];
}>();

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const authStore = useAuthStore();
const transactionStore = useTransactionStore();

interface Step {
  complete: boolean;
  error: string | null;
  count?: number;
}

const currentStep = ref<'idle' | 'accounts' | 'transactions' | 'calculating' | 'updating' | 'complete'>('idle');
const steps = ref<{
  accounts: Step;
  transactions: Step;
  calculating: Step;
  updating: Step;
}>({
  accounts: { complete: false, error: null, count: 0 },
  transactions: { complete: false, error: null, count: 0 },
  calculating: { complete: false, error: null },
  updating: { complete: false, error: null, count: 0 },
});

const isRecalculating = computed(() => currentStep.value !== 'idle' && currentStep.value !== 'complete');
const isComplete = computed(() => currentStep.value === 'complete');
const hasError = computed(() => {
  return !!(
    steps.value.accounts.error ||
    steps.value.transactions.error ||
    steps.value.calculating.error ||
    steps.value.updating.error
  );
});

const resetSteps = () => {
  currentStep.value = 'idle';
  steps.value = {
    accounts: { complete: false, error: null, count: 0 },
    transactions: { complete: false, error: null, count: 0 },
    calculating: { complete: false, error: null },
    updating: { complete: false, error: null, count: 0 },
  };
};

const startRecalculation = async () => {
  if (!authStore.currentUser) {
    steps.value.accounts.error = 'User not authenticated';
    currentStep.value = 'complete';
    return;
  }

  resetSteps();
  currentStep.value = 'accounts';
  let lastCompletedStep: 'accounts' | 'transactions' | 'calculating' | 'updating' | null = null;

  try {
    const result = await transactionStore.recalculateAccountBalances(authStore.currentUser.uid, (step, data) => {
      if (step === 'accounts') {
        steps.value.accounts.complete = true;
        steps.value.accounts.count = data?.count || 0;
        lastCompletedStep = 'accounts';
        currentStep.value = 'transactions';
      } else if (step === 'transactions') {
        steps.value.transactions.complete = true;
        steps.value.transactions.count = data?.count || 0;
        lastCompletedStep = 'transactions';
        currentStep.value = 'calculating';
      } else if (step === 'calculating') {
        steps.value.calculating.complete = true;
        lastCompletedStep = 'calculating';
        currentStep.value = 'updating';
      } else if (step === 'updating') {
        steps.value.updating.complete = true;
        steps.value.updating.count = data?.count || 0;
        lastCompletedStep = 'updating';
        currentStep.value = 'complete';
      }
    });

    if (!result.success && lastCompletedStep) {
      // Mark the next step after last completed as failed
      const errorMsg = result.error || 'Unknown error';
      if (lastCompletedStep === 'accounts') {
        steps.value.transactions.error = errorMsg;
      } else if (lastCompletedStep === 'transactions') {
        steps.value.calculating.error = errorMsg;
      } else if (lastCompletedStep === 'calculating') {
        steps.value.updating.error = errorMsg;
      }
      currentStep.value = 'complete';
    } else if (!result.success && !lastCompletedStep) {
      // Failed on first step
      steps.value.accounts.error = result.error || 'Unknown error';
      currentStep.value = 'complete';
    }

    transactionStore.clearTransactions();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Set error on the step that was active when error occurred
    if (!lastCompletedStep) {
      // Error occurred on first step
      steps.value.accounts.error = errorMessage;
    } else if (lastCompletedStep === 'accounts') {
      steps.value.transactions.error = errorMessage;
    } else if (lastCompletedStep === 'transactions') {
      steps.value.calculating.error = errorMessage;
    } else if (lastCompletedStep === 'calculating') {
      steps.value.updating.error = errorMessage;
    } else {
      // lastCompletedStep === 'updating' - all steps completed, error in cleanup
      steps.value.updating.error = errorMessage;
    }
    currentStep.value = 'complete';
  }
};

const handleClose = () => {
  if (!hasError.value) {
    emit('complete');
  }
  visible.value = false;
  resetSteps();
};

// Reset when dialog is closed
watch(visible, (newValue) => {
  if (!newValue && isComplete.value) {
    resetSteps();
  }
});
</script>
