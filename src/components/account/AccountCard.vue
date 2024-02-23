<template>
  <div
    class="h-[175px] w-[350px] rounded-lg border-2 bg-transparent pb-4 pl-4 pr-2 pt-1"
    :class="{
      'border-fuchsia-800': account.aType === 'credit',
      'hover:bg-fuchsia-700/10': account.aType === 'credit',
      'border-sky-800': account.aType === 'saving',
      'hover:bg-sky-700/10': account.aType === 'saving',
      'border-green-800': account.aType === 'debit',
      'hover:bg-green-700/10': account.aType === 'debit',
      'border-orange-800': account.aType === 'loan',
      'hover:bg-orange-700/10': account.aType === 'loan'
    }"
  >
    <dropdown-menu :items="items"> </dropdown-menu>
    <div
      class="sixtyfour flex flex-row"
      :class="{
        'text-fuchsia-500': account.aType === 'credit',
        'text-sky-500': account.aType === 'saving',
        'text-green-500': account.aType === 'debit',
        'text-orange-500': account.aType === 'loan'
      }"
    >
      <CreditCardIcon class="mr-4 size-6" />
      {{ account.name }}
    </div>
    <div class="mt-4 flex flex-grow justify-center font-mono text-4xl text-gray-700 dark:text-white">
      {{
        new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP'
        }).format(account.balance)
      }}
    </div>
    <edit-account-form
      :account="account"
      :modal-open="openEditModal"
      @close="openEditModal = false"
    />
    <delete-confirmation-form
      :modal-open="confirmDeletionModal"
      :ok-disabled="false"
      ok-translation-slug="button.confirm"
      info-text="account.form.delete.warning"
      @modal-close="confirmDeletionModal = false"
      @modal-ok-clicked="deleteAccount"
    >
      <template v-slot:header> {{ $t('account.form.delete.title') }} </template>
    </delete-confirmation-form>
  </div>
</template>

<script setup lang="ts">
import { type Z_Account } from '@/types';

import { CreditCardIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'; //ArchiveBoxIcon,
import { ref, type PropType, type Ref } from 'vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import EditAccountForm from '@/components/account/EditAccountForm.vue';
import DeleteConfirmationForm from '@/components/ui/BaseModal.vue';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/stores/dataStore';
import { useNotification } from '@/composables/useNotification';

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const props = defineProps({
  account: {
    type: Object as PropType<Z_Account>,
    required: true
  }
});

const openEditModal: Ref<boolean> = ref(false);
const confirmDeletionModal: Ref<boolean> = ref(false);

const items = [
  [
    {
      label: 'menu.edit',
      icon: PencilSquareIcon,
      click: () => {
        openEditModal.value = true;
      }
    },
    {
      label: 'menu.delete',
      icon: TrashIcon,
      click: () => {
        confirmDeletionModal.value = true;
      }
    }
  ]
];

const deleteAccount = () => {
  if (props.account && props.account.id) {
    dataStore.removeAccount(props.account.id);

    addNotification('success', t('account.form.delete.info', { name: props.account.name }));

    confirmDeletionModal.value = false;
  }
};
</script>
