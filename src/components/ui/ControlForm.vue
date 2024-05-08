<template>
  <div class="mb-4 flex flex-col justify-between md:flex-row">
    <div class="flex justify-between gap-4 p-2">
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
    <transaction-range-control-tab />
  </div>

  <pagination-component />
  <transaction-edit-form
    v-if="openTransactionEditForm"
    :modal-open="openTransactionEditForm"
    @close="openTransactionEditForm = false"
    :selectedTransaction="selectedTransaction"
  />
  <scheduled-transaction-edit-form
    v-if="openScheduledTransactionEditForm"
    :modal-open="openScheduledTransactionEditForm"
    @close="openScheduledTransactionEditForm = false"
    :selectedTransaction="selectedTransaction"
  />
</template>

<script setup lang="ts">
import ScheduledTransactionEditForm from '@/components/transaction/ScheduledTransactionEditForm.vue';
import TransactionEditForm from '@/components/transaction/TransactionEditForm.vue';
import TransactionRangeControlTab from '@/components/transaction/TransactionRangeControlTab.vue';
import PaginationComponent from '@/components/ui/PaginationComponent.vue';
import SimpleButton from '@/components/ui/SimpleButton.vue';
import { useTransactions } from '@/composables/useTransactions';
import { Squares2X2Icon, SquaresPlusIcon } from '@heroicons/vue/24/outline';
import { ref, type Ref } from 'vue';

const tr = useTransactions();

const { selectedTransaction } = tr;

const openTransactionEditForm: Ref<boolean> = ref(false);
const openScheduledTransactionEditForm: Ref<boolean> = ref(false);
</script>
