<template>
  <div class="mx-auto w-full max-w-6xl px-4 sm:px-0">
    <div class="mb-4 flex justify-between">
      <div class="flex gap-4 p-2">
        <simple-button
          label="transaction.form.add.single.title"
          :icon="Squares2X2Icon"
          @click="
            selectedTransaction = undefined;
            openTransactionEditForm = true;
          "
        />
        <simple-button
          label="transaction.form.add.single.title"
          :icon="SquaresPlusIcon"
          @click="
            selectedTransaction = undefined;
            openScheduledTransactionEditForm = true;
          "
        />
      </div>
      <transaction-range-control-tab @change="refetch" />
    </div>

    <pagination-componnt @change="refetch" />

    <table-component
      :columns="columns"
      :rows="rows"
      :loading="loading"
    >
      <template #amount-data="{ row }">
        {{
          new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
          }).format(parseFloat(row.amount))
        }}
      </template>
      <template #category-data="{ row }">
        {{ categoryFromId(row.category)?.name }}
      </template>

      <template #from-data="{ row }">
        {{ accountFromId(row.from)?.name ? accountFromId(row.from)?.name : row.amount > 0 ? '💰' : '🤬' }}
      </template>

      <template #to-data="{ row }">
        {{ accountFromId(row.to)?.name || '🤬' }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <dropdown-menu
          :items="items(row as unknown as Z_Transaction)"
          :data="row"
          class="-mt-4"
        >
        </dropdown-menu>
      </template>
    </table-component>
  </div>
  <transaction-edit-form
    v-if="openTransactionEditForm"
    :modal-open="openTransactionEditForm"
    @close="openTransactionEditForm = false"
    :transaction="selectedTransaction"
    @saved="refetch"
  />
  <scheduled-transaction-edit-form
    v-if="openScheduledTransactionEditForm"
    :modal-open="openScheduledTransactionEditForm"
    @close="openScheduledTransactionEditForm = false"
    :transaction="selectedTransaction"
    @saved="refetch"
  />
  <delete-confirmation-form
    v-if="openRemoveTransactionForm"
    :modal-open="openRemoveTransactionForm"
    :ok-disabled="false"
    ok-translation-slug="button.confirm"
    :info-text="transactions.length > 1 ? 'transaction.form.delete.all.warning' : 'transaction.form.delete.warning'"
    @modal-close="openRemoveTransactionForm = false"
    @modal-ok-clicked="removeTransactions"
  >
    <template v-slot:header> {{ $t('account.form.delete.title') }} </template>
  </delete-confirmation-form>
</template>

<script setup lang="ts">
import ScheduledTransactionEditForm from '@/components/transaction/ScheduledTransactionEditForm.vue';
import TransactionEditForm from '@/components/transaction/TransactionEditForm.vue';
import TransactionRangeControlTab from '@/components/transaction/TransactionRangeControlTab.vue';
import DeleteConfirmationForm from '@/components/ui/BaseModal.vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import PaginationComponnt from '@/components/ui/PaginationComponnt.vue';
import SimpleButton from '@/components/ui/SimpleButton.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { z_transaction, z_transactionStatus, type Z_Transaction, type Z_Transactions } from '@/types';
import {
  BanknotesIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';
import moment from 'moment';
import { onUnmounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const dataStore = useDataStore();
const { transactions, accountFromId, categoryFromId } = dataStore;

const notifications = useNotification();
const { addNotification } = notifications;

const loading: Ref<boolean> = ref(true);
const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);
const transactionsToRemove: Ref<Z_Transactions> = ref([]);

const openTransactionEditForm: Ref<boolean> = ref(false);
const openScheduledTransactionEditForm: Ref<boolean> = ref(false);
const openRemoveTransactionForm: Ref<boolean> = ref(false);

const columns = [
  // { key: "sId", label: "sId" },
  {
    key: 'desc',
    label: 'Description'
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'from',
    label: 'From',
    sortable: true
  },
  {
    key: 'to',
    label: 'To',
    sortable: true
  },
  {
    key: 'when',
    label: 'When',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'actions'
  }
];

const rows: Ref<Z_Transactions> = ref([]);

const items = (row: Z_Transaction) => {
  const menuItems: any = [
    [
      {
        label: 'menu.edit',
        icon: PencilSquareIcon,
        click: () => {
          selectedTransaction.value = row;
          openTransactionEditForm.value = true;
        }
      }
    ],
    [
      {
        label: 'menu.duplicate',
        icon: DocumentDuplicateIcon,
        click: () => {
          const tCopy = z_transaction.parse(row);
          tCopy.id = crypto.randomUUID();
          const res = dataStore.addTransaction(tCopy);
          if (res && res.success) {
            addNotification('success', t('transaction.form.saved'));
            refetch();
          } else {
            addNotification('danger', t('transaction.form.saveFailed'));
          }
        }
      }
    ],
    [
      {
        label: 'menu.delete',
        icon: TrashIcon,
        click: () => {
          console.log('remove clicked...');
          transactionsToRemove.value = [row];
          openRemoveTransactionForm.value = true;
        }
      }
    ]
  ];

  if (row.sId !== null) {
    menuItems[0].push({
      label: 'menu.all.edit',
      icon: PencilSquareIcon,
      click: () => {
        selectedTransaction.value = row;
        openScheduledTransactionEditForm.value = true;
      }
    });
    menuItems[2].push({
      label: 'menu.all.delete',
      icon: TrashIcon,
      disabled: false,
      click: () => {
        if (!row.sId) {
          return;
        }

        const items = dataStore.transactions.filter((t) => {
          return t.sId === row.sId && t.status === z_transactionStatus.enum.Pending;
        });

        transactionsToRemove.value = items;
        openRemoveTransactionForm.value = true;
      }
    });
  }

  if (row.status === z_transactionStatus.enum.Paid) {
    menuItems[1].push({
      label: 'menu.pending',
      icon: BanknotesIcon,
      click: () => {
        const transaction = z_transaction.parse(row);
        transaction.status = z_transactionStatus.enum.Pending;
        const res = dataStore.editTransaction(transaction);
        if (res && res.success) {
          addNotification('success', t('transaction.form.saved'));
          refetch();
        } else {
          addNotification('danger', t('transaction.form.saveFailed'));
        }
      }
    });
  } else {
    menuItems[1].push({
      label: 'menu.paid',
      icon: BanknotesIcon,
      click: () => {
        const transaction = z_transaction.parse(row);
        transaction.status = z_transactionStatus.enum.Paid;
        const res = dataStore.editTransaction(transaction);
        if (res && res.success) {
          addNotification('success', t('transaction.form.saved'));
          refetch();
        } else {
          addNotification('danger', t('transaction.form.saveFailed'));
        }
      }
    });
  }

  return menuItems;
};

const removeTransactions = () => {
  transactionsToRemove.value.forEach((t) => {
    dataStore.removeTransaction(t.id);
  });

  openRemoveTransactionForm.value = false;
};

const refetch = () => {
  loading.value = true;

  rows.value = dataStore.fetchTransactions();
};

const unsubscribe = dataStore.$onAction(
  ({
    name, // name of the action
    store, // store instance, same as `someStore`
    args, // array of parameters passed to the action
    after, // hook after the action returns or resolves
    onError // hook if the action throws or rejects
  }) => {
    if (name === 'fetchTransactions') {
      // a shared variable for this specific action call
      const startTime = Date.now();
      // this will trigger before an action on `store` is executed
      console.log(`Start "${name}" with params [${args.join(', ')}] in ${store}.`);

      // this will trigger if the action succeeds and after it has fully run.
      // it waits for any returned promised
      after(() => {
        console.log(`Finished "${name}" after ${Date.now() - startTime}ms.\n`);
        setTimeout(() => {
          loading.value = false;
        }, 300);
      });

      // this will trigger if the action throws or returns a promise that rejects
      onError((error) => {
        console.warn(`Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`);
      });
    }
  }
);

onUnmounted(() => {
  // manually remove the listener
  unsubscribe();
});
</script>
