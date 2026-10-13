<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="$t('accounts.editAccount')"
    :style="{ width: '30rem' }"
    @hide="handleClose"
  >
    <Form
      v-if="account"
      v-slot="$form"
      :resolver="resolver"
      :initialValues="formData"
      @submit="handleSubmit"
      class="space-y-4"
    >
      <!-- Name Field -->
      <div class="flex flex-col gap-2">
        <label
          for="edit-name"
          class="font-semibold"
          >{{ $t('accounts.name') }}</label
        >
        <InputText
          id="edit-name"
          name="name"
          v-model="formData.name"
          :invalid="$form.name?.invalid"
          :disabled="account.status === 'closed' || account.status === 'archived'"
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
        <label for="edit-kind" class="font-semibold">{{ $t('accounts.type') }}</label>
        <Select
          id="edit-kind"
          name="kind"
          v-model="formData.kind"
          :options="kindOptions"
          optionLabel="label"
          optionValue="value"
          :invalid="$form.kind?.invalid"
          :placeholder="$t('accounts.selectType')"
          :disabled="account.status === 'closed' || account.status === 'archived'"
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
        <label for="edit-currency" class="font-semibold">{{ $t('accounts.currency') }}</label>
        <Select
          id="edit-currency"
          name="currency"
          v-model="formData.currency"
          :options="currencyList"
          optionLabel="name"
          optionValue="code"
          :invalid="$form.currency?.invalid"
          :placeholder="$t('accounts.selectCurrency')"
          :disabled="account.status === 'closed' || account.status === 'archived'"
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
          v-if="formData.currency && formData.currency !== account.cur"
          severity="warn"
          size="small"
          :closable="false"
        >
          {{ $t('accounts.currencyChangeWarning') }}
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

      <!-- Error Message -->
      <Message
        v-if="errorMessage"
        severity="error"
        :closable="false"
      >
        {{ errorMessage }}
      </Message>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <!-- Save button -->
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            :label="$t('common.cancel')"
            severity="secondary"
            @click="handleClose"
          />
          <Button
            type="submit"
            :label="$t('common.save')"
            :loading="isSubmitting"
            :disabled="account.status === 'closed' || account.status === 'archived'"
          />
        </div>

        <!-- Divider -->
        <Divider />

        <!-- Management Actions -->
        <div class="flex flex-wrap justify-between gap-2">
          <Button
            v-if="account.status === 'active'"
            type="button"
            :label="$t('common.close')"
            icon="pi pi-lock"
            severity="secondary"
            outlined
            @click="handleCloseAccount"
          />
          <Button
            v-if="account.status === 'closed' || account.status === 'archived'"
            type="button"
            :label="$t('common.reopen')"
            icon="pi pi-lock-open"
            severity="secondary"
            outlined
            @click="handleReopenAccount"
          />
          <Button
            v-if="account.status !== 'archived'"
            type="button"
            :label="$t('common.archive')"
            icon="pi pi-ban"
            severity="secondary"
            outlined
            @click="handleArchiveAccount"
          />
          <Button
            type="button"
            :label="$t('common.delete')"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="handleDeleteAccount"
          />
        </div>
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useCurrenciesStore } from '@/stores/currencies';
import type { Account, AccountKind } from '@/types';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const props = defineProps<{
  visible: boolean;
  account: Account | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();
const accountStore = useAccountStore();
const authStore = useAuthStore();
const currenciesStore = useCurrenciesStore();
const { currencyList, mainCurrency } = storeToRefs(currenciesStore);
const confirm = useConfirm();

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
      name: z.string().min(1, t('accounts.validation.nameRequired')).min(2, t('accounts.validation.nameMinLength')),
      kind: z.enum(['debit', 'credit', 'loan', 'lending', 'saving', 'investment'], t('accounts.validation.kindRequired')),
      currency: z.string().min(1, t('accounts.validation.currencyRequired')),
    }),
  ),
);

// Watch for account changes to update form data
watch(
  () => props.account,
  (newAccount) => {
    if (newAccount) {
      formData.value.name = newAccount.name;
      formData.value.kind = newAccount.kind;
      formData.value.currency = newAccount.cur || mainCurrency.value;
    }
  },
  { immediate: true },
);

const handleSubmit = async ({ valid }: { valid: boolean }) => {
  if (!valid || !authStore.currentUser || !props.account) return;

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await accountStore.updateAccount(authStore.currentUser.uid, props.account.id, {
      name: formData.value.name,
      kind: formData.value.kind as AccountKind,
      currency: formData.value.currency,
    });

    handleClose();
  } catch (error) {
    console.error('Error updating account:', error);
    errorMessage.value = t('accounts.errors.updateFailed');
  } finally {
    isSubmitting.value = false;
  }
};

const handleReopenAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmReopen'),
    header: t('common.reopen'),
    icon: 'pi pi-lock-open',
    acceptLabel: t('common.reopen'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.reopenAccount(authStore.currentUser!.uid, props.account!.id);
        handleClose();
      } catch (error) {
        console.error('Error reopening account:', error);
        errorMessage.value = t('accounts.errors.reopenFailed');
      }
    },
  });
};

const handleCloseAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmClose'),
    header: t('common.close'),
    icon: 'pi pi-lock',
    acceptLabel: t('common.close'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.closeAccount(authStore.currentUser!.uid, props.account!.id);
        handleClose();
      } catch (error) {
        console.error('Error closing account:', error);
        errorMessage.value = t('accounts.errors.closeFailed');
      }
    },
  });
};

const handleArchiveAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmArchive'),
    header: t('common.archive'),
    icon: 'pi pi-ban',
    acceptLabel: t('common.archive'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.archiveAccount(authStore.currentUser!.uid, props.account!.id);
        handleClose();
      } catch (error) {
        console.error('Error archiving account:', error);
        errorMessage.value = t('accounts.errors.archiveFailed');
      }
    },
  });
};

const handleDeleteAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmDelete'),
    header: t('common.delete'),
    icon: 'pi pi-trash',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await accountStore.deleteAccount(authStore.currentUser!.uid, props.account!.id);
        handleClose();
      } catch (error) {
        console.error('Error deleting account:', error);
        errorMessage.value = t('accounts.errors.deleteFailed');
      }
    },
  });
};

const handleClose = () => {
  isVisible.value = false;
  errorMessage.value = '';
};

// Reset error when dialog is closed
watch(isVisible, (newValue) => {
  if (!newValue) {
    errorMessage.value = '';
  }
});
</script>
