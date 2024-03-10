<template>
  <div class="flex flex-wrap items-center gap-4 p-4 md:flex-nowrap">
    <input-field
      name="description"
      type="text"
      v-model="state.desc"
      :label="$t('transaction.form.edit.description')"
    />

    <select-box
      name="from"
      :options="accountSelectList"
      :pre-selected="nullUUID"
      @select="setFrom"
      :label="$t('transaction.form.edit.from')"
    />

    <select-box
      name="to"
      :options="accountSelectList"
      :pre-selected="nullUUID"
      @select="setTo"
      :label="$t('transaction.form.edit.to')"
    />

    <select-box
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

const emit = defineEmits(['saved']);

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const pagination = usePagination();

const { accounts, categories, transactions, accountSelectList, categorySelectList } = storeToRefs(dataStore);

interface FormState {
  desc: string | undefined;
  category: string | undefined;
  from: string | undefined;
  to: string | undefined;
}
const state: Ref<FormState> = ref({
  desc: undefined,
  category: undefined,
  from: undefined,
  to: undefined
} as unknown as FormState);

const setCategory = (e: { id: string }) => {
  const categoryId = categorySelectList.value.find((a) => a.id === e.id)?.id;

  if (categoryId) state.value.category = categoryId;
};

const setFrom = (e: { id: string }) => {
  if (e && e.id) state.value.from = e.id;
};

const setTo = (e: { id: string }) => {
  if (e && e.id) state.value.to = e.id;
};

const prestine: ComputedRef<boolean> = computed(() => {
  return state.value.desc === undefined && state.value.category === undefined;
});

const save = () => {
  if (pagination.selected.value.size < 1) return;

  let res: Z_ApiResponse | undefined = { success: true, errors: [] };

  const selected = Array.from(pagination.selected.value.values());

  selected.forEach((id: string) => {
    let transaction: Z_Transaction | undefined = transactions.value.find((f) => f.id === id);

    if (!transaction) return;

    transaction = z_transaction.parse(transaction);

    if (state.value.desc) transaction.desc = state.value.desc;

    if (state.value.from) {
      const from: Z_Account | undefined = accounts.value.get(state.value.from);
      if (from) transaction.from = from.id;
    }

    if (state.value.to) {
      const to: Z_Account | undefined = accounts.value.get(state.value.to);
      if (to) transaction.to = to.id;
    }

    if (state.value.category) {
      const cat: Z_Category | undefined = categories.value.get(state.value.category);
      if (cat) transaction.category = cat.id;
    }

    res = dataStore.editTransaction(transaction);
    pagination.removeFromSelected(id);
  });

  if (res && res?.success) {
    addNotification('success', t('transaction.form.saved'));
    emit('saved');
  } else {
    addNotification('danger', t('transaction.form.saveFailed'));
  }
};
</script>
