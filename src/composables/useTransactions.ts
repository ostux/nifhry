import type { Z_Transaction } from '@/types';
import { ref, type Ref } from 'vue';

const openTransactionEditForm: Ref<boolean> = ref(false);
const openScheduledTransactionEditForm: Ref<boolean> = ref(false);

const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);

export function useTransactions() {
  return {
    selectedTransaction,
    openTransactionEditForm,
    openScheduledTransactionEditForm
  };
}
