<template>
  <Dialog
    v-model:visible="isVisible"
    :header="transaction ? $t('transactions.editTransaction') : $t('transactions.createTransaction')"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
  >
    <div class="flex flex-col gap-4">
      <!-- Description -->
      <div class="flex flex-col gap-2">
        <label
          for="description"
          class="font-semibold"
          >{{ $t('transactions.description') }}</label
        >
        <InputText
          id="description"
          v-model="formData.description"
          :maxlength="159"
          :invalid="!!errors.description"
        />
        <small
          v-if="errors.description"
          class="text-pink-500"
          >{{ errors.description }}</small
        >
      </div>

      <!-- Category -->
      <div class="flex flex-col gap-2">
        <label
          for="category"
          class="font-semibold"
          >{{ $t('transactions.category') }}</label
        >
        <Select
          id="category"
          v-model="formData.category"
          :options="categoryStore.categories"
          option-label="name"
          option-value="id"
          :placeholder="$t('transactions.selectCategory')"
          show-clear
        />
      </div>

      <!-- Account -->
      <div class="flex flex-col gap-2">
        <label
          for="account"
          class="font-semibold"
          >{{ $t('transactions.account') }} *</label
        >
        <Select
          id="account"
          v-model="formData.account"
          :options="accountStore.activeAccounts"
          option-label="name"
          option-value="id"
          :placeholder="$t('transactions.selectAccount')"
          :invalid="!!errors.account"
        />
        <small
          v-if="errors.account"
          class="text-pink-500"
          >{{ errors.account }}</small
        >
      </div>

      <!-- Target Account -->
      <div class="flex flex-col gap-2">
        <label
          for="target"
          class="font-semibold"
          >{{ $t('transactions.targetAccount') }}</label
        >
        <Select
          id="target"
          v-model="formData.target"
          :options="availableTargetAccounts"
          option-label="name"
          option-value="id"
          :placeholder="$t('transactions.selectTargetAccount')"
          show-clear
        />
      </div>

      <!-- Opposite Transaction -->
      <div class="flex flex-col gap-2">
        <label
          for="oppositeTransaction"
          class="font-semibold"
          >{{ $t('transactions.oppositeTransaction') }}</label
        >
        <Select
          id="oppositeTransaction"
          v-model="formData.oppositeTransactionId"
          :options="potentialOppositeTransactions"
          option-label="d"
          option-value="id"
          :placeholder="$t('transactions.selectOppositeTransaction')"
          :disabled="potentialOppositeTransactions.length === 0 || !!formData.target"
          show-clear
        >
          <template #option="slotProps">
            <div class="flex flex-col">
              <span class="font-semibold">{{ slotProps.option.d }}</span>
              <span class="text-sm text-gray-500">
                {{ formatDate(slotProps.option.at) }} - In: {{ slotProps.option.i }} / Out: {{ slotProps.option.o }}
              </span>
            </div>
          </template>
        </Select>
        <small
          v-if="potentialOppositeTransactions.length === 0 && !formData.target"
          class="text-gray-500"
        >
          {{ $t('transactions.noOppositeTransactions') }}
        </small>
      </div>

      <!-- Income and Expense / Cross-Currency Transfer Amounts -->
      <div v-if="isCrossCurrencyTransfer" class="flex flex-col gap-4">
        <!-- Cross-Currency Transfer Notice -->
        <Message severity="info" :closable="false">
          {{ $t('transactions.crossCurrencyTransfer', {
            fromCurrency: sourceCurrency,
            toCurrency: targetCurrency,
            rate: currenciesStore.getRate(targetCurrency) / currenciesStore.getRate(sourceCurrency)
          }) }}
        </Message>

        <!-- Amount from source account -->
        <div class="flex flex-col gap-2">
          <label
            for="sourceAmount"
            class="font-semibold"
          >
            {{ $t('transactions.amountFrom', { account: sourceAccount?.name, currency: sourceCurrency }) }}
          </label>
          <InputNumber
            id="sourceAmount"
            v-model="formData.outAmount"
            :min="0"
            :min-fraction-digits="2"
            :max-fraction-digits="2"
            :invalid="!!errors.amount"
          />
        </div>

        <!-- Amount to target account -->
        <div class="flex flex-col gap-2">
          <label
            for="targetAmount"
            class="font-semibold"
          >
            {{ $t('transactions.amountTo', { account: targetAccount?.name, currency: targetCurrency }) }}
          </label>
          <InputNumber
            id="targetAmount"
            v-model="formData.inAmount"
            :min="0"
            :min-fraction-digits="2"
            :max-fraction-digits="2"
            :invalid="!!errors.amount"
          />
        </div>

        <small
          v-if="errors.amount"
          class="text-pink-500"
        >{{ errors.amount }}</small>
      </div>

      <!-- Regular Income/Expense (non-cross-currency) -->
      <div v-else>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label
              for="income"
              class="font-semibold"
              >{{ $t('transactions.income') }}</label
            >
            <InputNumber
              id="income"
              v-model="formData.inAmount"
              :min="0"
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              :invalid="!!errors.amount"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="expense"
              class="font-semibold"
              >{{ $t('transactions.expense') }}</label
            >
            <InputNumber
              id="expense"
              v-model="formData.outAmount"
              :min="0"
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              :invalid="!!errors.amount"
            />
          </div>
        </div>
        <small
          v-if="errors.amount"
          class="text-pink-500"
          >{{ errors.amount }}</small
        >
      </div>

      <!-- Date -->
      <div class="flex flex-col gap-2">
        <label
          for="date"
          class="font-semibold"
          >{{ $t('transactions.date') }} *</label
        >
        <DatePicker
          id="date"
          v-model="formData.date"
          :invalid="!!errors.date"
          date-format="dd/mm/yy"
          placeholder="dd/mm/yyyy"
        />
        <small
          v-if="errors.date"
          class="text-pink-500"
          >{{ errors.date }}</small
        >
      </div>

      <!-- Status -->
      <div class="flex flex-col gap-2">
        <label
          for="status"
          class="font-semibold"
          >{{ $t('transactions.status') }} *</label
        >
        <Select
          id="status"
          v-model="formData.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('common.cancel')"
          severity="secondary"
          @click="closeDialog"
        />
        <Button
          :label="transaction ? $t('common.update') : $t('common.create')"
          :loading="transactionStore.loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useCategoryStore } from '@/stores/category';
