<template>
  <Message
    v-if="errorCount > 0"
    severity="warn"
    :closable="false"
    class="mt-2"
  >
    <strong>{{ errorCount }}</strong> {{ t('importTransactions.rowsSkipped') }}
  </Message>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';

const { t } = useI18n();

defineProps<{
  errorCount: number;
}>();
</script>
