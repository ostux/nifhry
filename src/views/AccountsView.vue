<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <NewAccountCard />

    <AccountCard
      v-for="account in acs"
      :account="account"
      :key="account.id"
    />
  </div>
</template>

<script setup lang="ts">
import AccountCard from '@/components/account/AccountCard.vue';
import NewAccountCard from '@/components/account/NewAccountCard.vue';
import { useDataStore } from '@/stores/dataStore';
import type { Z_AccountsArray } from '@/types';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const dataStore = useDataStore();
const { accounts } = storeToRefs(dataStore);

const acs = computed(() => Array.from(accounts.value.values()) as unknown as Z_AccountsArray);
</script>
