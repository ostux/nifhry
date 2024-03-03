<template>
  <div class="flex w-full flex-grow flex-col gap-4">
    <template v-if="account">
      <h1 class="text-2xl">{{ $t('import_transactions.title', { accountName: account.name }) }}</h1>
      <div class="flex justify-between gap-4 rounded-md border border-gray-400/50 p-4">
        <input
          type="file"
          id="transactionFile"
          tabindex="0"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          @change="fileChanged"
        />
        <button
          class="button"
          @click="importTransactions"
          :disabled="!fileSelected"
        >
          import
        </button>
      </div>
      <div
        v-if="stepOne"
        class="flex flex-col gap-4 rounded-md border border-gray-400/50 p-4"
      >
        <p
          class="block rounded-md border border-purple-300 bg-purple-100 p-4 text-black dark:border-purple-900 dark:bg-purple-800 dark:text-white"
        >
          {{ $t('import_transactions.step_one') }}
        </p>

        <select-box
          name="date"
          :options="fields"
          @select="setDateField"
          :label="$t('import_transactions.select.date')"
        />

        <select-box
          name="description"
          :options="fields"
          @select="setDescField"
          :label="$t('import_transactions.select.description')"
        />

        <select-box
          name="category"
          :options="fields"
          @select="setCategoryField"
          :label="$t('import_transactions.select.category')"
        />

        <select-box
          name="out"
          :options="fields"
          @select="setOutField"
          :label="$t('import_transactions.select.out')"
        />

        <select-box
          name="in"
          :options="fields"
          @select="setInField"
          :label="$t('import_transactions.select.in')"
        />
      </div>
      <div
        v-if="stepTwo"
        class="mx-auto w-24 p-4"
      >
        <simple-button
          v-if="!importing"
          :disabled="!stepTwo"
          label="import"
          @click="doImport"
        />
        <Cog6ToothIcon
          v-else
          class="size-16 animate-spin text-purple-500"
        />
      </div>
    </template>
    <template v-else>
      <div>Account not found...</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import SelectBox from '@/components/ui/SelectBox.vue';
import SimpleButton from '@/components/ui/SimpleButton.vue';
import { useCapitalize } from '@/composables/useCapitalize';
import { useDataStore } from '@/stores/dataStore';
import { z_transaction, z_transactionStatus, type Z_Account, type Z_Transaction } from '@/types';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import moment from 'moment';
import Papa, { type ParseResult } from 'papaparse';
import { storeToRefs } from 'pinia';
import type { ComputedRef } from 'vue';
import { computed, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

const route = useRoute();
const router = useRouter();

const dataStore = useDataStore();
const { accounts } = storeToRefs(dataStore);

const capitalizeComposable = useCapitalize();
const { capitalize } = capitalizeComposable;

const res: Ref<ParseResult<any> | null> = ref(null);
const fileSelected: Ref<boolean> = ref(false);
const stepOne: Ref<boolean> = ref(false);
const stepTwo: Ref<boolean> = ref(false);

const importing: Ref<boolean> = ref(false);

const account: ComputedRef<Z_Account | undefined> = computed(() => accounts.value.get(route.params.slug as unknown as string));

interface Field {
  id: string;
  name: string;
}

const fields: Ref<Field[]> = ref([]);

const selectedFields = z.object({
  date: z.string().min(1),
  desc: z.string().min(1),
  category: z.string().min(1).nullable(),
  in: z.string().min(1),
  out: z.string().min(1)
});
type SelectedFields = z.infer<typeof selectedFields>;

const state: Ref<SelectedFields> = ref({
  date: '',
  desc: '',
  category: null,
  in: '',
  out: ''
});

const setDateField = (f: Field) => {
  state.value.date = f.id;
};

const setDescField = (f: Field) => {
  state.value.desc = f.id;
};

const setCategoryField = (c: Field) => {
  state.value.category = c.id;
};

const setInField = (f: Field) => {
  state.value.in = f.id;
};

const setOutField = (f: Field) => {
  state.value.out = f.id;
};

watch(
  [state],
  () => {
    const valid = selectedFields.safeParse(state.value);

    if (!valid.success) {
      stepTwo.value = false;
    } else {
      stepTwo.value = true;
    }
  },
  { deep: true }
);

const getData = async (file: any) => {
  return await new Promise((resolve, reject) => {
    try {
      Papa.parse(file, {
        worker: true,
        header: true,
        complete: function (r) {
          resolve(r);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};

const fileChanged = (e: Event) => {
  res.value = null;
  fields.value = [];
  fileSelected.value = false;
  stepOne.value = false;
  stepTwo.value = false;

  if ((e.target as HTMLInputElement)?.files?.length || 0 > 0) {
    fileSelected.value = true;
  }
};

function importTransactions() {
  const fileInput: any = document.getElementById('transactionFile');
  if (fileInput) {
    const fileToImport: any = fileInput.files[0];

    getData(fileToImport).then((d: any) => {
      res.value = d;
      if (!res.value) {
        return;
      }

      res.value.meta.fields?.forEach((f) => {
        fields.value.push({
          id: f,
          name: f
        });
      });

      stepOne.value = true;
    });
  }
}

const createTransactions = () => {
  const account = accounts.value.get(route.params.slug as unknown as string);
  if (!account) {
    console.error('account not exist!');
    return;
  }

  res.value?.data.forEach((row) => {
    if (row[state.value.desc] || row[state.value.date] || row[state.value.in] || row[state.value.out]) {
      let categoryName: string | null = null;

      if (state.value.category?.trim().length) {
        categoryName = capitalize(row[state.value.category!]);
      }

      let date = row[state.value.date].split('/');
      date = `${date[2]}-${date[1]}-${date[0]}`;

      const transaction: Z_Transaction = {
        id: crypto.randomUUID(),
        desc: capitalize(row[state.value.desc]),
        amount: 0,
        category: categoryName,
        account: account.id,
        when: moment(date).toDate(),
        status: z_transactionStatus.enum.Paid,
        sId: null,
        created: new Date()
      };

      if (transaction.desc === '') transaction.desc = 'missing';
      // let tExist: Z_Transaction[] = [];

      if (parseFloat(row[state.value.in])) {
        const a = parseFloat(row[state.value.in]);
        transaction.amount = a;
      }

      if (parseFloat(row[state.value.out])) {
        const a = parseFloat(row[state.value.out]);
        transaction.amount = Math.abs(a) * -1;
      }

      if (z_transaction.safeParse(transaction).success) {
        dataStore.addTransaction(transaction, true);
      } else {
        console.error(transaction, z_transaction.safeParse(transaction));
      }
    }
  });

  dataStore.sortTransactions();
  dataStore.recalculateBalances();
  dataStore.recalculateCategoryUsage();

  router.push('/accounts');
};

const doImport = () => {
  importing.value = true;

  setTimeout(createTransactions, 100);
};
</script>
