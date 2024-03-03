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
      <input-field
        name="name"
        type="text"
        v-model="state.name"
        :label="$t('account.form.edit.name')"
        :errors="errors?.name"
        required
      />

      <select-box
        name="status"
        :options="accountTypes"
        :pre-selected="state.aType || z_acctountType.enum.Debit"
        @select="setAccountType"
        :label="$t('account.form.edit.accountType')"
      />
    </div>

    <template
      v-slot:errors
      v-if="resError.length"
    >
      <ul>
        <li
          v-for="er in resError"
          :key="er"
        >
          {{ $t(er) }}
        </li>
      </ul>
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import InputField from '@/components/ui/InputField.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { z_account, z_acctountType, type Z_Account, type Z_ApiResponse, type Z_FormError } from '@/types';
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

const notifications = useNotification();
const { addNotification } = notifications;

const dataStore = useDataStore();

const accountTypes = [
  { id: z_acctountType.enum.Credit, name: t(`account.type.${z_acctountType.enum.Credit}`) },
  { id: z_acctountType.enum.Debit, name: t(`account.type.${z_acctountType.enum.Debit}`) },
  { id: z_acctountType.enum.Loan, name: t(`account.type.${z_acctountType.enum.Loan}`) },
  { id: z_acctountType.enum.Saving, name: t(`account.type.${z_acctountType.enum.Saving}`) }
];

const state: Ref<Z_Account> = ref({
  id: props.account?.id || crypto.randomUUID(),
  name: props.account?.name || '',
  balance: props.account?.balance || 0,
  aType: accountTypes.find((a) => a.id === props.account?.aType)?.id || z_acctountType.enum.Debit
} as Z_Account);
const resError: Ref<string[]> = ref([]);

// const selectedType = ref(accountTypes.find((a) => a.id === state.value.aType));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});

const setAccountType = (e: { id: string }) => {
  const t = accountTypes.find((a) => a.id === e.id)?.id;

  if (t) state.value.aType = t;
};

watch(
  [state],
  () => {
    errors.value = {};

    const valid = z_account.safeParse(state.value);

    if (!valid.success) {
      valid.error.issues.forEach((err) => {
        err.path.forEach((p) => {
          if (!errors.value[p]) {
            errors.value[p] = [];
          }

          errors.value[p].push(err.message);
        });
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
    resError.value = res.errors;
    addNotification('danger', t('account.form.saveFailed'));
  }
};
</script>
