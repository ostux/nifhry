<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled || prestine"
    ok-translation-slug="button.save"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="selectedTransaction">
        {{ $t('transaction.form.edit.single.title') }}
      </template>
      <template v-else>
        {{ $t('transaction.form.add.single.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-4">
      <select-box
        name="category"
        :options="categorySelectList"
        :pre-selected="categorySelectList.find((c) => c.id === state.category)?.id"
        @select="
          setCategory($event);
          autoDescription();
        "
        :label="$t('transaction.form.edit.category')"
      />

      <input-field
        name="description"
        type="text"
        v-model="state.desc"
        :label="$t('transaction.form.edit.description')"
        :errors="errors?.desc"
        required
      />

      <select-box
        name="from"
        :options="accountSelectList"
        :pre-selected="accountSelectList.find((a) => a.id === state.from)?.id || nullUUID"
        @select="setFrom"
        :label="$t('transaction.form.edit.from')"
      />

      <input-field
        name="amount"
        type="number"
        step="any"
        v-model="state.amount"
        :label="$t('transaction.form.edit.amount')"
        :errors="errors?.amount"
        required
      />

      <select-box
        name="to"
        :options="accountSelectList"
        :pre-selected="accountSelectList.find((a) => a.id === state.to)?.id || nullUUID"
        @select="setTo"
        :label="$t('transaction.form.edit.to')"
      />

      <input-field
        name="date"
        type="date"
        v-model="when"
        @change="setWhen"
        :label="$t('transaction.form.edit.when')"
        :errors="errors?.when"
        required
      />

      <select-box
        name="status"
        :options="paidOptions"
        :pre-selected="paidOptions.find((s) => s.id === state.status)?.id"
        @select="setPaid"
        :label="$t('transaction.form.edit.status')"
      />
    </div>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import InputField from '@/components/ui/InputField.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePagination';
import { useTransactions } from '@/composables/useTransactions';
import { useDataStore } from '@/stores/dataStore';
import {
  nullUUID,
  z_transaction,
  z_transactionStatus,
  type Z_ApiResponse,
  type Z_Category,
  type Z_FormError,
  type Z_Transaction
} from '@/types';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import type { ComputedRef } from 'vue';
import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['close']);
defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  }
});

const tr = useTransactions();
const { selectedTransaction } = tr;

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;
const pagination = usePagination();

const { categories, accountSelectList, categorySelectList } = storeToRefs(dataStore);

const state: Ref<Z_Transaction> = ref({
  id: selectedTransaction.value?.id || crypto.randomUUID(),
  desc: selectedTransaction.value?.desc || undefined,
  category: selectedTransaction.value?.category || null,
  from: selectedTransaction.value?.from || nullUUID,
  amount: selectedTransaction.value?.amount || undefined,
  to: selectedTransaction.value?.to || nullUUID,
  when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
  status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
  sId: selectedTransaction.value?.sId || null,
  iId: {
    from: selectedTransaction.value?.iId.from || null,
    to: selectedTransaction.value?.iId.to || null
  }
} as unknown as Z_Transaction);

const when: Ref<string> = ref(moment(selectedTransaction.value?.when).format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});

const setWhen = (e: string) => {
  state.value.when = moment(e).toDate();
};

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

const paidOptions = [
  { id: z_transactionStatus.enum.Paid, name: z_transactionStatus.enum.Paid },
  { id: z_transactionStatus.enum.Pending, name: z_transactionStatus.enum.Pending }
];

const setPaid = (p: { id: string }) => {
  state.value.status = p.id;
};

const prestine: ComputedRef<boolean> = computed(() => {
  const p =
    state.value.id === selectedTransaction.value?.id &&
    state.value.desc === selectedTransaction.value?.desc &&
    state.value.category === selectedTransaction.value?.category &&
    state.value.from === selectedTransaction.value?.from &&
    state.value.amount === selectedTransaction.value?.amount &&
    state.value.to === selectedTransaction.value?.to &&
    moment(state.value.when).isSame(moment(selectedTransaction.value.when), 'day') &&
    state.value.status === selectedTransaction.value.status &&
    state.value.sId === selectedTransaction.value.sId;

  return p;
});

const autoDescription = () => {
  let desc = '';

  if (state.value.desc) return;
  if (state.value.category) {
    const category: Z_Category | undefined = categories.value.get(state.value.category);

    desc = `${category?.description}`;
  }

  state.value.desc = desc;
};

watch(
  [state],
  () => {
    console.log('prestine', prestine.value);
    if (!prestine.value) {
      errors.value = {};

      const valid = z_transaction.safeParse(state.value);

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

      console.log(valid);
      okDisabled.value = !valid.success;
    }
  },
  { deep: true }
);

onMounted(() => {
  if (selectedTransaction.value) {
    state.value = {
      id: selectedTransaction.value?.id || crypto.randomUUID(),
      desc: selectedTransaction.value?.desc,
      category: selectedTransaction.value?.category,
      from: selectedTransaction.value?.from || nullUUID,
      amount: selectedTransaction.value?.amount,
      to: selectedTransaction.value?.to || nullUUID,
      when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
      status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
      sId: selectedTransaction.value?.sId || null,
      iId: {
        from: selectedTransaction.value?.iId?.from || null,
        to: selectedTransaction.value?.iId?.to || null
      }
    } as unknown as Z_Transaction;
  }
});

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (selectedTransaction.value) {
    res = dataStore.editTransaction(state.value);
  } else {
    res = dataStore.addTransaction(state.value);
  }

  if (res && res.success) {
    addNotification('success', t('transaction.form.saved'));
    pagination.startLoading();
    emit('close');
  } else {
    res?.errors.forEach((e) => {
      errors.value['save'] = [e];
    });
    addNotification('danger', t('transaction.form.saveFailed'));
  }

  selectedTransaction.value = undefined;
};
</script>
