<template>
  <TieredMenu
    v-for="transaction in transactions"
    :key="transaction.id"
    :ref="(el) => setMenuRef(el, transaction.id)"
    :model="getMenuItems(transaction)"
    popup
  />
</template>

<script setup lang="ts">
import type { Transaction, TransactionStatus } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { useTransactionStore } from '@/stores/transaction';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

interface Props {
  transactions: Transaction[];
}

interface Emits {
  (e: 'edit', transaction: Transaction): void;
  (e: 'delete', transaction: Transaction): void;
  (e: 'split', transaction: Transaction): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const toast = useToast();
const transactionStore = useTransactionStore();
const authStore = useAuthStore();

const menuRefs = ref<Record<string, { toggle: (event: Event) => void }>>({});

// Store refs for each menu by transaction ID
const setMenuRef = (el: unknown, transactionId: string) => {
  if (el && typeof el === 'object' && 'toggle' in el) {
    menuRefs.value[transactionId] = el as { toggle: (event: Event) => void };
  }
};

// Create menu items for a specific transaction
const getMenuItems = (transaction: Transaction) => {
  const isPaid = transaction.s === 'paid';
  const hasOpposite = !!transaction.op;
  const hasAmount = transaction.i > 0 || transaction.o > 0;

  return [
    {
      label: t('transactions.split.menuLabel'),
      icon: 'pi pi-copy',
      command: () => emit('split', transaction),
      disabled: hasOpposite || !hasAmount,
    },
    {
      separator: true,
    },
    {
      label: t('common.edit'),
      icon: 'pi pi-pencil',
      command: () => emit('edit', transaction),
    },
    {
      label: isPaid ? t('transactions.markAsPending') : t('transactions.markAsPaid'),
      icon: isPaid ? 'pi pi-clock' : 'pi pi-check',
      command: () => handleToggleStatus(transaction),
    },

    {
      separator: true,
    },
    {
      label: t('common.delete'),
      icon: 'pi pi-trash',
      command: () => emit('delete', transaction),
    },
  ];
};

const handleToggleStatus = async (transaction: Transaction) => {
  if (!authStore.currentUser) return;

  const newStatus: TransactionStatus = transaction.s === 'paid' ? 'pending' : 'paid';

  try {
    // Update transaction (and automatically sync to opposite transaction if exists)
    await transactionStore.updateTransaction(authStore.currentUser.uid, transaction.id, { status: newStatus }, transaction);

    toast.add({
      severity: 'success',
      summary: t('transactions.statusUpdated'),
      detail: t(`transactions.statuses.${newStatus}`),
      life: 3000,
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    toast.add({
      severity: 'error',
      summary: t('transactions.errors.updateFailed'),
      life: 3000,
    });
  }
};

const toggleMenu = (event: Event, transaction: Transaction) => {
  const menu = menuRefs.value[transaction.id];
  if (menu) {
    menu.toggle(event);
  }
};

// Expose toggleMenu so parent can call it
defineExpose({
  toggleMenu,
});
</script>
