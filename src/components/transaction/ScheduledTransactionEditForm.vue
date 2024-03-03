<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled || prestine"
    ok-translation-slug="button.save"
    :info-text="transaction ? 'transaction.form.add.multi.alert' : ''"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="transaction">
        {{ $t('transaction.form.edit.multi.title') }}
      </template>
      <template v-else>
        {{ $t('transaction.form.add.multi.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-2">
      <input-field
        name="start"
        type="date"
        v-model="start"
        :label="$t('transaction.form.edit.start')"
        :errors="errors?.when"
        :disabled="!!transaction"
        @change="setStart"
      />

      <select-box
        name="frequency"
        :options="frequencyOptions"
        :pre-selected="z_frequency.enum.Monthly"
        @select="setFrequency"
        :label="$t('transaction.form.edit.frequency')"
        :disabled="!!transaction"
      />

      <input-field
        name="repeat"
        type="number"
        step="1"
        v-model="repeat"
        :label="$t('transaction.form.edit.repeat')"
        :errors="errors?.repeat"
        :disabled="!!transaction"
        required
      />

      <select-box
        name="category"
        :options="categorySelectList"
        :pre-selected="categorySelectList.find((c) => c.name === state.category)?.name"
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

      <input-field
        name="description"
        type="number"
        step="any"
        v-model="state.amount"
        :label="$t('transaction.form.edit.amount')"
        :errors="errors?.amount"
        required
      />

      <select-box
        name="account"
        :options="accountSelectList"
        :pre-selected="accountSelectList.find((a) => a.name === state.account)?.name"
        @select="setAccount"
        :label="$t('transaction.form.edit.account')"
      />

      <select-box
        name="to"
        :options="accountSelectList"
        @select="setTo"
        :label="$t('transaction.form.edit.to')"
        :disabled="!!transaction"
      />

      <input-field
        name="when"
        type="date"
        v-model="when"
        :disabled="true"
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
import { useDataStore } from '@/stores/dataStore';
import {
  z_frequency,
  z_transaction,
  z_transactionStatus,
  type Z_ApiResponse,
  type Z_Category,
  type Z_Transaction
} from '@/types';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import type { ComputedRef } from 'vue';
import { computed, onMounted, ref, watch, type PropType, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Z_FormError {
  [index: string]: string[];
}

const emit = defineEmits(['close', 'saved']);
const props = defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  },
  transaction: {
    type: Object as PropType<Z_Transaction>,
    required: false
  }
});

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const { accounts, transactions, categories, accountSelectList, categorySelectList } = storeToRefs(dataStore);

const repeat: Ref<number> = ref(12);
const state: Ref<Z_Transaction> = ref({
  id: props.transaction?.id || crypto.randomUUID(),
  desc: props.transaction?.desc || undefined,
  amount: props.transaction?.amount || undefined,
  category: props.transaction?.category || null,
  account: props.transaction?.account || undefined,
  when: moment(props.transaction?.when).toDate() || moment().toDate(),
  status: props.transaction?.status || z_transactionStatus.enum.Paid,
  sId: props.transaction?.sId || null,
  created: props.transaction?.created || new Date()
} as unknown as Z_Transaction);

const when: Ref<string> = ref(moment(props.transaction?.when).format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));
const accountTo: Ref<string | undefined> = ref(undefined);

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});
const start: Ref<string> = ref(moment().format('YYYY-MM-DD'));

const setStart = (e: string) => {
  console.log(e);
  state.value.when = moment(e).toDate();
  when.value = moment(e).format('YYYY-MM-DD');
};

const setCategory = (e: { id: string }) => {
  const category = categorySelectList.value.find((a) => a.name === e.id)?.name;

  if (category) state.value.category = category;
};

const setAccount = (e: { id: string }) => {
  if (e && e.id) state.value.account = e.id;
};

const setTo = (e: { id: string }) => {
  const a = accounts.value.get(e.id);

  if (a) accountTo.value = a.id;
};

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
  if (!props.transaction) return false;

  return (
    state.value.id === props.transaction.id &&
    state.value.desc === props.transaction.desc &&
    state.value.amount === props.transaction.amount &&
    state.value.category === props.transaction.category &&
    state.value.account === props.transaction.account &&
    state.value.when === props.transaction.when &&
    state.value.status === props.transaction.status &&
    state.value.sId === props.transaction.sId
  );
});

const autoDescription = () => {
  let desc = '';

  if (state.value.desc) return;
  if (state.value.category) {
    const category: Z_Category | undefined = categories.value.get(state.value.category);
    let parentCategory: Z_Category | undefined = undefined;

    if (category?.parent) {
      parentCategory = categories.value.get(category.parent);
    }

    desc = parentCategory?.description ? `${parentCategory.description}: ${category?.description}` : `${category?.description}`;
  }

  state.value.desc = desc;
};

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
  if (props.transaction) {
    state.value = {
      id: props.transaction?.id || crypto.randomUUID(),
      desc: props.transaction?.desc,
      amount: props.transaction?.amount,
      category: props.transaction?.category,
      account: props.transaction?.account,
      when: moment(props.transaction?.when).toDate() || moment().toDate(),
      status: props.transaction?.status || z_transactionStatus.enum.Paid,
      sId: props.transaction?.sId || null,
      created: new Date()
    } as unknown as Z_Transaction;
  }
});

const addTransactions = () => {
  const scheduleId = crypto.randomUUID();
  let transactions: any[] = Array.from({ length: repeat.value }, (value, index) => index);

  transactions = transactions.map((t) => {
    const transaction: Z_Transaction = {
      id: crypto.randomUUID(),
      desc: state.value.desc,
      amount: state.value.amount,
      category: state.value.category,
      account: state.value.account,
      when: moment().toDate(),
      status: state.value.status,
      sId: scheduleId,
      created: new Date()
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

  const response: Z_ApiResponse = { success: true, errors: [] };

  transactions.forEach((transaction) => {
    if (z_transaction.safeParse(transaction).success) {
      let res: Z_ApiResponse | undefined = undefined;

      res = dataStore.addTransaction(transaction);

      if (res && !res.success) {
        response.success = false;
        response.errors.push(...res.errors);
      }

      if (accountTo.value) {
        const tNew = z_transaction.parse(state.value);

        tNew.id = crypto.randomUUID();
        tNew.account = accountTo.value;
        tNew.amount = tNew.amount * -1;

        console.log(tNew);

        res = dataStore.addTransaction(tNew);

        if (res && !res.success) {
          response.success = false;
          response.errors.push(...res.errors);
        }

        console.log(response.errors);
      }
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

  const transactionsToEdit = transactions.value.filter((t) => t.sId === state.value.sId);

  transactionsToEdit.forEach((t) => {
    const tToEdit = z_transaction.parse(t);

    tToEdit.category = state.value.category;
    tToEdit.desc = state.value.desc;

    if (tToEdit.status === z_transactionStatus.enum.Pending) {
      tToEdit.amount = state.value.amount;
      tToEdit.account = state.value.account;
    }

    const res = dataStore.editTransaction(tToEdit);
    if (res && !res.success) {
      response.success = false;
      response.errors.push(...res.errors);
    }
  });

  return response;
};

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (props.transaction) {
    res = editTransactions();
  } else {
    res = addTransactions();
  }

  if (res && res.success) {
    addNotification('success', t('transaction.form.saved'));
    emit('saved');
    emit('close');
  } else {
    res?.errors.forEach((e) => {
      errors.value['save'] = [e];
    });
    addNotification('danger', t('transaction.form.saveFailed'));
  }
};
</script>
