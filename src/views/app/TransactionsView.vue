<template>
  <div class="container mx-auto p-4">
    <div class="mb-4">
      <h1 class="text-2xl font-bold">{{ $t('transactions.title') }}</h1>
    </div>

    <TransactionsTable show-batch-edit />
  </div>
</template>

<script setup lang="ts">
import TransactionsTable from '@/components/transaction/TransactionsTable.vue';
</script>
