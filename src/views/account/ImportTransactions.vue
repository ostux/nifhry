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
          name="in"
          :options="fields"
          @select="setInField"
          :label="$t('import_transactions.select.in')"
        />

        <select-box
          name="out"
          :options="fields"
          @select="setOutField"
          :label="$t('import_transactions.select.out')"
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
import { useDataStore } from '@/stores/dataStore';
import { nullUUID, z_transaction, z_transactionStatus, type Z_Account, type Z_Transaction, type Z_Category } from '@/types';
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
const { accounts, categories } = storeToRefs(dataStore);

const res: Ref<ParseResult<any> | null> = ref(null);
const fileSelected: Ref<boolean> = ref(false);
const stepOne: Ref<boolean> = ref(false);
const stepTwo: Ref<boolean> = ref(false);

const importing: Ref<boolean> = ref(false);

const account: ComputedRef<Z_Account | undefined> = computed(() => accounts.value.find((a) => a.id === route.params.id));

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
      console.log(valid.error.issues);
    } else {
      console.log('ready to import');
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

  console.log((e.target as HTMLInputElement)?.files?.length);

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

const doImport = () => {
  importing.value = true;
  const capitalize = (str: string): string => {
    let words: string | string[] = str.trim();

    if (words.length < 3) return words;

    words = words.split(' ');

    words = words.map((word) => {
      if (word.length > 1) {
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }
      return word;
    });

    return words.join(' ');
  };

  const createCategory = (cName: string): Z_Category | null => {
    if (cName.trim() === '') return null;

    const c: Z_Category = {
      id: crypto.randomUUID(),
      name: capitalize(cName),
      description: capitalize(cName),
      parent: null
    };

    const res = dataStore.addCategory(c);

    if (res?.success) {
      return c;
    }

    console.error(res?.errors);

    return null;
  };

  const doIt = () => {
    res.value?.data.forEach((transactionRow) => {
      const acc = dataStore.accounts.find((a) => a.id === route.params.id);

      if (!acc) {
        console.error('account not exist!');
        return;
      }

      if (
        transactionRow[state.value.desc] ||
        transactionRow[state.value.date] ||
        transactionRow[state.value.in] ||
        transactionRow[state.value.out]
      ) {
        let date = transactionRow[state.value.date].split('/');
        date = `${date[2]}-${date[1]}-${date[0]}`;

        let category: string | null = null;

        if (state.value.category?.trim().length) {
          const cat: Z_Category | undefined = categories.value.find(
            (c) => c.name === capitalize(transactionRow[state.value.category!])
          );
          if (!cat) {
            category = createCategory(transactionRow[state.value.category])?.id || null;
          } else {
            category = cat.id;
          }
        }

        const t: Z_Transaction = {
          id: crypto.randomUUID(),
          desc: capitalize(transactionRow[state.value.desc]),
          amount: 0,
          category: category,
          from: nullUUID,
          to: nullUUID,
          when: moment(date).toDate(),
          status: z_transactionStatus.enum.Paid,
          sId: null
        };

        if (parseFloat(transactionRow[state.value.in])) {
          const a = parseFloat(transactionRow[state.value.in]);
          t.amount = Math.abs(a as unknown as number);

          t.to = acc.id;
        }

        if (parseFloat(transactionRow[state.value.out])) {
          const a = parseFloat(transactionRow[state.value.out]);
          t.amount = Math.abs(a as unknown as number);

          t.from = acc.id;
        }

        if (z_transaction.safeParse(t).success) {
          dataStore.addTransaction(t, true);
        } else {
          console.log(z_transaction.safeParse(t));
        }
      }
    });

    dataStore.sortTransactions();
    dataStore.recalculateBalances();

    router.push('/accounts');
  };

  setTimeout(doIt, 100);
};
</script>
