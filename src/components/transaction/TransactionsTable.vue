<template>
  <div>
    <div class="mb-4 flex-col items-center justify-between md:flex-row">
      <div class="mb-4 flex flex-col justify-start md:flex-row md:justify-between">
        <h2
          v-if="showTitle"
          class="text-xl font-semibold"
        >
          {{ $t('transactions.title') }}
        </h2>
        <p class="text-sm text-gray-600">
          <template v-if="monthFilterEnabled">
            {{ transactionStore.transactions.length }} transactions in {{ formatMonthYear(selectedMonth) }}
          </template>
          <template v-else>
            {{ $t('transactions.totalTransactions', { count: transactionStore.transactions.length }) }}
          </template>
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          v-if="showBatchEdit"
          :label="$t('transactions.batchEdit.button')"
          icon="pi pi-pencil"
          severity="secondary"
          variant="outlined"
          @click="openBatchEditDialog"
        />
        <Button
          v-tooltip.left="hasNoAccounts ? $t('transactions.requiresAccount') : ''"
          :label="$t('transactions.createTransaction')"
          icon="pi pi-plus"
          :disabled="hasNoAccounts || isAccountInactive"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div
      v-if="transactionStore.loading && transactionStore.transactions.length === 0"
      class="flex justify-center py-8"
    >
      <ProgressSpinner />
    </div>

    <div v-else>
      <DataTable
        v-model:filters="filters"
        v-model:selection="selectedTransactions"
        :value="filteredTransactions"
        striped-rows
        :show-gridlines="false"
        filter-display="menu"
        :global-filter-fields="['d', 'a', 'c']"
        data-key="id"
        :pt="{
          bodyRow: {
            class: '[&>td]:!pr-[4px] [&>td]:!pl-[16px] [&>td]:!py-0',
          },
        }"
      >
        <template #header>
          <div class="flex flex-col justify-between gap-3 md:flex-row">
            <div class="flex items-center gap-3">
              <Button
                type="button"
                icon="pi pi-filter-slash"
                :label="$t('transactions.filters.clearFilters')"
                variant="outlined"
                @click="clearFilters"
              />
            </div>

            <div class="flex flex-col items-center gap-2 md:flex-row">
              <DatePicker
                v-model="selectedMonth"
                view="month"
                date-format="mm/yy"
                :disabled="!monthFilterEnabled"
              />
              <div class="flex flex-row">
                <Checkbox
                  v-model="monthFilterEnabled"
                  :binary="true"
                  input-id="monthFilter"
                />
                <label
                  for="monthFilter"
                  class="ml-2 cursor-pointer text-sm"
                >
                  {{ $t('transactions.filters.filterByMonth') }}
                </label>
              </div>

              <Button
                v-if="!monthFilterEnabled"
                icon="pi pi-download"
                :label="$t('transactions.filters.loadTransactions')"
                severity="secondary"
                @click="loadAllTransactions"
              />
            </div>

            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText
                v-model="filters['global'].value"
                :placeholder="$t('common.search')"
                fluid
              />
            </IconField>
          </div>
        </template>
        <template #empty>{{ $t('transactions.noTransactions') }}</template>

        <!-- Selection Column (only when batch edit is enabled) -->
        <Column
          v-if="showBatchEdit"
          selection-mode="multiple"
          header-style="width: 3rem"
        />

        <!-- Description Column -->
        <Column
          field="d"
          :header="$t('transactions.tableHeaders.description')"
          sortable
        >
          <template #body="slotProps">
            <span class="font-semibold">{{ slotProps.data.d }}</span>
          </template>
          <template #filter="{ filterModel }">
            <InputText
              v-model="filterModel.value"
              type="text"
              :placeholder="$t('transactions.description')"
            />
          </template>
        </Column>

        <!-- Account Column (only when not filtering by specific account) -->
        <Column
          v-if="!accountId"
          field="a"
          :header="$t('transactions.tableHeaders.account')"
          sortable
          filter-field="a"
          :show-filter-match-modes="false"
          :filter-menu-style="{ width: '14rem' }"
        >
          <template #body="slotProps">
            {{ getAccountName(slotProps.data.a) }}
          </template>
          <template #filter="{ filterModel }">
            <MultiSelect
              v-model="filterModel.value"
              :options="accountStore.accounts"
              option-label="name"
              option-value="id"
              :placeholder="$t('transactions.selectAccount')"
            >
              <template #option="slotProps">
                <span>{{ slotProps.option.name }}</span>
              </template>
            </MultiSelect>
          </template>
        </Column>

        <!-- Income Column -->
        <Column
          field="i"
          :header="$t('transactions.tableHeaders.income')"
          sortable
          filter-field="i"
          data-type="numeric"
        >
          <template #body="slotProps">
            <span
              v-if="slotProps.data.i > 0"
              class="font-semibold"
              :class="slotProps.data.op ? 'text-blue-600' : 'text-teal-600'"
            >
              {{ formatCurrency(slotProps.data.i, slotProps.data.cur) }}
            </span>
            <i
              v-else
              class="pi pi-minus text-gray-400"
            ></i>
          </template>
          <template #filter="{ filterModel }">
            <InputNumber
              v-model="filterModel.value"
              mode="currency"
              currency="GBP"
              locale="en-GB"
            />
          </template>
        </Column>

        <!-- Expense Column -->
        <Column
          field="o"
          :header="$t('transactions.tableHeaders.expense')"
          sortable
          filter-field="o"
          data-type="numeric"
        >
          <template #body="slotProps">
            <span
              v-if="slotProps.data.o > 0"
              class="font-semibold"
              :class="slotProps.data.op ? 'text-blue-600' : 'text-pink-600'"
            >
              {{ formatCurrency(slotProps.data.o, slotProps.data.cur) }}
            </span>
            <i
              v-else
              class="pi pi-minus text-gray-400"
            ></i>
          </template>
          <template #filter="{ filterModel }">
            <InputNumber
              v-model="filterModel.value"
              mode="currency"
              currency="GBP"
              locale="en-GB"
            />
          </template>
        </Column>

        <!-- Category Column (only when not filtering by specific category) -->
        <Column
          v-if="!categoryId"
          field="c"
          :header="$t('transactions.tableHeaders.category')"
          sortable
          filter-field="c"
          :show-filter-match-modes="false"
          :filter-menu-style="{ width: '14rem' }"
        >
          <template #body="slotProps">
            <span v-if="slotProps.data.c">
              {{ getCategoryName(slotProps.data.c) }}
            </span>
            <i
              v-else
              class="pi pi-minus text-gray-400"
            ></i>
          </template>
          <template #filter="{ filterModel }">
            <MultiSelect
              v-model="filterModel.value"
              :options="categoryStore.categories"
              option-label="name"
              option-value="id"
              :placeholder="$t('transactions.selectCategory')"
            >
              <template #option="slotProps">
                <span>{{ slotProps.option.name }}</span>
              </template>
            </MultiSelect>
          </template>
        </Column>

        <!-- Date Column (When) -->
        <Column
          field="at"
          :header="$t('transactions.tableHeaders.when')"
          sortable
          filter-field="at"
          data-type="date"
        >
          <template #body="slotProps">
            {{ formatDate(slotProps.data.at) }}
          </template>
          <template #filter="{ filterModel }">
            <DatePicker
              v-model="filterModel.value"
              date-format="dd/mm/yy"
              placeholder="dd/mm/yyyy"
            />
          </template>
        </Column>

        <!-- Status Column -->
        <Column
          field="s"
          :header="$t('transactions.tableHeaders.status')"
          sortable
          :filter-menu-style="{ width: '14rem' }"
        >
          <template #body="slotProps">
            <Tag
              :value="$t(`transactions.statuses.${slotProps.data.s}`)"
              :severity="slotProps.data.s === 'paid' ? 'success' : 'info'"
            />
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :placeholder="$t('transactions.status')"
              show-clear
            >
              <template #option="slotProps">
                <Tag
                  :value="slotProps.option.label"
                  :severity="slotProps.option.value === 'paid' ? 'success' : 'info'"
                />
              </template>
            </Select>
          </template>
        </Column>

        <!-- Actions Column -->
        <Column
          :header="$t('transactions.tableHeaders.actions')"
          header-style="width: 5rem; text-align: center"
          body-style="text-align: center; overflow: visible"
        >
          <template #body="slotProps">
            <Button
              icon="pi pi-ellipsis-h"
              text
              rounded
              @click="(event) => toggleMenu(event, slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Transaction Form Dialog -->
    <TransactionFormDialog
      v-model:visible="showFormDialog"
      :transaction="selectedTransaction"
      :default-account-id="accountId"
      @transaction-saved="handleTransactionSaved"
    />

    <!-- Split Transaction Dialog -->
    <SplitTransactionDialog
      v-model:visible="showSplitDialog"
      :transaction="transactionToSplit"
      @split-completed="handleSplitCompleted"
    />

    <!-- Batch Edit Dialog -->
    <TransactionBatchEditDialog
      v-if="showBatchEdit"
      v-model:visible="showBatchEditDialog"
      :initial-transaction-ids="selectedTransactionIds"
    />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :header="$t('common.delete')"
      :modal="true"
    >
      <p>{{ $t('transactions.confirmDelete') }}</p>
      <template #footer>
        <Button
          :label="$t('common.cancel')"
          severity="secondary"
          @click="showDeleteDialog = false"
        />
        <Button
          :label="$t('common.delete')"
          severity="danger"
          :loading="transactionStore.loading"
          @click="confirmDelete"
        />
      </template>
    </Dialog>

    <!-- Actions Menu -->
    <TransactionActionsMenu
      ref="actionsMenuRef"
      :transactions="filteredTransactions"
      @edit="handleEditTransaction"
      @delete="handleDeleteTransaction"
      @split="handleSplitTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import TransactionFormDialog from '@/components/transaction/TransactionFormDialog.vue';
