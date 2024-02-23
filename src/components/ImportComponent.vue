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
          class="button focus-within:outline-none focus-within:ring-2 focus-within:ring-pine-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-green-700 dark:focus-within:ring-pine-green-300 dark:focus-visible:ring-pine-green-300"
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
import { useI18n } from 'vue-i18n';
import {
  z_accounts,
  z_categories,
  type Z_Accounts,
  type Z_Budgets,
  type Z_Categories,
  type Z_Transactions,
  z_transactions,
  z_budgets
} from '@/types';
import BaseModal from '@/components/ui/BaseModal.vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore';
import { ref, type Ref } from 'vue';
import { useNotification } from '@/composables/useNotification';
import { PaperClipIcon } from '@heroicons/vue/24/solid';

interface ImportData {
  accounts?: Z_Accounts;
  budgets?: Z_Budgets;
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
const { accounts, budgets, categories, transactions } = storeToRefs(dataStore);

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
    z_accounts.safeParse(d.accounts).success &&
    z_categories.safeParse(d.categories).success &&
    z_transactions.safeParse(d.transactions).success &&
    z_budgets.safeParse(d.budgets).success
  ) {
    data.value = d;
    return true;
  }

  return false;
};

const doImport = () => {
  let success: boolean = true;

  if (data.value.accounts && z_accounts.safeParse(data.value.accounts).success) {
    transactions.value = [];
    accounts.value = data.value.accounts;
  } else {
    success = false;
  }

  if (data.value.categories && z_categories.safeParse(data.value.categories).success) {
    transactions.value = [];
    categories.value = data.value.categories;
  } else {
    success = false;
  }

  if (data.value.transactions && z_transactions.safeParse(data.value.transactions).success) {
    transactions.value = data.value.transactions;
  } else {
    success = false;
  }

  if (data.value.budgets && z_budgets.safeParse(data.value.budgets).success) {
    budgets.value = data.value.budgets;
  } else {
    success = false;
  }

  if (success) {
    addNotification('success', t('notification.import.success'));
    emit('modal-close');
  } else {
    addNotification('danger', t('notification.import.somethingWrong'));
  }
};
</script>
