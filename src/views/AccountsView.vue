<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <new-account-card />
    <account-card
      v-for="account in accounts"
      :account="account"
      :key="account.id"
    />
  </div>
</template>

<script setup lang="ts">
import AccountCard from '@/components/account/AccountCard.vue';
import NewAccountCard from '@/components/account/NewAccountCard.vue';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';

const dataStore = useDataStore();

const { accounts } = storeToRefs(dataStore);
</script>
