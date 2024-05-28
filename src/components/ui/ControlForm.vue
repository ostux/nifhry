<template>
  <div class="mb-4 flex flex-col justify-between md:flex-row">
    <div class="flex justify-between gap-4 p-2">
      <SimpleButton
        label="transaction.form.add.single.title"
        :icon="Squares2X2Icon"
        @click="addTransaction"
      />
      <SimpleButton
        label="transaction.form.add.single.title"
        :icon="SquaresPlusIcon"
        @click="addTransactions"
      />
    </div>
    <TransactionRangeControlTab />
  </div>

  <PaginationComponent />
</template>

<script setup lang="ts">
import TransactionRangeControlTab from '@/components/transaction/TransactionRangeControlTab.vue';
import PaginationComponent from '@/components/ui/PaginationComponent.vue';
import SimpleButton from '@/components/ui/SimpleButton.vue';
import { useTransactions } from '@/composables/useTransactions';
import type { Z_Transaction } from '@/types';
import { Squares2X2Icon, SquaresPlusIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  accountId: {
    type: String,
    required: false
  },
  categoryId: {
    type: String,
    required: false
  }
});

const tr = useTransactions();
const { selectedTransaction, openTransactionEditForm, openScheduledTransactionEditForm } = tr;

const addTransaction = () => {
  if (props.accountId) {
    selectedTransaction.value = { account: props.accountId } as Z_Transaction;
  } else if (props.categoryId) {
    selectedTransaction.value = { category: props.categoryId } as Z_Transaction;
  } else {
    selectedTransaction.value = undefined;
  }
  openTransactionEditForm.value = true;
};

const addTransactions = () => {
  if (props.accountId) {
    selectedTransaction.value = { account: props.accountId } as Z_Transaction;
  } else if (props.categoryId) {
    selectedTransaction.value = { category: props.categoryId } as Z_Transaction;
  } else {
    selectedTransaction.value = undefined;
  }
  openScheduledTransactionEditForm.value = true;
};
</script>
