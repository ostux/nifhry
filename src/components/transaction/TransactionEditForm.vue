<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled || prestine"
    ok-translation-slug="button.save"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="selectedTransaction?.id">
        {{ $t('transaction.form.edit.single.title') }}
      </template>
      <template v-else>
        {{ $t('transaction.form.add.single.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-4">
      <SelectBox
        name="category"
        :options="categorySelectList"
        :pre-selected="categorySelectList.find((c) => c.id === state.category)?.id"
        @select="
          setCategory($event);
          state.desc = state.desc || dataStore.categoryById(state.category)?.description || '';
        "
        :label="$t('transaction.form.edit.category')"
      />

      <InputField
        name="description"
        type="text"
        v-model="state.desc"
        :label="$t('transaction.form.edit.description')"
        :errors="errors?.desc"
        required
      />

      <div class="flex flex-row gap-2">
        <SelectBox
          name="account"
          :options="accountSelectList"
          :pre-selected="accountSelectList.find((a) => a.id === state.account)?.id || nullUUID"
          @select="setAccount"
          :label="$t('transaction.form.edit.account')"
        />

        <SelectBox
          name="accountTo"
          :options="accountSelectList.filter((a) => a.id !== state.account)"
          :pre-selected="getOppositeTransactionAccountId"
          @select="setTransferTarget"
          :label="$t('transaction.form.edit.accountTo')"
          :disabled="state.opId !== nullUUID && state.opId !== null"
        />
      </div>

      <div class="flex flex-row gap-2">
        <InputField
          name="in"
          type="number"
          step="any"
          v-model="state.in"
          :label="$t('transaction.form.edit.in')"
          :errors="errors?.in"
          required
        />

        <InputField
          name="out"
          type="number"
          step="any"
          v-model="state.out"
          :label="$t('transaction.form.edit.out')"
          :errors="errors?.out"
          required
        />
      </div>

      <SelectBox
        name="opId"
        :options="transactionSelectList"
        :pre-selected="preSelectedTransactionId"
        @select="setOposite"
        :label="$t('transaction.form.edit.opId')"
      />

      <InputField
        name="date"
        type="date"
        v-model="when"
        @change="setWhen"
        :label="$t('transaction.form.edit.when')"
        :errors="errors?.when"
        required
      />

      <SelectBox
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
  type Z_Account,
  type Z_ApiResponse,
  type Z_FormError,
  type Z_SelectItemObject,
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

const { accounts, transactions, accountSelectList, categorySelectList } = storeToRefs(dataStore);

const state: Ref<Z_Transaction> = ref({
  id: selectedTransaction.value?.id || crypto.randomUUID(),
  desc: selectedTransaction.value?.desc || undefined,
  category: selectedTransaction.value?.category || null,
  from: selectedTransaction.value?.account || nullUUID,
  in: selectedTransaction.value?.in || 0,
  out: selectedTransaction.value?.out || 0,
  opId: selectedTransaction.value?.opId || nullUUID,
  when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
  status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
  sId: selectedTransaction.value?.sId || null,
  iId: selectedTransaction.value?.iId || null
} as unknown as Z_Transaction);

const transferTarget: Ref<string> = ref(nullUUID);

const when: Ref<string> = ref(moment(selectedTransaction.value?.when).format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});

const setWhen = (e: string) => {
  state.value.when = moment(e).toDate();
};

const setCategory = (e: { id: string }) => {
  const categoryId = categorySelectList.value.find((a: Z_SelectItemObject) => a.id === e.id)?.id;

  if (categoryId) state.value.category = categoryId;
};

const setAccount = (e: { id: string }) => {
  if (e && e.id) state.value.account = e.id;
};

const setTransferTarget = (e: { id: string }) => {
  if (e && e.id) transferTarget.value = e.id;

  const targetAccountExist = accounts.value.get(e.id);

  if (!targetAccountExist) transferTarget.value = nullUUID;
};

const setOposite = (e: { id: string }) => {
  if (e && e.id) state.value.opId = e.id;
};

const getOppositeTransactionAccountId: ComputedRef<string> = computed(() => {
  if (!selectedTransaction.value) return nullUUID;

  const opTr = dataStore.transactionById(selectedTransaction.value.opId);

  let opAccount: Z_Account | undefined = undefined;

  if (opTr) {
    opAccount = dataStore.accountById(opTr.account);
  }

  if (opAccount) return opAccount.id;

  return nullUUID;
});

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
    state.value.account === selectedTransaction.value?.account &&
    state.value.in === selectedTransaction.value?.in &&
    state.value.out === selectedTransaction.value?.out &&
    state.value.opId === selectedTransaction.value?.opId &&
    moment(state.value.when).isSame(moment(selectedTransaction.value.when), 'day') &&
    state.value.status === selectedTransaction.value.status &&
    state.value.sId === selectedTransaction.value.sId;

  return p;
});

