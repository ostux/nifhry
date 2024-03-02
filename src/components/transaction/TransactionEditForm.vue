<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled || prestine"
    ok-translation-slug="button.save"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="transaction">
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
        name="from"
        :options="accountSelectList"
        :pre-selected="accountSelectList.find((a) => a.id === state.from)?.id"
        @select="setFrom"
        :label="$t('transaction.form.edit.from')"
      />

      <select-box
        name="to"
        :options="accountSelectList"
        :pre-selected="accountSelectList.find((a) => a.id === state.to)?.id"
        @select="setTo"
        :label="$t('transaction.form.edit.to')"
      />

      <input-field
        :name="state.when.toString()"
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
import { computed, onMounted, ref, watch, type PropType, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { accountSelectList, categorySelectList } = storeToRefs(dataStore);

const state: Ref<Z_Transaction> = ref({
  id: props.transaction?.id || crypto.randomUUID(),
  desc: props.transaction?.desc || undefined,
  amount: props.transaction?.amount || undefined,
  category: props.transaction?.category || undefined,
  from: props.transaction?.from || nullUUID,
  to: props.transaction?.to || nullUUID,
  when: moment(props.transaction?.when).toDate() || moment().toDate(),
  status: props.transaction?.status || z_transactionStatus.enum.Paid,
  sId: props.transaction?.sId || null
} as unknown as Z_Transaction);

const when: Ref<string> = ref(moment(props.transaction?.when).format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});

const setWhen = (e: string) => {
  state.value.when = moment(e).toDate();
};

const setCategory = (e: { id: string }) => {
  const category = categorySelectList.value.find((a) => a.id === e.id)?.id;

  if (category) state.value.category = category;
};

const setFrom = (e: { id: string }) => {
  const account = accountSelectList.value.find((a) => a.id === e.id)?.id;

  if (account) state.value.from = account;
};

const setTo = (e: { id: string }) => {
  const account = accountSelectList.value.find((a) => a.id === e.id)?.id;

  if (account) state.value.to = account;
};

const paidOptions = [
  { id: z_transactionStatus.enum.Paid, name: z_transactionStatus.enum.Paid },
  { id: z_transactionStatus.enum.Pending, name: z_transactionStatus.enum.Pending }
];

const setPaid = (p: { id: string }) => {
  state.value.status = p.id;
};

const prestine: ComputedRef<boolean> = computed(() => {
  if (!props.transaction) return false;

  return (
    state.value.id === props.transaction.id &&
    state.value.desc === props.transaction.desc &&
    state.value.amount === props.transaction.amount &&
    state.value.category === props.transaction.category &&
    state.value.from === props.transaction.from &&
    state.value.to === props.transaction.to &&
    state.value.when === props.transaction.when &&
    state.value.status === props.transaction.status &&
    state.value.sId === props.transaction.sId
  );
});

const autoDescription = () => {
  let desc = '';

  if (state.value.desc) return;
  if (state.value.category) {
    const category: Z_Category | undefined = dataStore.getCategory(state.value.category);
    let parentCategory: Z_Category | undefined = undefined;

    if (category?.parent) {
      parentCategory = dataStore.getCategory(category.parent);
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
      from: props.transaction?.from || nullUUID,
      to: props.transaction?.to || nullUUID,
      when: moment(props.transaction?.when).toDate() || moment().toDate(),
      status: props.transaction?.status || z_transactionStatus.enum.Paid,
      sId: props.transaction?.sId || null
    } as unknown as Z_Transaction;
  }
});

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  console.log(state.value);

  if (props.transaction) {
    res = dataStore.editTransaction(state.value);
  } else {
    res = dataStore.addTransaction(state.value);
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
