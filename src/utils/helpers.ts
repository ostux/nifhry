import type { Z_Transaction } from '@/types';

export const getAmountColor = (row: Z_Transaction) => {
  if (row.opId) return 'text-sky-500';

  if (row.in !== 0) return 'text-pine-green-500';

  return 'text-rose-500';
};