import TransactionActionsMenu from '@/components/transaction/TransactionActionsMenu.vue';
import TransactionBatchEditDialog from '@/components/transaction/TransactionBatchEditDialog.vue';
import SplitTransactionDialog from '@/components/transaction/SplitTransactionDialog.vue';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import type { Transaction, TransactionFilters } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';

interface Props {
  accountId?: string;
  categoryId?: string;
  showTitle?: boolean;
  showBatchEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accountId: undefined,
  categoryId: undefined,
  showTitle: false,
  showBatchEdit: true,
});

const { t } = useI18n();
const toast = useToast();
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();
const accountStore = useAccountStore();
const authStore = useAuthStore();

const showFormDialog = ref(false);
const showBatchEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showSplitDialog = ref(false);
const selectedTransaction = ref<Transaction | undefined>(undefined);
const selectedTransactions = ref<Transaction[]>([]);
const transactionToDelete = ref<Transaction | undefined>(undefined);
const transactionToSplit = ref<Transaction | undefined>(undefined);
const actionsMenuRef = ref<InstanceType<typeof TransactionActionsMenu> | null>(null);

const filters = ref();

// Month-based pagination state
const selectedMonth = ref(new Date());
const monthFilterEnabled = ref(true);

// Helper functions for month-based filtering
const getMonthStart = (date: Date): Date => {
  return moment(date).startOf('month').toDate();
};

