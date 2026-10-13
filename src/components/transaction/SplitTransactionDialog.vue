<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="$t('transactions.split.title')"
    :modal="true"
    :closable="!transactionStore.loading"
    :style="{ width: '95vw', maxWidth: '50rem' }"
    @hide="handleClose"
  >
    <div
      v-if="transaction"
      class="flex flex-col gap-4"
    >
      <!-- Original Transaction Details -->
      <div class="rounded-lg border p-4">
        <h3 class="mb-2 font-semibold">{{ $t('transactions.split.originalTransaction') }}</h3>
        <div class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <span class="text-gray-600">{{ $t('transactions.description') }}:</span>
            <span class="ml-2 font-medium">{{ transaction.d }}</span>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.tableHeaders.account') }}:</span>
            <span class="ml-2 font-medium">{{ getAccountName(transaction.a) }}</span>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.category') }}:</span>
            <span class="ml-2 font-medium">{{ transaction.c ? getCategoryName(transaction.c) : '-' }}</span>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.amount') }}:</span>
            <span class="ml-2 font-semibold">{{ formatCurrency(transactionAmount, transaction.cur) }}</span>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.tableHeaders.when') }}:</span>
            <span class="ml-2 font-medium">{{ formatDate(transaction.at) }}</span>
          </div>
        </div>
      </div>

      <!-- Add Split Form -->
      <div class="rounded-lg border p-4">
        <h3 class="mb-3 font-semibold">{{ $t('transactions.split.addItem') }}</h3>
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="flex-1 sm:flex-2">
            <label
              for="category"
              class="mb-2 block text-sm font-medium"
              >{{ $t('transactions.category') }}</label
            >
            <Select
              id="category"
              v-model="newSplit.categoryId"
              :options="categoryStore.categories"
              option-label="name"
              option-value="id"
              :placeholder="$t('transactions.selectCategory')"
              class="w-full"
            />
          </div>
          <div class="flex-1">
            <label
              for="amount"
              class="mb-2 block text-sm font-medium"
              >{{ $t('transactions.amount') }}</label
            >
            <InputNumber
              id="amount"
              v-model="newSplit.amount"
              mode="currency"
              currency="GBP"
              locale="en-GB"
              :min="0.01"
              :max="maxSplitAmount"
              class="w-full"
            />
          </div>
          <div class="flex items-end">
            <Button
              icon="pi pi-plus"
              :label="$t('common.add')"
              :disabled="!canAddSplit"
              class="w-full sm:w-auto"
              @click="addSplit"
            />
          </div>
        </div>
        <div
          v-if="newSplit.amount && newSplit.amount > maxSplitAmount"
          class="mt-2 text-sm text-red-600"
        >
          {{ $t('transactions.split.exceedsMaximum', { max: formatCurrency(maxSplitAmount, transaction?.cur) }) }}
        </div>
      </div>

      <!-- Split Items List -->
      <div
        v-if="splits.length > 0"
        class="rounded-lg border p-4"
      >
        <h3 class="mb-3 font-semibold">{{ $t('transactions.split.items') }} ({{ splits.length }})</h3>
        <div class="space-y-2">
          <div
            v-for="(split, index) in splits"
            :key="index"
            class="flex items-center justify-between rounded border p-3"
          >
            <div class="flex-1 overflow-hidden">
              <span class="font-medium">{{ getCategoryName(split.categoryId) }}</span>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
              <span class="whitespace-nowrap font-semibold">{{ formatCurrency(split.amount, transaction?.cur) }}</span>
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                @click="editSplit(index)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                @click="removeSplit(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="rounded-lg border border-blue-200 p-4">
        <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span class="text-gray-600">{{ $t('transactions.split.totalSplit') }}:</span>
            <div class="text-lg font-semibold text-blue-700">{{ formatCurrency(totalSplitAmount, transaction?.cur) }}</div>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.split.remaining') }}:</span>
            <div class="text-lg font-semibold text-green-700">{{ formatCurrency(remainingAmount, transaction?.cur) }}</div>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('transactions.split.originalRemaining') }}:</span>
            <div class="text-lg font-semibold text-gray-700">{{ formatCurrency(originalRemainingAmount, transaction?.cur) }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        :label="$t('common.cancel')"
        severity="secondary"
        :disabled="transactionStore.loading"
        @click="handleClose"
      />
      <Button
        :label="$t('transactions.split.confirmSplit')"
        :loading="transactionStore.loading"
        :disabled="!canSplit"
        @click="confirmSplit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';

interface Props {
  visible: boolean;
  transaction?: Transaction;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'split-completed'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const toast = useToast();
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const accountStore = useAccountStore();
const authStore = useAuthStore();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

interface SplitItem {
  categoryId: string;
  amount: number;
}

const splits = ref<SplitItem[]>([]);
const newSplit = ref<SplitItem>({
  categoryId: '',
  amount: 0,
});
const editingIndex = ref<number | null>(null);

// Calculate transaction amount based on direction
const transactionAmount = computed(() => {
  if (!props.transaction) return 0;
  return props.transaction.i > 0 ? props.transaction.i : props.transaction.o;
});

// Calculate total split amount
const totalSplitAmount = computed(() => {
  return splits.value.reduce((sum, split) => sum + split.amount, 0);
});

// Calculate remaining amount available for splitting
const remainingAmount = computed(() => {
  return transactionAmount.value - 0.01 - totalSplitAmount.value;
});

// Calculate what will remain in the original transaction
const originalRemainingAmount = computed(() => {
  return transactionAmount.value - totalSplitAmount.value;
});

// Maximum amount that can be added to a new split
const maxSplitAmount = computed(() => {
  return remainingAmount.value;
});

// Can add split if category is selected and amount is valid
const canAddSplit = computed(() => {
  return newSplit.value.categoryId !== '' && newSplit.value.amount > 0 && newSplit.value.amount <= maxSplitAmount.value;
});

// Can perform split if at least one split exists
const canSplit = computed(() => {
  return splits.value.length > 0;
});

const addSplit = () => {
  if (!canAddSplit.value) return;

  if (editingIndex.value !== null) {
    // Update existing split
    splits.value[editingIndex.value] = { ...newSplit.value };
    editingIndex.value = null;
  } else {
    // Add new split
    splits.value.push({ ...newSplit.value });
  }

  // Reset form
  newSplit.value = {
    categoryId: '',
    amount: 0,
  };
};

const editSplit = (index: number) => {
  const split = splits.value[index];
  if (!split) return;

  newSplit.value = { ...split };
  editingIndex.value = index;
};

const removeSplit = (index: number) => {
  splits.value.splice(index, 1);
  if (editingIndex.value === index) {
    editingIndex.value = null;
    newSplit.value = {
      categoryId: '',
      amount: 0,
    };
  }
};

const confirmSplit = async () => {
  if (!props.transaction || !authStore.currentUser) return;

  try {
    const count = await transactionStore.splitTransaction(authStore.currentUser.uid, props.transaction.id, splits.value);

    toast.add({
      severity: 'success',
      summary: t('transactions.split.success'),
      detail: t('transactions.split.successDetail', { count }),
      life: 3000,
    });

    emit('split-completed');
    handleClose();
  } catch (error) {
    console.error('Error splitting transaction:', error);
    toast.add({
      severity: 'error',
      summary: t('transactions.split.error'),
      detail: error instanceof Error ? error.message : t('transactions.errors.splitFailed'),
      life: 3000,
    });
  }
};

const handleClose = () => {
  dialogVisible.value = false;
  // Reset form
  splits.value = [];
  newSplit.value = {
    categoryId: '',
    amount: 0,
  };
  editingIndex.value = null;
};

const getCategoryName = (categoryId: string): string => {
  const category = categoryStore.categories.find((c) => c.id === categoryId);
  return category?.name || categoryId;
};

const getAccountName = (accountId: string): string => {
  const account = accountStore.accounts.find((a) => a.id === accountId);
  return account?.name || accountId;
};

const formatDate = (date: Date): string => {
  return moment(date).format('MMM D, YYYY');
};

// formatCurrency is imported from @/utils/currency

// Reset form when dialog opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      splits.value = [];
      newSplit.value = {
        categoryId: '',
        amount: 0,
      };
      editingIndex.value = null;
    }
  },
);
</script>
