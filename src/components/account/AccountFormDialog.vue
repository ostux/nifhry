<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="$t('accounts.createAccount')"
    :style="{ width: '30rem' }"
    @hide="handleClose"
  >
    <Form
      v-slot="$form"
      :resolver="resolver"
      :initialValues="formData"
      @submit="handleSubmit"
      class="space-y-4"
    >
      <!-- Name Field -->
      <div class="flex flex-col gap-2">
        <label for="name" class="font-semibold">{{ $t('accounts.name') }}</label>
        <InputText
          id="name"
          name="name"
          v-model="formData.name"
          :invalid="$form.name?.invalid"
          fluid
          autocomplete="off"
        />
        <Message
          v-if="$form.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.name.error?.message }}
        </Message>
      </div>

      <!-- Kind Field -->
      <div class="flex flex-col gap-2">
        <label for="kind" class="font-semibold">{{ $t('accounts.type') }}</label>
        <Select
          id="kind"
          name="kind"
          v-model="formData.kind"
          :options="kindOptions"
          optionLabel="label"
          optionValue="value"
          :invalid="$form.kind?.invalid"
          :placeholder="$t('accounts.selectType')"
          fluid
        />
        <Message
          v-if="$form.kind?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.kind.error?.message }}
        </Message>
      </div>

      <!-- Currency Field -->
      <div class="flex flex-col gap-2">
        <label for="currency" class="font-semibold">{{ $t('accounts.currency') }}</label>
        <Select
          id="currency"
          name="currency"
          v-model="formData.currency"
          :options="currencyList"
          optionLabel="name"
          optionValue="code"
          :invalid="$form.currency?.invalid"
          :placeholder="$t('accounts.selectCurrency')"
          fluid
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <i v-if="slotProps.option.code === mainCurrency" class="pi pi-star-fill text-amber-500"></i>
              <span class="font-semibold">{{ slotProps.option.code }}</span>
              <span class="text-sm text-surface-500">{{ slotProps.option.name }}</span>
            </div>
          </template>
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2">
              <i v-if="slotProps.value === mainCurrency" class="pi pi-star-fill text-amber-500"></i>
              <span class="font-semibold">{{ slotProps.value }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
        </Select>
        <Message
          v-if="$form.currency?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.currency.error?.message }}
        </Message>
        <Message
          v-if="formData.currency && formData.currency !== mainCurrency"
          severity="info"
          size="small"
          :closable="false"
        >
          {{ $t('accounts.currencyRateInfo', {
            currency: formData.currency,
            rate: getCurrencyRate(formData.currency).toFixed(4),
            mainCurrency: mainCurrency
          }) }}
        </Message>
      </div>

      <!-- Balance Field -->
      <div class="flex flex-col gap-2">
        <label for="balance" class="font-semibold">{{ $t('accounts.initialBalance') }}</label>
        <InputNumber
          id="balance"
          name="balance"
          v-model="formData.balance"
          :invalid="$form.balance?.invalid"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          fluid
        />
        <Message
          v-if="$form.balance?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.balance.error?.message }}
        </Message>
      </div>

      <!-- Error Message -->
      <Message
        v-if="errorMessage"
        severity="error"
        :closable="false"
      >
        {{ errorMessage }}
      </Message>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          :label="$t('common.cancel')"
          severity="secondary"
          @click="handleClose"
        />
        <Button
          type="submit"
          :label="$t('common.create')"
          :loading="isSubmitting"
        />
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useCurrenciesStore } from '@/stores/currencies';
import type { AccountKind } from '@/types';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();
const accountStore = useAccountStore();
const authStore = useAuthStore();
const currenciesStore = useCurrenciesStore();
const { currencyList, mainCurrency } = storeToRefs(currenciesStore);

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref({
  name: '',
  kind: '' as AccountKind | '',
  currency: mainCurrency.value,
  balance: 0,
});

const getCurrencyRate = (code: string): number => {
  return currenciesStore.getRate(code);
};

const kindOptions = [
  { label: t('accounts.kinds.debit'), value: 'debit' },
  { label: t('accounts.kinds.credit'), value: 'credit' },
  { label: t('accounts.kinds.loan'), value: 'loan' },
  { label: t('accounts.kinds.lending'), value: 'lending' },
  { label: t('accounts.kinds.saving'), value: 'saving' },
  { label: t('accounts.kinds.investment'), value: 'investment' },
];

const resolver = ref(
  zodResolver(
    z.object({
      name: z
        .string()
        .min(1, t('accounts.validation.nameRequired'))
        .min(2, t('accounts.validation.nameMinLength')),
      kind: z.enum(['debit', 'credit', 'loan', 'lending', 'saving', 'investment'], t('accounts.validation.kindRequired')),
      currency: z.string().min(1, t('accounts.validation.currencyRequired')),
      balance: z.number().default(0),
    })
  )
);

const handleSubmit = async ({ valid }: { valid: boolean }) => {
  if (!valid || !authStore.currentUser) return;

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await accountStore.createAccount(authStore.currentUser.uid, {
      name: formData.value.name,
      kind: formData.value.kind as AccountKind,
      currency: formData.value.currency,
      balance: formData.value.balance,
    });

    handleClose();
  } catch (error) {
    console.error('Error creating account:', error);
    errorMessage.value = t('accounts.errors.createFailed');
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  isVisible.value = false;
  // Reset form
  formData.value = {
    name: '',
    kind: '' as AccountKind | '',
    currency: mainCurrency.value,
    balance: 0,
  };
  errorMessage.value = '';
};

// Reset form when dialog is closed
watch(isVisible, (newValue) => {
  if (!newValue) {
    formData.value = {
      name: '',
      kind: '' as AccountKind | '',
      currency: mainCurrency.value,
      balance: 0,
    };
    errorMessage.value = '';
  }
});
</script>