const getMonthEnd = (date: Date): Date => {
  return moment(date).endOf('month').toDate();
};

const formatMonthYear = (date: Date): string => {
  return moment(date).format('MMMM YYYY');
};

const statusOptions = computed(() => [
  { label: t('transactions.statuses.paid'), value: 'paid' },
  { label: t('transactions.statuses.pending'), value: 'pending' },
]);

const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    d: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    at: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    c: { value: null, matchMode: FilterMatchMode.IN },
    a: { value: null, matchMode: FilterMatchMode.IN },
    i: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    o: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    s: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  };
};

initFilters();

// Map PrimeVue filters to TransactionFilters format
const mapFiltersToTransactionFilters = (): TransactionFilters => {
  const transactionFilters: TransactionFilters = {};

  // If accountId is provided, always filter by it
  if (props.accountId) {
    transactionFilters.accountIds = [props.accountId];
  }

  // If categoryId is provided, always filter by it
  if (props.categoryId) {
    transactionFilters.categoryIds = [props.categoryId];
  }

  // Month filter - only apply if checkbox is enabled
  if (monthFilterEnabled.value) {
    transactionFilters.dateFrom = getMonthStart(selectedMonth.value);
    transactionFilters.dateTo = getMonthEnd(selectedMonth.value);
  }

  // Status filter
  if (filters.value.s?.constraints?.[0]?.value) {
    transactionFilters.status = filters.value.s.constraints[0].value;
  }

  // Account filter (IN query) - only if no specific account is set
  if (!props.accountId && filters.value.a?.value && filters.value.a.value.length > 0) {
    transactionFilters.accountIds = filters.value.a.value;
  }

  // Category filter (IN query) - only if no specific category is set
  if (!props.categoryId && filters.value.c?.value && filters.value.c.value.length > 0) {
    transactionFilters.categoryIds = filters.value.c.value;
  }

  // Column date filter - only apply if month filter is DISABLED
  if (!monthFilterEnabled.value && filters.value.at?.constraints?.[0]?.value) {
    const dateValue = filters.value.at.constraints[0].value;
    if (dateValue instanceof Date) {
      transactionFilters.dateFrom = new Date(dateValue.setHours(0, 0, 0, 0));
      transactionFilters.dateTo = new Date(dateValue.setHours(23, 59, 59, 999));
    }
  }

  // Global search (description)
  if (filters.value.global?.value) {
    transactionFilters.description = filters.value.global.value;
  }

  // Description filter
  if (filters.value.d?.constraints?.[0]?.value) {
    transactionFilters.description = filters.value.d.constraints[0].value;
  }

  return transactionFilters;
};

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Watch month changes (immediate, not debounced) - only when month filter is enabled
watch(selectedMonth, async () => {
  if (!authStore.currentUser || !monthFilterEnabled.value) return;
  const transactionFilters = mapFiltersToTransactionFilters();
  await transactionStore.fetchTransactions(authStore.currentUser.uid, transactionFilters, monthFilterEnabled.value);
});

