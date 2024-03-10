<template>
  <dropdown-menu
    :items="items(row as unknown as Z_Transaction)"
    :data="row"
    class="-mt-4"
  >
  </dropdown-menu>
  <transaction-edit-form
    v-if="openTransactionEditForm"
    :modal-open="openTransactionEditForm"
    @close="openTransactionEditForm = false"
    :transaction="selectedTransaction"
    @saved="$emit('refetch')"
  />
  <scheduled-transaction-edit-form
    v-if="openScheduledTransactionEditForm"
    :modal-open="openScheduledTransactionEditForm"
    @close="openScheduledTransactionEditForm = false"
    :transaction="selectedTransaction"
    @saved="$emit('refetch')"
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
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { z_transaction, z_transactionStatus, type Z_Transaction, type Z_Transactions } from '@/types';
import { BanknotesIcon, DocumentDuplicateIcon, PencilSquareIcon, TrashIcon, SquaresPlusIcon } from '@heroicons/vue/24/outline';
import { storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DeleteConfirmationForm from '@/components/ui/BaseModal.vue';
import ScheduledTransactionEditForm from '@/components/transaction/ScheduledTransactionEditForm.vue';
import TransactionEditForm from '@/components/transaction/TransactionEditForm.vue';

const { t } = useI18n();

const dataStore = useDataStore();
const { transactions } = storeToRefs(dataStore);

const notifications = useNotification();
const { addNotification } = notifications;

const emit = defineEmits(['refetch']);
defineProps({
  row: {
    type: [String, Number, Object, Array],
    required: false,
    default: null
  }
});

const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);
const transactionsToRemove: Ref<Z_Transactions> = ref([]);

const openTransactionEditForm: Ref<boolean> = ref(false);
const openScheduledTransactionEditForm: Ref<boolean> = ref(false);
const openRemoveTransactionForm: Ref<boolean> = ref(false);

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
          tCopy.desc = `${tCopy.desc} - copy`;
          tCopy.iId.from = null;
          tCopy.iId.to = null;

          const res = dataStore.addTransaction(tCopy);
          if (res && res.success) {
            addNotification('success', t('transaction.form.saved'));
            emit('refetch', true);
          } else {
            addNotification('danger', t('transaction.form.saveFailed'));
          }
        }
      },
      {
        label: 'menu.schedule',
        icon: SquaresPlusIcon,
        click: () => {
          const tCopy = z_transaction.parse(row);
          tCopy.id = crypto.randomUUID();
          tCopy.desc = `${tCopy.desc}`;
          tCopy.iId.from = null;
          tCopy.iId.to = null;

          selectedTransaction.value = row;
          openScheduledTransactionEditForm.value = true;
        }
      }
    ],
    [
      {
        label: 'menu.delete',
        icon: TrashIcon,
        click: () => {
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
          emit('refetch', true);
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
          emit('refetch', true);
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
  emit('refetch', true);

  openRemoveTransactionForm.value = false;
};
</script>
