<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <NewAccountCard />

    <AccountCard
      v-for="account in visibleAccounts"
      :account="account"
      :key="account.id"
    />
  </div>
</template>

<script setup lang="ts">
import AccountCard from '@/components/account/AccountCard.vue';
import NewAccountCard from '@/components/account/NewAccountCard.vue';
import { useAccountStore } from '@/stores/account';
import { storeToRefs } from 'pinia';

const accountStore = useAccountStore();
const { visibleAccounts } = storeToRefs(accountStore);
</script>