// Watch checkbox toggle - only fetch when enabling month filter
watch(monthFilterEnabled, async () => {
  if (!authStore.currentUser) return;
  // Only automatically fetch when enabling the month filter
  // When disabling, user must click "Load Transactions" button
  if (monthFilterEnabled.value) {
    const transactionFilters = mapFiltersToTransactionFilters();
    await transactionStore.fetchTransactions(authStore.currentUser.uid, transactionFilters, monthFilterEnabled.value);
  }
});

// Watch filters and refetch transactions - only when month filter is enabled
watch(
  filters,
  () => {
    if (!authStore.currentUser) return;
    // Only auto-refetch when month filter is enabled
    // When disabled, user must click "Load Transactions" button
    if (!monthFilterEnabled.value) return;

    // Debounce the filter changes to avoid excessive API calls
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      const transactionFilters = mapFiltersToTransactionFilters();
      await transactionStore.fetchTransactions(authStore.currentUser!.uid, transactionFilters, monthFilterEnabled.value);
    }, 500);
  },
  { deep: true },
);

const filteredTransactions = computed(() => {
  return transactionStore.transactions;
});

const hasNoAccounts = computed(() => {
  return accountStore.accounts.length === 0;
});

const isAccountInactive = computed(() => {
  if (!props.accountId) return false;
  const account = accountStore.accounts.find((a) => a.id === props.accountId);
  return account?.status !== 'active';
});

const selectedTransactionIds = computed(() => {
  return selectedTransactions.value.map((t) => t.id);
});

const toggleMenu = (event: Event, transaction: Transaction) => {
  actionsMenuRef.value?.toggleMenu(event, transaction);
};

const openCreateDialog = () => {
  selectedTransaction.value = undefined;
  showFormDialog.value = true;
};

const openBatchEditDialog = () => {
  showBatchEditDialog.value = true;
};

const handleEditTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  showFormDialog.value = true;
};

const handleDeleteTransaction = (transaction: Transaction) => {
  transactionToDelete.value = transaction;
  showDeleteDialog.value = true;
};

const handleSplitTransaction = (transaction: Transaction) => {
  transactionToSplit.value = transaction;
  showSplitDialog.value = true;
};

const handleTransactionSaved = async () => {
  if (!authStore.currentUser) return;
  const transactionFilters = mapFiltersToTransactionFilters();
  await transactionStore.fetchTransactions(authStore.currentUser.uid, transactionFilters, monthFilterEnabled.value);
};

const handleSplitCompleted = async () => {
  if (!authStore.currentUser) return;
  const transactionFilters = mapFiltersToTransactionFilters();
  await transactionStore.fetchTransactions(authStore.currentUser.uid, transactionFilters, monthFilterEnabled.value);
};

const confirmDelete = async () => {
  if (!transactionToDelete.value || !authStore.currentUser) return;

  try {
    await transactionStore.deleteTransaction(authStore.currentUser.uid, transactionToDelete.value.id);

    toast.add({
      severity: 'success',
      summary: t('common.delete'),
      detail: t('transactions.confirmDelete'),
      life: 3000,
    });

    showDeleteDialog.value = false;
    transactionToDelete.value = undefined;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    toast.add({
      severity: 'error',
      summary: t('transactions.errors.deleteFailed'),
      life: 3000,
    });
  }
};

const clearFilters = () => {
  initFilters();
  // Always enable month filter when clearing to avoid loading all transactions
  monthFilterEnabled.value = true;
};

const loadAllTransactions = async () => {
  if (!authStore.currentUser) return;
  const transactionFilters = mapFiltersToTransactionFilters();
  await transactionStore.fetchTransactions(authStore.currentUser.uid, transactionFilters, false);
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

onMounted(async () => {
  if (authStore.currentUser) {
    // Fetch transactions with default filters
    const defaultFilters = mapFiltersToTransactionFilters();
    await transactionStore.fetchTransactions(authStore.currentUser.uid, defaultFilters, monthFilterEnabled.value);
  }
});
</script>
