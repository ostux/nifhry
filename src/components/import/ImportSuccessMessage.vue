<template>
  <Message
    severity="success"
    :closable="false"
  >
    {{ t('importTransactions.successfullyImported') }} <strong>{{ importedCount }}</strong>
    {{ t('importTransactions.transactions') }}
  </Message>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';

const { t } = useI18n();

defineProps<{
  importedCount: number;
}>();
</script>
