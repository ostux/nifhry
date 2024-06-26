<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled"
    info-text="notification.import.warningText"
    ok-translation-slug="button.import"
    @modal-ok-clicked="doImport()"
    @modal-close="$emit('modal-close')"
  >
    <template v-slot:header> Import </template>

    <div class="col-span-full">
      <div class="mt-2 flex items-center gap-x-3">
        <PaperClipIcon
          class="h-12 w-12 text-gray-500 dark:text-gray-200"
          aria-hidden="true"
        />

        <label
          for="fileToLoad"
          class="button f-w"
        >
          {{ $t('button.choose') }}
          <input
            type="file"
            id="fileToLoad"
            tabindex="1"
            style="position: fixed; left: 5000px; right: 5000px"
            accept="application/JSON"
            @change="loadFileAsText()"
          />
        </label>
      </div>
    </div>

    <template v-slot:errors>
      <span
        v-for="error in errors"
        :key="error"
        >{{ error }}</span
      >
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import {
  z_accountsArray,
  z_categoriesArray,
  z_transactions,
  type Z_Accounts,
  type Z_Categories,
  type Z_Transactions
} from '@/types';
import { PaperClipIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

interface ImportData {
  accounts?: Z_Accounts;
  categories?: Z_Categories;
  transactions?: Z_Transactions;
}

const emit = defineEmits(['modal-close']);
defineProps({
  modalOpen: {
    type: Boolean,
    required: false
  }
});

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();

const { addNotification } = notifications;
const { accounts, categories, transactions } = storeToRefs(dataStore);

const okDisabled: Ref<boolean> = ref(true);
const data: Ref<ImportData> = ref({});
const errors: Ref<string[]> = ref([]);

function loadFileAsText() {
  const fileInput: any = document.getElementById('fileToLoad');
  if (fileInput) {
    errors.value = [];
    const fileToLoad: any = fileInput.files[0];
    const fileType: string = fileInput.files[0].type;

    if (fileType !== 'application/json') {
      errors.value.push(t('notification.import.notText'));
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      if (fileLoadedEvent && fileLoadedEvent.target) {
        const textFromFileLoaded = fileLoadedEvent.target.result;
        if (textFromFileLoaded && typeof textFromFileLoaded === 'string') {
          const fileContent = JSON.parse(textFromFileLoaded);
          if (validateImport(fileContent)) {
            okDisabled.value = false;
          } else {
            errors.value.push(t('notification.import.notValid'));
            okDisabled.value = true;
          }
        }
      }
    };

    fileReader.readAsText(fileToLoad, 'UTF-8');
  }
}

const validateImport = (d: any): boolean => {
  if (
    z_accountsArray.safeParse(d.accounts).success &&
    z_categoriesArray.safeParse(d.categories).success &&
    z_transactions.safeParse(d.transactions).success
  ) {
    data.value = d;
    return true;
  }

  return false;
};

const doImport = () => {
  let success: boolean = true;

  if (data.value.accounts && z_accountsArray.safeParse(data.value.accounts).success) {
    transactions.value = [];
    data.value.accounts.forEach((a) => {
      accounts.value.set(a.id, a);
    });
  } else {
    success = false;
  }

  if (data.value.categories && z_categoriesArray.safeParse(data.value.categories).success) {
    transactions.value = [];
    data.value.categories.forEach((c) => {
      categories.value.set(c.id, c);
    });
  } else {
    success = false;
  }

  if (data.value.transactions && z_transactions.safeParse(data.value.transactions).success) {
    transactions.value = data.value.transactions.map((t) => {
      t.in = z.coerce.number().parse(t.in.toFixed(2));
      t.out = z.coerce.number().parse(t.out.toFixed(2));
      return t;
    });
  } else {
    success = false;
  }

  dataStore.recalculateBalances();

  if (success) {
    addNotification('success', t('notification.import.success'));
    emit('modal-close');
  } else {
    addNotification('danger', t('notification.import.somethingWrong'));
  }
};
</script>
