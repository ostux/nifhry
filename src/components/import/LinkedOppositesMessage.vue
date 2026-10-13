<template>
  <Message
    v-if="linkedCount > 0"
    severity="info"
    :closable="false"
    class="mt-2"
  >
    <div class="align-items-center flex gap-2">
      <i
        class="pi pi-link"
        style="font-size: 1.2rem"
      ></i>
      <span>
        <strong>{{ linkedCount }}</strong> {{ t('importTransactions.transfersDetected') }}
      </span>
    </div>
  </Message>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';

const { t } = useI18n();

defineProps<{
  linkedCount: number;
}>();
</script>
