<template>
  <BaseModal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled || prestine"
    ok-translation-slug="button.save"
    :info-text="selectedTransaction?.sId ? 'transaction.form.add.multi.alert' : ''"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="selectedTransaction?.sId">
        {{ $t('transaction.form.edit.multi.title') }}
      </template>
      <template v-else>
        {{ $t('transaction.form.add.multi.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-2">
      <InputField
        name="start"
        type="date"
        v-model="start"
        :label="$t('transaction.form.edit.start')"
        :errors="errors?.when"
        :disabled="!!selectedTransaction?.sId"
        @change="setStart"
      />

      <div class="flex flex-row gap-2">
        <SelectBox
          name="frequency"
          :options="frequencyOptions"
          :pre-selected="z_frequency.enum.Monthly"
          @select="setFrequency"
          :label="$t('transaction.form.edit.frequency')"
          :disabled="!!selectedTransaction?.sId"
        />

        <InputField
          name="repeat"
          type="number"
          step="1"
          v-model="repeat"
          :label="$t('transaction.form.edit.repeat')"
          :errors="errors?.repeat"
          :disabled="!!selectedTransaction?.sId"
          required
        />
      </div>

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
        :disabled="true"
      />

      <InputField
        name="when"
        type="date"
        v-model="when"
        :disabled="true"
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
  </BaseModal>
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
  z_frequency,
  z_transaction,
  z_transactionStatus,
  type Z_Account,
  type Z_Accounts,
  type Z_ApiResponse,
  type Z_Categories,
  type Z_SelectItemObject,
  type Z_Transaction,
  type Z_Transactions
} from '@/types';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import type { ComputedRef } from 'vue';
import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Z_FormError {
  [index: string]: string[];
}

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

const { accounts, accountSelectList, categorySelectList, transactions } = storeToRefs(dataStore);

const repeat: Ref<number> = ref(12);
const state: Ref<Z_Transaction> = ref({
  id: selectedTransaction.value?.id || crypto.randomUUID(),
  desc: selectedTransaction.value?.desc || undefined,
  category: selectedTransaction.value?.category || null,
  account: selectedTransaction.value?.account || undefined,
  in: selectedTransaction.value?.in || 0,
  out: selectedTransaction.value?.out || 0,
  opId: null,
  when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
  status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
  sId: selectedTransaction.value?.sId || null,
  iId: selectedTransaction.value?.iId || null
} as unknown as Z_Transaction);

const transferTarget: Ref<string> = ref(nullUUID);

const when: Ref<string> = ref(moment(selectedTransaction.value?.when).format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});
const start: Ref<string> = ref(moment().format('YYYY-MM-DD'));

const setStart = (e: string) => {
  state.value.when = moment(e).toDate();
  when.value = moment(e).format('YYYY-MM-DD');
};

const setCategory = (e: { id: string }) => {
  const categoryId = (categorySelectList.value as unknown as Z_SelectItemObject[]).find(
    (a: Z_SelectItemObject) => a.id === e.id
  )?.id;

  if (categoryId) state.value.category = categoryId;
};

const setAccount = (e: { id: string }) => {
  if (e && e.id) state.value.account = e.id;
};

const setTransferTarget = (e: { id: string }) => {
  if (e && e.id) transferTarget.value = e.id;

  const targetAccountExist = (accounts.value as unknown as Z_Accounts).get(e.id);

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

const frequencyOptions = [
  { id: z_frequency.enum.Yearly, name: z_frequency.enum.Yearly },
  { id: z_frequency.enum.Monthly, name: z_frequency.enum.Monthly },
  { id: z_frequency.enum.Weekly, name: z_frequency.enum.Weekly },
  { id: z_frequency.enum.Daily, name: z_frequency.enum.Daily }
];
const selectedFrequency: Ref<string> = ref(z_frequency.enum.Monthly);
const setFrequency = (f: { id: string }) => {
  selectedFrequency.value = f.id;
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

    okDisabled.value = !valid.success;
  },
  { deep: true }
);

onMounted(() => {
  if (selectedTransaction.value) {
    state.value = {
      id: selectedTransaction.value?.id || crypto.randomUUID(),
      desc: selectedTransaction.value?.desc,
      category: selectedTransaction.value?.category,
      account: selectedTransaction.value?.account,
      in: selectedTransaction.value?.in || 0,
      out: selectedTransaction.value?.out || 0,
      opId: null,
      when: moment(selectedTransaction.value?.when).toDate() || moment().toDate(),
      status: selectedTransaction.value?.status || z_transactionStatus.enum.Paid,
      sId: selectedTransaction.value?.sId || null,
      iId: selectedTransaction.value?.iId || null
    } as unknown as Z_Transaction;

    if (selectedTransaction.value?.sId !== null) {
      const trCount = (transactions.value as unknown as Z_Transactions).filter(
        (t: Z_Transaction) => t.sId === selectedTransaction.value?.sId
      );

      if (trCount.length > 0 && trCount[0].opId !== null && trCount[0].opId !== nullUUID) {
        repeat.value = Math.ceil(trCount.length / 2);
      } else {
        repeat.value = trCount.length;
      }
    }

    if (selectedTransaction.value?.opId) {
      const opTr = dataStore.transactionById(selectedTransaction.value.opId);

      let opAccount: Z_Account | undefined = undefined;

      if (opTr) {
        opAccount = dataStore.accountById(opTr.account);
      }

      if (opAccount) transferTarget.value = opAccount.id;
    }
  }
});

const addTransactions = () => {
  const scheduleId = crypto.randomUUID();
  let newTransactions: any[] = Array.from({ length: repeat.value }, (value, index) => index);

  newTransactions = newTransactions.map((t) => {
    const transaction: Z_Transaction = {
      id: crypto.randomUUID(),
      desc: state.value.desc,
      category: state.value.category,
      account: state.value.account,
      in: state.value.in,
      out: state.value.out,
      opId: null,
      when: moment().toDate(),
      status: state.value.status,
      sId: scheduleId,
      iId: null
    };

    if (t > 0) {
      switch (selectedFrequency.value) {
        case z_frequency.enum.Yearly:
          transaction.when = moment(start.value).add(t, 'years').toDate();
          if (moment(transaction.when).isAfter(moment(), 'year')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Monthly:
          transaction.when = moment(start.value).add(t, 'months').toDate();
          if (moment(transaction.when).isAfter(moment(), 'month')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Weekly:
          transaction.when = moment(start.value).add(t, 'weeks').toDate();
          if (moment(transaction.when).isAfter(moment(), 'week')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Daily:
          transaction.when = moment(start.value).add(t, 'days').toDate();
          if (moment(transaction.when).isAfter(moment(), 'day')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
      }
    } else if (t < 0) {
      switch (selectedFrequency.value) {
        case z_frequency.enum.Yearly:
          transaction.when = moment(start.value).subtract(t, 'years').toDate();
          if (moment(transaction.when).isAfter(moment(), 'year')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Monthly:
          transaction.when = moment(start.value).subtract(t, 'months').toDate();
          if (moment(transaction.when).isAfter(moment(), 'month')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Weekly:
          transaction.when = moment(start.value).subtract(t, 'weeks').toDate();
          if (moment(transaction.when).isAfter(moment(), 'week')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
        case z_frequency.enum.Daily:
          transaction.when = moment(start.value).subtract(t, 'days').toDate();
          if (moment(transaction.when).isAfter(moment(), 'day')) {
            transaction.status = z_transactionStatus.enum.Pending;
          }
          break;
      }
    } else {
      transaction.when = moment(start.value).toDate();
      if (moment(transaction.when).isAfter(moment(), 'day')) {
        transaction.status = z_transactionStatus.enum.Pending;
      }
    }

    return transaction;
  });

  const opTransactions: Z_Transactions = [];
  console.log(transferTarget.value);

  if (transferTarget.value && transferTarget.value !== nullUUID) {
    newTransactions.forEach((t) => {
      const opTr = z_transaction.parse(t);

      opTr.id = crypto.randomUUID();
      opTr.account = transferTarget.value;
      opTr.in = t.out;
      opTr.out = t.in;

      opTransactions.push(opTr);
    });
  }

  const response: Z_ApiResponse = { success: true, errors: [] };

  newTransactions.forEach((transaction) => {
    if (z_transaction.safeParse(transaction).success) {
      let res: Z_ApiResponse | undefined = undefined;

      res = dataStore.addTransaction(transaction);

      if (res && !res.success) {
        response.success = false;
        response.errors.push(...res.errors);
      }
    } else {
      console.error('transaction not valid: ', z_transaction.safeParse(transaction).error);
    }
  });

  opTransactions.forEach((transaction) => {
    if (z_transaction.safeParse(transaction).success) {
      let res: Z_ApiResponse | undefined = undefined;

      res = dataStore.addTransaction(transaction, true);

      if (res && !res.success) {
        response.success = false;
        response.errors.push(...res.errors);
      }
    } else {
      console.error('transaction not valid: ', z_transaction.safeParse(transaction).error);
    }
  });

  dataStore.sortTransactions();
  dataStore.recalculateBalances();

  return response;
};

const editTransactions = () => {
  const response: Z_ApiResponse = { success: true, errors: [] };

  if (!state.value.sId) {
    response;
  }

  const transactionsToEdit = (transactions.value as unknown as Z_Transactions).filter(
    (t) => t.sId === state.value.sId && t.account === state.value.account
  );

  transactionsToEdit.forEach((t) => {
    const tToEdit = z_transaction.parse(t);

    tToEdit.category = state.value.category;
    tToEdit.desc = state.value.desc;

    if (tToEdit.status === z_transactionStatus.enum.Pending) {
      tToEdit.in = state.value.in;
      tToEdit.out = state.value.out;
      tToEdit.account = state.value.account;
    }

    const res = dataStore.editTransaction(tToEdit);
    if (res && !res.success) {
      response.success = false;
      response.errors.push(...res.errors);
    } else {
      console.log(res);
    }
  });

  return response;
};

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (selectedTransaction.value?.sId) {
    res = editTransactions();
  } else {
    res = addTransactions();
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
