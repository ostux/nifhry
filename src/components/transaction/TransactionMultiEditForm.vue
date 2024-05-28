<template>
  <div class="flex flex-wrap items-center gap-4 p-4 md:flex-nowrap">
    <InputField
      name="description"
      type="text"
      v-model="state.desc"
      :label="$t('transaction.form.edit.description')"
    />

    <SelectBox
      name="account"
      :options="accountSelectList"
      :pre-selected="nullUUID"
      @select="setAccount"
      :label="$t('transaction.form.edit.account')"
    />

    <SelectBox
      name="category"
      :options="categorySelectList"
      :pre-selected="nullUUID"
      @select="setCategory"
      :label="$t('transaction.form.edit.category')"
    />

    <button
      class="button mt-[26px]"
      @click="save"
      :disabled="prestine"
    >
      {{ $t('button.save') }}
    </button>

    <TrashIcon
      class="mx-3 my-2 w-24 hover:text-pine-green-800 dark:hover:text-pine-green-300"
      @click="deleteSelected"
    />
  </div>
</template>

<script setup lang="ts">
import InputField from '@/components/ui/InputField.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { nullUUID, z_transaction, type Z_Account, type Z_ApiResponse, type Z_Category, type Z_Transaction } from '@/types';
import { storeToRefs } from 'pinia';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { TrashIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const pagination = usePagination();

const { accounts, categories, transactions, accountSelectList, categorySelectList } = storeToRefs(dataStore);

interface FormState {
  desc: string | undefined;
  category: string | undefined;
  account: string | undefined;
  opId: string | undefined;
}
const state: Ref<FormState> = ref({
  desc: undefined,
  category: undefined,
  account: undefined,
  opId: undefined
} as unknown as FormState);

const setCategory = (e: { id: string }) => {
  const categoryId = categorySelectList.value.find((a) => a.id === e.id)?.id;

  if (categoryId) state.value.category = categoryId;
};

const setAccount = (e: { id: string }) => {
  if (e && e.id) state.value.account = e.id;
};

const prestine: ComputedRef<boolean> = computed(() => {
  return state.value.desc === undefined && state.value.category === undefined;
});

const deleteSelected = () => {
  if (pagination.selected.value.size < 1) return;

  let res: boolean = false;

  const selected = Array.from(pagination.selected.value.values());

  selected.forEach((id: string) => {
    let transaction: Z_Transaction | undefined = transactions.value.find((f) => f.id === id);

    if (!transaction) return;

    transaction = z_transaction.parse(transaction);

    res = dataStore.removeTransaction(transaction.id);
    pagination.removeFromSelected(id);

    if (res) {
      addNotification('success', t('transaction.form.delete.info', { name: transaction.desc }));
    } else {
      addNotification('danger', t('transaction.form.delete.failed'));
    }
  });

  pagination.clearSelected();
  pagination.startLoading();
};

const save = () => {
  if (pagination.selected.value.size < 1) return;

  let res: Z_ApiResponse | undefined = { success: true, errors: [] };

  const selected = Array.from(pagination.selected.value.values());

  // TODO: should opposite transactions need this update???
  selected.forEach((id: string) => {
    let transaction: Z_Transaction | undefined = transactions.value.find((f) => f.id === id);

    if (!transaction) return;

    transaction = z_transaction.parse(transaction);

    if (state.value.desc) transaction.desc = state.value.desc;

    if (state.value.account) {
      const account: Z_Account | undefined = accounts.value.get(state.value.account);
      if (account) transaction.account = account.id;
    }

    if (state.value.opId) {
      const to: Z_Account | undefined = accounts.value.get(state.value.opId);
      if (to) transaction.opId = to.id;
    }

    if (state.value.category) {
      const cat: Z_Category | undefined = categories.value.get(state.value.category);
      if (cat) {
        transaction.category = cat.id;
      } else {
        transaction.category = null;
      }
    }

    res = dataStore.editTransaction(transaction);
    pagination.removeFromSelected(id);
  });

  if (res && res?.success) {
    addNotification('success', t('transaction.form.saved'));
    pagination.clearSelected();
    pagination.startLoading();
  } else {
    addNotification('danger', t('transaction.form.saveFailed'));
  }
};
</script>