const transactionSelectList: Ref<Z_SelectItemObject[]> = ref(
  dataStore.transactionSelectList(state.value.account, state.value.when, state.value.in, state.value.out)
);
const preSelectedTransactionId: Ref<string | undefined> = ref(dataStore.transactionById(state.value.opId)?.id);

watch(
  [state],
  () => {
    console.log('prestine', prestine.value);

    transactionSelectList.value = dataStore.transactionSelectList(
      state.value.account,
      state.value.when,
      state.value.in,
      state.value.out
    );

    preSelectedTransactionId.value = dataStore.transactionById(state.value.opId)?.id;

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
      account: selectedTransaction.value?.account || nullUUID,
      in: selectedTransaction.value?.in || 0,
      out: selectedTransaction.value?.out || 0,
      opId: selectedTransaction.value?.opId || nullUUID,
      when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
      status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
      sId: selectedTransaction.value?.sId || null,
      iId: selectedTransaction.value?.iId || null
    } as unknown as Z_Transaction;
  }
});

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;
  let opRes: Z_ApiResponse | undefined = undefined;
  let opTr: Z_Transaction | undefined = undefined;
  let opOriginalTr: Z_Transaction | undefined = undefined;

  if ((state.value.opId === nullUUID || state.value.opId === null) && transferTarget.value && transferTarget.value !== nullUUID) {
    opTr = z_transaction.parse(state.value);

    opTr.id = crypto.randomUUID();
    opTr.account = transferTarget.value;
    opTr.in = state.value.out;
    opTr.out = state.value.in;
  } else {
    if (state.value.opId !== nullUUID && state.value.opId !== null) {
      if (selectedTransaction.value) {
        opTr = transactions.value.find((f: Z_Transaction) => f.id === state.value.opId);

        if (!opTr) {
          state.value.opId = null;
        } else {
          opOriginalTr = z_transaction.parse(opTr);
        }
      }
    }
  }

  const trExist: Z_Transaction | undefined = transactions.value.find((t: Z_Transaction) => t.id === state.value.id);
  const opTrExist: Z_Transaction | undefined = transactions.value.find((t: Z_Transaction) => t.id === opTr?.id);

  if (trExist && selectedTransaction.value) {
    res = dataStore.editTransaction(state.value, true);
    if (opTr) {
      if (!opTrExist) {
        opRes = dataStore.addTransaction(opTr, true);
      }
    }
  } else {
    res = dataStore.addTransaction(state.value, true);
    if (opTr) {
      const opTrExist: Z_Transaction | undefined = transactions.value.find((t: Z_Transaction) => t.id === opTr.id);
      if (!opTrExist) opRes = dataStore.addTransaction(opTr, true);
    }
  }

  dataStore.sortTransactions();
  dataStore.recalculateBalances();

  if (!opTrExist) {
    if (opRes && !opRes.success) {
      if (opOriginalTr) {
        dataStore.editTransaction(opOriginalTr);
      }
      res?.errors.forEach((e) => {
        errors.value['save'] = [e];
      });
      addNotification('danger', t('transaction.form.saveFailed'));
      pagination.startLoading();
      emit('close');
      return;
    }
  }

  if (res && res.success) {
    addNotification('success', t('transaction.form.saved'));
    pagination.startLoading();
    emit('close');
  }

  selectedTransaction.value = undefined;
};
</script>