import { useAccountStore } from '@/stores/account';
import { useTransactionStore } from '@/stores/transaction';
import { useAuthStore } from '@/stores/auth';
import { useCurrenciesStore } from '@/stores/currencies';
import type { Transaction } from '@/types';
import moment from 'moment';

const props = defineProps<{
  visible: boolean;
  transaction?: Transaction;
  defaultAccountId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'transaction-saved'): void;
}>();

const { t } = useI18n();
const toast = useToast();
const categoryStore = useCategoryStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();
const authStore = useAuthStore();
const currenciesStore = useCurrenciesStore();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const formData = ref({
  description: '',
  category: undefined as string | undefined,
  account: '',
  target: undefined as string | undefined,
  oppositeTransactionId: undefined as string | undefined,
  inAmount: 0,
  outAmount: 0,
  date: new Date(),
  status: 'paid' as 'paid' | 'pending',
});

const errors = ref({
  description: '',
  account: '',
  amount: '',
  date: '',
});

const potentialOppositeTransactions = ref<Transaction[]>([]);

const statusOptions = computed(() => [
  { label: t('transactions.statuses.paid'), value: 'paid' },
  { label: t('transactions.statuses.pending'), value: 'pending' },
]);

const availableTargetAccounts = computed(() => {
  return accountStore.activeAccounts.filter((acc) => acc.id !== formData.value.account);
});

// Get source and target account objects
const sourceAccount = computed(() => {
  return accountStore.accounts.find((acc) => acc.id === formData.value.account);
});

const targetAccount = computed(() => {
  return accountStore.accounts.find((acc) => acc.id === formData.value.target);
});

// Check if this is a cross-currency transfer
const isCrossCurrencyTransfer = computed(() => {
  if (!formData.value.target || !sourceAccount.value || !targetAccount.value) {
    return false;
  }
  const sourceCurrency = sourceAccount.value.cur || currenciesStore.mainCurrency;
  const targetCurrency = targetAccount.value.cur || currenciesStore.mainCurrency;
  return sourceCurrency !== targetCurrency;
});

// Get currency codes for display
const sourceCurrency = computed(() => {
  return sourceAccount.value?.cur || currenciesStore.mainCurrency;
});

const targetCurrency = computed(() => {
  return targetAccount.value?.cur || currenciesStore.mainCurrency;
});

const resetForm = () => {
  const today = moment().startOf('day').toDate();

  formData.value = {
    description: '',
    category: undefined,
    account: props.defaultAccountId || '',
    target: undefined,
    oppositeTransactionId: undefined,
    inAmount: 0,
    outAmount: 0,
    date: today,
    status: 'paid',
  };
  errors.value = {
    description: '',
    account: '',
    amount: '',
    date: '',
  };
  potentialOppositeTransactions.value = [];
};

