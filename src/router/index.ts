import { useAuthStore } from '@/stores/auth';
import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { breadcrumb: 'home', breadcrumbLink: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresGuest: true, breadcrumb: 'login', breadcrumbLink: true },
  },
  // {
  //   path: '/register',
  //   name: 'register',
  //   component: () => import('@/views/auth/RegisterView.vue'),
  //   meta: { requiresGuest: true, breadcrumb: 'register', breadcrumbLink: true },
  // },
  {
    path: '/not-verified',
    name: 'not-verified',
    component: () => import('@/views/auth/EmailNotVerified.vue'),
    meta: { requiresAuth: true, breadcrumb: 'verify', breadcrumbLink: true },
  },
  {
    path: '/app',
    name: 'app',
    component: () => import('@/views/app/AppMain.vue'),
    meta: { requiresAuth: true, breadcrumb: 'app', breadcrumbLink: false },
    redirect: '/app/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/app/DashboardView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'dashboard', breadcrumbLink: true },
      },
      {
        path: 'account/import/:id',
        name: 'importTransactions',
        component: () => import('@/views/app/ImportTransactions.vue'),
        meta: { requiresAuth: true, breadcrumb: 'importTransactions', breadcrumbLink: false },
      },
      {
        path: 'account/details/:id',
        name: 'account',
        component: () => import('@/views/app/AccountDetailsView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'account', breadcrumbLink: false },
      },
      {
        path: 'accounts',
        name: 'accounts',
        component: () => import('@/views/app/AccountsView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'accounts', breadcrumbLink: true },
      },

      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/app/CategoriesView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'categories', breadcrumbLink: true },
      },
      {
        path: 'category/details/:id',
        name: 'category',
        component: () => import('@/views/app/CategoryDetailsView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'category', breadcrumbLink: false },
      },
      {
        path: 'budgets',
        name: 'budgets',
        component: () => import('@/views/app/BudgetView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'budgets', breadcrumbLink: true },
      },
      {
        path: 'transactions',
        name: 'transactions',
        component: () => import('@/views/app/TransactionsView.vue'),
        meta: { requiresAuth: true, breadcrumb: 'transactions', breadcrumbLink: false },
      },
      {
        path: 'import-export',
        name: 'importExport',
        component: () => import('@/views/app/ImportExport.vue'),
        meta: { requiresAuth: true, breadcrumb: 'importExport', breadcrumbLink: false },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/auth/ProfileSetting.vue'),
        meta: { requiresAuth: true, breadcrumb: 'profile', breadcrumbLink: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guards
let authInitialized = false;

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Initialize auth once on first navigation
  if (!authInitialized) {
    authStore.initAuth();
    authInitialized = true;
  }

  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => authStore.loading,
        (isLoading) => {
          if (!isLoading) {
            unwatch();
            resolve();
          }
        },
      );
    });
  }

  handleNavigation();

  function handleNavigation() {
    // Redirect unauthenticated users to login
    if (to.meta.requiresAuth && !authStore.currentUser) {
      return next('/login');
    }

    if (!authStore.currentUser && to.name === 'not-verified') {
      return next('/login');
    }

    if (authStore.currentUser && authStore.currentUser.emailVerified && to.name === 'not-verified') {
      return next('/app');
    }

    if (authStore.currentUser && !authStore.currentUser.emailVerified) {
      if (to.name !== 'not-verified') {
        return next('/not-verified');
      }
    }

    next();
  }
});

export default router;
