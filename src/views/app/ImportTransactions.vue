<template>
  <div class="import-transactions">
    <Card>
      <template #title>
        <ImportHeader :account="currentAccount" />
      </template>
      <template #content>
        <Stepper
          :value="importStore.currentStep"
          linear
        >
          <StepList>
            <Step :value="1">{{ $t('importTransactions.steps.upload') }}</Step>
            <Step :value="2">{{ $t('importTransactions.steps.mapping') }}</Step>
            <Step :value="3">{{ $t('importTransactions.steps.preview') }}</Step>
            <Step :value="4">{{ $t('importTransactions.steps.results') }}</Step>
          </StepList>

          <StepPanels>
            <StepPanel :value="1">
              <UploadStep />
            </StepPanel>

            <StepPanel :value="2">
              <MappingStep />
            </StepPanel>

            <StepPanel :value="3">
              <PreviewStep :accountId="accountId" />
            </StepPanel>

            <StepPanel :value="4">
              <ResultsStep
                :accountId="accountId"
                @done="goToAccount"
              />
            </StepPanel>
          </StepPanels>
        </Stepper>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import ImportHeader from '@/components/import/ImportHeader.vue';
import MappingStep from '@/components/import/MappingStep.vue';
import PreviewStep from '@/components/import/PreviewStep.vue';
import ResultsStep from '@/components/import/ResultsStep.vue';
import UploadStep from '@/components/import/UploadStep.vue';
import { useAccountStore } from '@/stores/account';
import { useImportStore } from '@/stores/import';
import Step from 'primevue/step';
import StepList from 'primevue/steplist';
import StepPanel from 'primevue/steppanel';
import StepPanels from 'primevue/steppanels';
import Stepper from 'primevue/stepper';
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const importStore = useImportStore();
const accountStore = useAccountStore();

const accountId = computed(() => route.params.id as string);
const currentAccount = computed(() => accountStore.accounts.find((a) => a.id === accountId.value));

// Reset import store when component is mounted to ensure clean state
onMounted(() => {
  importStore.resetImport();
});

// Reset import store when component is unmounted (navigating away)
onUnmounted(() => {
  importStore.resetImport();
});

const goToAccount = () => {
  importStore.resetImport();
  router.push({ name: 'account', params: { id: accountId.value } });
};
</script>

<style scoped>
.import-transactions {
  padding: 1rem;
}
</style>
