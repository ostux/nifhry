import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/accounts',
      name: 'accounts',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AccountsView.vue')
    },
    {
      path: '/account/:slug',
      name: 'account',
      component: () => import('../views/account/MainView.vue'),
      children: [
        {
          // UserPosts will be rendered inside User's <router-view>
          // when /account/:slug/posts is matched
          path: 'posts',
          component: () => import('../views/AboutView.vue')
        }
      ]
    },
    {
      // UserProfile will be rendered inside User's <router-view>
      // when /account/:slug/import-transactions is matched
      path: '/account/:slug/import-transactions',
      name: 'import-transactions',
      component: () => import('../views/account/ImportTransactions.vue')
    },
    {
      path: '/category',
      name: 'category',
      component: () => import('../views/CategoriesView.vue')
    },
    {
      path: '/transaction',
      name: 'transaction',
      component: () => import('../views/TransactionsView.vue')
    },
    {
      path: '/budget',
      name: 'budget',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/todo',
      name: 'todo',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'ErrorView',
      component: () => import('../views/404View.vue')
    }
  ]
});

export default router;
