<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="false"
    ok-translation-slug="button.ok"
    :info-text="transactions.length > 1 ? 'transaction.form.delete.all.warning' : 'transaction.form.delete.warning'"
    @modal-ok-clicked="doIt"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      {{ $t('transaction.form.delete.title') }}
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import type { Z_Transactions } from '@/types';
import type { PropType } from 'vue';
import BaseModal from '../ui/BaseModal.vue';
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();

const emit = defineEmits(['close', 'done']);
const props = defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  },
  transactions: {
    type: Array as PropType<Z_Transactions>,
    required: true
  }
});

const doIt = () => {
  props.transactions.forEach((t) => {
    dataStore.removeTransaction(t.id);
  });
  emit('done');
  emit('close');
};
</script>
