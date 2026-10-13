<template>
  <div class="flex h-full flex-col">
    <Menubar
      :model="items"
      :pt="{
        itemlink: 'py-4!',
      }"
    >
      <template #start>
        <span class="text-2xl font-bold text-indigo-600">
          {{ title }}
        </span>
      </template>

      <template #end>
        <div class="flex">
          <LanguageSwitcher />

          <span
            @click="toggleDarkMode"
            class="ml-2 self-center"
          >
            <template v-if="theme === 'light'">
              <span class="pi pi-sun"></span>
            </template>
            <template v-else>
              <span class="pi pi-moon"></span>
            </template>
          </span>
        </div>
      </template>
    </Menubar>
    <!-- Page content here -->
    <main class="flex grow flex-col">
      <!-- <BreadCrumb /> -->

      <div class="h-0 grow overflow-auto pb-16 dark:bg-slate-900">
        <slot />
      </div>
      <!-- Confirmation Dialogs -->
      <ConfirmDialog />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';

// import BreadCrumb from '@/components/common/BreadCrumb.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';
import { useAuthStore } from '@/stores/auth';
import Menubar from 'primevue/menubar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const title = import.meta.env.VITE_APP_NAME;

const theme: Ref<'light' | 'dark'> = ref('dark');

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const toggleDarkMode = () => {
  if (theme.value === 'light') {
    theme.value = 'dark';
  } else {
    theme.value = 'light';
  }

  document.documentElement.classList.toggle('light');
  document.documentElement.classList.toggle('dark');
  document.documentElement.setAttribute('data-theme', theme.value);
};

const items = computed(() => {
  if (!authStore.isAuthenticated)
    return [
      {
        label: t('nav.login'),

        command: () => {
          router.push('/login');
        },
      },
      // {
      //   label: t('nav.register'),

      //   command: () => {
      //     router.push('/register');
      //   },
      // },
    ];

  return [
    {
      label: t('nav.dashboard'),

      command: () => {
        router.push('/app/dashboard');
      },
    },
    {
      label: t('nav.accounts'),

      command: () => {
        router.push('/app/accounts');
      },
    },
    {
      label: t('nav.categories'),

      command: () => {
        router.push('/app/categories');
      },
    },
    {
      label: t('nav.budgets'),

      command: () => {
        router.push('/app/budgets');
      },
    },
    {
      label: t('nav.transactions'),

      command: () => {
        router.push('/app/transactions');
      },
    },
    {
      icon: 'pi pi-user',
      label: authStore.currentUser?.displayName ?? '',
      items: [
        {
          label: t('nav.profile'),
          icon: 'pi pi-cog',
          command: () => {
            router.push('/app/profile');
          },
        },
        {
          label: t('nav.importExport'),
          icon: 'pi pi-file-import',
          command: () => {
            router.push('/app/import-export');
          },
        },
        {
          label: t('nav.logout'),
          icon: 'pi pi-sign-out',
          command: () => {
            handleLogout();
          },
        },
      ],
    },
  ];
});
</script>

<style lang="scss" scoped>
:deep(.p-menubar-start) {
  flex-grow: 1;
}
</style>
