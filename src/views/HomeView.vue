<template>
  <div class="flex min-h-96 flex-grow items-center justify-center">
    <template v-if="acs.length > 0">
      <div>
        <h1 class="py-10 text-center text-5xl text-pine-green-500">{{ $t('home.welcome') }}</h1>
        <div class="text-2xl">
          <p class="text-pine-green-900 dark:text-pine-green-300">
            <span class="flex justify-center"> You have {{ positiveAccounts.length }} accounts with positive ballance:</span>
            <span class="flex justify-center p-8 text-4xl">
              {{
                new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP'
                }).format(positiveAccountsTotalBallance)
              }}
            </span>
          </p>
          <p class="text-red-800 dark:text-red-300">
            <span class="flex justify-center">You have {{ negativeAccounts.length }} accounts with negative ballance:</span>
            <span class="flex justify-center p-8 text-4xl">
              {{
                new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP'
                }).format(negativeAccountsTotalBallance)
              }}
            </span>
          </p>
          <p class="flex flex-col justify-center text-purple-800 dark:text-purple-400">
            <span class="flex justify-center text-3xl"> Your total ballance: </span>
            <span class="flex justify-center p-8 text-6xl">
              {{
                new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP'
                }).format(totalBallance)
              }}
            </span>
          </p>
        </div>
      </div>
    </template>
    <template v-else>
      <h1 class="py-10 text-center text-5xl text-pine-green-500">{{ $t('home.welcome') }}</h1>
      <div class="text-5xl text-red-800 dark:text-red-300">
        {{ $t('home.no_account.message') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore';
import type { Z_Account, Z_AccountsArray, z_account } from '@/types';
import { storeToRefs } from 'pinia';
import { computed, type ComputedRef } from 'vue';

const dataStore = useDataStore();
const { accounts } = storeToRefs(dataStore);

const acs = computed(() => Array.from(accounts.value.values()) as unknown as Z_AccountsArray);

const positiveAccounts: ComputedRef<Z_AccountsArray> = computed(() => {
  return Array.from(accounts.value.values() as unknown as Z_AccountsArray).filter((a: Z_Account) => a.balance >= 0);
});
const negativeAccounts: ComputedRef<Z_AccountsArray> = computed(() => {
  return Array.from(accounts.value.values() as unknown as Z_AccountsArray).filter((a: Z_Account) => a.balance < 0);
});
const positiveAccountsTotalBallance = computed(() => positiveAccounts.value.reduce((acc, cur) => acc + cur.balance, 0));
const negativeAccountsTotalBallance = computed(() => negativeAccounts.value.reduce((acc, cur) => acc + cur.balance, 0));
const totalBallance = positiveAccountsTotalBallance.value + negativeAccountsTotalBallance.value;
</script>
