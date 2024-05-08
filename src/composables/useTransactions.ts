import type { Z_Transaction } from '@/types';
import { ref, type Ref } from 'vue';

const selectedTransaction: Ref<Z_Transaction | undefined> = ref(undefined);

export function useTransactions() {
  return {
    selectedTransaction
  };
}