// Initialize form with transaction data when editing
watch(
  () => props.transaction,
  (newTransaction) => {
    if (newTransaction) {
      const transactionDate = moment(newTransaction.at).startOf('day').toDate();

      formData.value = {
        description: newTransaction.d,
        category: newTransaction.c,
        account: newTransaction.a,
        target: undefined,
        oppositeTransactionId: newTransaction.op,
        inAmount: newTransaction.i,
        outAmount: newTransaction.o,
        date: transactionDate,
        status: newTransaction.s,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// Watch for changes to find potential opposite transactions
watch(
  [
    () => formData.value.inAmount,
    () => formData.value.outAmount,
    () => formData.value.date,
    () => formData.value.account,
    () => formData.value.target,
  ],
  async () => {
    // Only search if no target account is selected and amounts are valid
    if (
      !formData.value.target &&
      formData.value.account &&
      (formData.value.inAmount > 0 || formData.value.outAmount > 0) &&
      formData.value.date &&
      authStore.currentUser
    ) {
      potentialOppositeTransactions.value = await transactionStore.findPotentialOppositeTransactions(authStore.currentUser.uid, {
        currentAccount: formData.value.account,
        inAmount: formData.value.inAmount,
        outAmount: formData.value.outAmount,
        date: formData.value.date,
      });
    } else {
      potentialOppositeTransactions.value = [];
    }
  },
  { deep: true },
);

// Clear opposite transaction when target is selected
watch(
  () => formData.value.target,
  (newTarget) => {
    if (newTarget) {
      formData.value.oppositeTransactionId = undefined;
    }
  },
);

const validateForm = (): boolean => {
  errors.value = {
    description: '',
    account: '',
    amount: '',
    date: '',
  };

  let isValid = true;

  // Description validation
  if (!formData.value.description.trim()) {
    errors.value.description = t('transactions.validation.descriptionRequired');
    isValid = false;
  } else if (formData.value.description.length > 159) {
    errors.value.description = t('transactions.validation.descriptionMaxLength');
    isValid = false;
  }

  // Account validation
  if (!formData.value.account) {
    errors.value.account = t('transactions.validation.accountRequired');
    isValid = false;
  }

  // Amount validation
  if (formData.value.inAmount < 0 || formData.value.outAmount < 0) {
    errors.value.amount = t('transactions.validation.negativeAmount');
    isValid = false;
  } else if (isCrossCurrencyTransfer.value) {
    // For cross-currency transfers, both amounts must be positive
    if (formData.value.inAmount === 0 || formData.value.outAmount === 0) {
      errors.value.amount = t('transactions.validation.bothAmountsRequired');
      isValid = false;
    }
  } else {
    // For regular transactions, only one amount should be set
    if (formData.value.inAmount > 0 && formData.value.outAmount > 0) {
      errors.value.amount = t('transactions.validation.bothAmountsSet');
      isValid = false;
    } else if (formData.value.inAmount === 0 && formData.value.outAmount === 0) {
      errors.value.amount = t('transactions.validation.amountRequired');
      isValid = false;
    }
  }

  // Date validation
  if (!formData.value.date) {
    errors.value.date = t('transactions.validation.dateRequired');
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm() || !authStore.currentUser) return;

  // Normalize date to midnight to ensure consistency
  const normalizedDate = normalizeDate(formData.value.date);

  try {
    if (props.transaction) {
      // Update existing transaction
      await transactionStore.updateTransaction(
        authStore.currentUser.uid,
        props.transaction.id,
        {
          description: formData.value.description,
          category: formData.value.category,
          account: formData.value.account,
          inAmount: formData.value.inAmount,
          outAmount: formData.value.outAmount,
          date: normalizedDate,
          status: formData.value.status,
          oppositeTransactionId: formData.value.oppositeTransactionId,
        },
        props.transaction,
      );

      toast.add({
        severity: 'success',
        summary: t('transactions.editTransaction'),
        detail: t('common.update'),
        life: 3000,
      });
    } else {
      // Create new transaction
      await transactionStore.createTransaction(authStore.currentUser.uid, {
        description: formData.value.description,
        category: formData.value.category,
        account: formData.value.account,
        target: formData.value.target,
        inAmount: formData.value.inAmount,
        outAmount: formData.value.outAmount,
        date: normalizedDate,
        status: formData.value.status,
        oppositeTransactionId: formData.value.oppositeTransactionId,
      });

      toast.add({
        severity: 'success',
        summary: t('transactions.createTransaction'),
        detail: t('common.create'),
        life: 3000,
      });
    }

    // Emit event to let parent handle refresh with proper filters
    emit('transaction-saved');
    closeDialog();
  } catch (error) {
    console.error('Error saving transaction:', error);
    toast.add({
      severity: 'error',
      summary: props.transaction ? t('transactions.errors.updateFailed') : t('transactions.errors.createFailed'),
      life: 3000,
    });
  }
};

const closeDialog = () => {
  isVisible.value = false;
  resetForm();
};

const formatDate = (date: Date): string => {
  return moment(date).format('MMM D, YYYY');
};

// Normalize date to start of day (midnight) to ensure consistency
const normalizeDate = (date: Date): Date => {
  return moment(date).startOf('day').toDate();
};
</script>
