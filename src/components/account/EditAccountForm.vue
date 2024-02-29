<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled"
    ok-translation-slug="button.save"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="account">
        {{ $t('account.form.edit.title') }}
      </template>
      <template v-else>
        {{ $t('account.form.add.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-4">
      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('account.form.edit.name') }}

        <input
          type="text"
          name="name"
          v-model="state.name"
          class="button w-full text-gray-800 dark:text-white"
        />
      </label>

      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('account.form.edit.startingBalance') }}

        <input
          type="number"
          step="any"
          name="starting-balance"
          v-model="state.startingBalance"
          class="button w-full text-gray-800 dark:text-white"
        />
      </label>

      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('account.form.edit.accountType') }}

        <select-box
          :options="accountTypes"
          :pre-selected="selectedType"
          @select="setAccountType"
        />
      </label>
    </div>

    <template v-slot:errors>
      <span
        v-for="error in errors"
        :key="error"
        >{{ error }}</span
      >
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { z_account, z_acctountType, type Z_Account, type Z_ApiResponse } from '@/types';
import { ref, watch, type PropType, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['close']);
const props = defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  },
  account: {
    type: Object as PropType<Z_Account>,
    required: false
  }
});

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const accountTypes = [
  { id: z_acctountType.enum.Credit, label: `account.type.${z_acctountType.enum.Credit}` },
  { id: z_acctountType.enum.Debit, label: `account.type.${z_acctountType.enum.Debit}` },
  { id: z_acctountType.enum.Loan, label: `account.type.${z_acctountType.enum.Loan}` },
  { id: z_acctountType.enum.Saving, label: `account.type.${z_acctountType.enum.Saving}` }
];

const state: Ref<Z_Account> = ref({
  id: props.account?.id || crypto.randomUUID(),
  name: props.account?.name || '',
  balance: props.account?.balance || 0,
  startingBalance: props.account?.startingBalance || 0,
  createdAt: props.account?.createdAt || new Date(),
  aType: accountTypes.find((a) => a.id === props.account?.aType)?.id || z_acctountType.enum.Debit
} as Z_Account);

const selectedType = ref(accountTypes.find((a) => a.id === state.value.aType));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<string[]> = ref([]);

const setAccountType = (e: { id: string }) => {
  const t = accountTypes.find((a) => a.id === e.id)?.id;

  console.log(t);

  if (t) state.value.aType = t;
};

watch(
  [state],
  () => {
    errors.value = [];

    const valid = z_account.safeParse(state.value);

    if (!valid.success) {
      valid.error.errors.forEach((err) => {
        errors.value.push(err.message);
      });
    }

    okDisabled.value = !valid.success;
  },
  { deep: true }
);

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (props.account) {
    res = dataStore.editAccount(state.value);
  } else {
    res = dataStore.addAccount(state.value);
  }

  if (res && res.success) {
    addNotification('success', t('account.form.saved'));
    emit('close');
  } else {
    res?.errors.forEach((e) => {
      errors.value.push(e);
    });
    addNotification('danger', t('account.form.saveFailed'));
  }
};
</script>
