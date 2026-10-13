<template>
  <Card
    style="overflow: hidden; width: 100%"
    :pt="passThrough"
  >
    <template #header>
      <div class="flex justify-between px-2 pt-2">
        <div
          class="flex flex-col"
          @click="openAccountDetails(account.id)"
        >
          <span><i class="pi pi-credit-card"></i> {{ account.name }}</span>
          <rovas-component
            class="ml-4 text-2xl"
            :msg="account.name"
          />
        </div>
        <Button
          type="button"
          icon="pi pi-ellipsis-h"
          size="small"
          @click="toggle"
          aria-haspopup="true"
          aria-controls="overlay_tmenu"
          severity="secondary"
          variant="text"
          rounded
          aria-label="Account menu"
        />
        <TieredMenu
          ref="menu"
          id="overlay_tmenu"
          :model="items"
          popup
        />
      </div>
    </template>
    <template #content>
      <div
        class="mt-4 flex grow flex-col justify-center"
        @click="openAccountDetails(account.id)"
      >
        <div class="self-center font-mono text-4xl">
          {{ formatCurrency(account.bal, account.cur) }}
        </div>
        <div
          v-if="settingsStore.showSecondaryCurrency"
          class="text-surface-500 self-center text-sm"
        >
          {{ alternativeCurrencyDisplay }}
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <Button
          v-if="account.status === 'active'"
          type="button"
          icon="pi pi-cloud-upload"
          severity="secondary"
          variant="text"
          rounded
          aria-label="Account menu"
          @click="goToImport(account.id)"
        />
        <Button
          v-else-if="account.status === 'closed'"
          type="button"
          icon="pi pi-lock"
          severity="secondary"
          variant="text"
          rounded
          aria-label="Account menu"
          disabled
        />
        <Button
          v-else
          type="button"
          icon="pi pi-ban"
          severity="secondary"
          variant="text"
          rounded
          aria-label="Account menu"
          disabled
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import type { Account, AccountKind } from '@/types';
import { useConfirm } from 'primevue/useconfirm';
import { computed, ref, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import RovasComponent from '@/components/common/RovasComponent.vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/stores/settings';
import { useCurrenciesStore } from '@/stores/currencies';
import { formatCurrency, formatSecondaryCurrency, formatCurrencyWithCode } from '@/utils/currency';

const { t } = useI18n();
const accountStore = useAccountStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const settingsStore = useSettingsStore();
const currenciesStore = useCurrenciesStore();
const router = useRouter();

const props = defineProps({
  account: {
    type: Object as PropType<Account>,
    required: true,
  },
});

const emit = defineEmits<{
  edit: [account: Account];
}>();

const colorClasses: Record<AccountKind, string> = {
  credit: 'border-2 border-fuchsia-500 hover:!bg-fuchsia-700/10',
  saving: 'border-2 border-sky-500 hover:!bg-sky-700/10',
  debit: 'border-2 border-teal-500 hover:!bg-teal-700/10',
  loan: 'border-2 border-orange-500 hover:!bg-orange-700/10',
  lending: 'border-2 border-violet-500 hover:!bg-violet-700/10',
  investment: 'border-2 border-etoro-500 hover:!bg-etoro-700/10',
};

const menu = ref();
const items = computed(() => [
  {
    label: t('common.edit'),
    icon: 'pi pi-file-edit',
    command: () => {
      emit('edit', props.account);
    },
  },
  {
    label: props.account.status === 'closed' ? t('common.reopen') : t('common.close'),
    icon: `pi ${props.account.status === 'closed' ? 'pi-lock-open' : 'pi-lock'}`,
    disabled: props.account.status === 'archived' ? true : false,
    command: () => {
      if (props.account.status === 'closed') {
        handleReopenAccount();
      } else handleCloseAccount();
    },
  },
  {
    separator: true,
  },
  {
    label: t('common.manage'),
    icon: 'pi pi-file',
    items: [
      {
        label: t('common.archive'),
        icon: 'pi pi-ban',
        disabled: props.account.status === 'archived' ? true : false,
        command: () => {
          handleArchiveAccount();
        },
      },
      {
        label: t('common.delete'),
        icon: 'pi pi-trash',
        command: () => {
          handleDeleteAccount();
        },
      },
    ],
  },
]);

const passThrough = computed(() => {
  const rootClass = colorClasses[props.account.kind] || colorClasses.debit;

  return {
    body: '!p-0',
    root: rootClass,
  };
});

const alternativeCurrencyDisplay = computed(() => {
  // If account currency is the same as secondary currency, show main currency instead
  if (props.account.cur === settingsStore.secondaryCurrency) {
    const amountInMain = currenciesStore.convert(
      props.account.bal,
      props.account.cur,
      currenciesStore.mainCurrency
    );
    return formatCurrencyWithCode(amountInMain, currenciesStore.mainCurrency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Otherwise show secondary currency as usual
  return formatSecondaryCurrency(props.account.bal, props.account.cur);
});

const errorMessage = ref('');

const handleReopenAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmReopen'),
    header: t('common.reopen'),
    icon: 'pi pi-lock-open',
    acceptLabel: t('common.reopen'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.reopenAccount(authStore.currentUser!.uid, props.account!.id);
      } catch (error) {
        console.error('Error reopening account:', error);
        errorMessage.value = t('accounts.errors.reopenFailed');
      }
    },
  });
};

const handleCloseAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmClose'),
    header: t('common.close'),
    icon: 'pi pi-lock',
    acceptLabel: t('common.close'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.closeAccount(authStore.currentUser!.uid, props.account!.id);
      } catch (error) {
        console.error('Error closing account:', error);
        errorMessage.value = t('accounts.errors.closeFailed');
      }
    },
  });
};

const handleArchiveAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmArchive'),
    header: t('common.archive'),
    icon: 'pi pi-ban',
    acceptLabel: t('common.archive'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      try {
        await accountStore.archiveAccount(authStore.currentUser!.uid, props.account!.id);
      } catch (error) {
        console.error('Error archiving account:', error);
        errorMessage.value = t('accounts.errors.archiveFailed');
      }
    },
  });
};

const handleDeleteAccount = () => {
  if (!authStore.currentUser || !props.account) return;

  confirm.require({
    message: t('accounts.confirmDelete'),
    header: t('common.delete'),
    icon: 'pi pi-trash',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await accountStore.deleteAccount(authStore.currentUser!.uid, props.account!.id);
      } catch (error) {
        console.error('Error deleting account:', error);
        errorMessage.value = t('accounts.errors.deleteFailed');
      }
    },
  });
};

const goToImport = (id: string) => {
  router.push(`account/import/${id}`);
};

const openAccountDetails = (id: string) => {
  router.push(`account/details/${id}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toggle = (event: any) => {
  menu.value.toggle(event);
};
</script>
