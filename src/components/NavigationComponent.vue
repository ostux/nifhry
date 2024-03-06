<template>
  <Disclosure
    as="nav"
    class="bg-background/75 sticky top-0 z-50 -mb-px border-b border-gray-200 backdrop-blur dark:border-gray-800"
    v-slot="{ open }"
  >
    <div class="mx-auto max-w-6xl px-2 md:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
          <div class="flex-shrink-1 flex items-center">
            <a
              href="/"
              class="h-8 w-auto whitespace-nowrap text-2xl font-semibold text-pine-green-500"
            >
              Nifhry
            </a>
          </div>
          <div class="hidden w-full md:ml-6 md:block">
            <div class="flex flex-grow justify-end space-x-4 text-gray-700 dark:text-white">
              <template
                v-for="(item, index) in navigation"
                :key="item.name"
              >
                <RouterLink
                  v-if="item.href"
                  class="block px-3 py-2 text-base font-medium hover:text-pine-green-500"
                  active-class="border-b-2 border-pine-green-600 text-pine-green-600"
                  aria-current-value="page"
                  :to="item.href"
                  :tabindex="index"
                >
                  {{ $t(item.name) }}
                </RouterLink>
                <a
                  v-else
                  @click.prevent="item.click"
                  @keyup.enter="item.click"
                  @keyup.space="item.click"
                  :tabindex="index"
                >
                  <component
                    :is="item.icon"
                    class="mx-3 my-2 h-6 w-6 hover:text-pine-green-500"
                  />
                  <span class="sr-only">{{ $t(item.name) }}</span>
                </a>
                <a
                  v-if="item.id"
                  :id="item.id"
                  style="display: none"
                ></a>
              </template>
            </div>
          </div>
        </div>
        <div class="inset-y-0 left-0 flex items-center md:hidden">
          <!-- Mobile menu button-->
          <DisclosureButton
            class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="absolute -inset-0.5" />
            <span class="sr-only">{{ $t('nav.open') }}</span>
            <Bars3Icon
              v-if="!open"
              class="block h-6 w-6"
              aria-hidden="true"
            />
            <XMarkIcon
              v-else
              class="block h-6 w-6"
              aria-hidden="true"
            />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <template
          v-for="(item, index) in navigation"
          :key="item.name"
        >
          <RouterLink
            v-if="item.href"
            class="block px-3 py-4 text-base font-medium hover:text-pine-green-800 dark:hover:text-pine-green-300"
            active-class="text-pine-green-600"
            aria-current-value="page"
            :to="item.href"
            :tabindex="index"
          >
            {{ $t(item.name) }}
          </RouterLink>
          <a
            v-else
            @click.prevent="item.click"
            class="inline-flex flex-grow pr-8"
            :tabindex="index"
          >
            <component
              :is="item.icon"
              class="mx-3 my-2 h-10 w-10 hover:text-pine-green-800 dark:hover:text-pine-green-300"
            />
            <span class="sr-only">{{ $t(item.name) }}</span>
          </a>
          <a
            v-if="item.id"
            :id="item.id"
            style="display: none"
          ></a>
        </template>
      </div>
    </DisclosurePanel>
  </Disclosure>
  <import-component
    v-if="isImportModalOpen"
    :modal-open="isImportModalOpen"
    @modal-close="isImportModalOpen = false"
  />
  <reset-confirmation-form
    :modal-open="showConfirmResetModal"
    :ok-disabled="false"
    ok-translation-slug="button.ok"
    info-text="data.reset.warning"
    @modal-close="showConfirmResetModal = false"
    @modal-ok-clicked="resetData"
  >
    <template v-slot:header> {{ $t('data.reset.title') }} </template>
  </reset-confirmation-form>
</template>

<script setup lang="ts">
import ResetConfirmationForm from '@/components/ui/BaseModal.vue';
import { useNotification } from '@/composables/useNotification';
import { useAppSettingStore } from '@/stores/appSetting';
import { useDataStore } from '@/stores/dataStore';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
import { ArrowPathIcon, Bars3Icon, CloudArrowDownIcon, CloudArrowUpIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import ImportComponent from './ImportComponent.vue';

const { t } = useI18n();

const router = useRouter();

const notifications = useNotification();
const { addNotification } = notifications;

const appSettingStore = useAppSettingStore();
const { theme } = storeToRefs(appSettingStore);

const dataStore = useDataStore();
const { accounts, categories, transactions } = storeToRefs(dataStore);

const isImportModalOpen: Ref<boolean> = ref(false);
const showConfirmResetModal: Ref<boolean> = ref(false);

const navigation = computed(() => {
  return [
    { name: 'nav.account', href: '/accounts', current: true },
    { name: 'nav.category', href: '/categories', current: false },
    { name: 'nav.transaction', href: '/transaction', current: false },
    { name: 'nav.todo', href: '/todo', current: false },
    { name: 'nav.about', href: '/about', current: false },
    { name: 'nav.export', icon: CloudArrowDownIcon, click: () => downloadExportedAccounts(), id: 'downloadAnchorElem' },
    { name: 'nav.import', icon: CloudArrowUpIcon, click: () => (isImportModalOpen.value = true) },
    {
      name: 'nav.recalculate',
      icon: ArrowPathIcon,
      click: () => {
        dataStore.recalculateBalances();
        dataStore.recalculateCategoryUsage();
        addNotification('success', t('notification.recalculation.finished'));
      }
    },
    { name: 'nav.trash', icon: TrashIcon, click: () => (showConfirmResetModal.value = true) },
    {
      name: 'nav.theme',
      icon: theme.value === 'dark' ? SunIcon : MoonIcon,
      click: () => (theme.value = theme.value === 'dark' ? 'light' : 'dark')
    }
  ];
});

const downloadExportedAccounts = () => {
  const exportData = JSON.stringify(
    {
      accounts: Array.from(accounts.value.values()),
      categories: Array.from(categories.value.values()),
      transactions: transactions.value
    },
    undefined,
    2
  );

  var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportData);
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  if (dlAnchorElem) {
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'nifhry.json');
    dlAnchorElem.click();
  }
};

const resetData = () => {
  if (import.meta.env.VITE_LOCALSTORAGE_DATA_KEY) {
    localStorage.removeItem(import.meta.env.VITE_LOCALSTORAGE_DATA_KEY);
  }
  accounts.value = new Map();
  categories.value = new Map();
  transactions.value = [];

  addNotification('success', t('notification.reset.success'));
  showConfirmResetModal.value = false;
  router.push('/accounts');
};
</script>
