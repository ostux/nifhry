<template>
  <div
    v-if="items.length > 1"
    class="card flex flex-col justify-center"
  >
    <Breadcrumb
      :home="home"
      :model="items"
    >
      <template #item="{ item, props }">
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate }"
          :to="item.route"
          custom
        >
          <a
            :href="href"
            v-bind="props.action"
            @click="navigate"
          >
            <span :class="[item.icon, 'text-color']" />
            <span class="font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a
          v-else
          :href="item.url"
          :target="item.target"
          v-bind="props.action"
        >
          <span>{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();

const home = ref({
  icon: 'pi pi-home',
  route: '/',
});

const route = useRoute();
const authStore = useAuthStore();
const { currentUser } = storeToRefs(authStore);

interface BreadcrumbRoute {
  label: string;
  route?: string;
}

const items = computed((): BreadcrumbRoute[] => {
  const matchedRoutes = route.matched;
  const user = currentUser.value;

  return matchedRoutes
    .filter((routeItem) => routeItem.meta?.breadcrumb) // Only include routes with a breadcrumb meta field
    .map((routeItem) => {
      return routeItem.meta.breadcrumbLink
        ? {
            label:
              routeItem.meta.breadcrumb !== 'photographer'
                ? t(`breadcrumb.${routeItem.meta.breadcrumb}`)
                : user?.email || t(`breadcrumb.${routeItem.meta.breadcrumb}`),
            route: routeItem.meta.breadcrumbLink ? routeItem.path || '/' : '#', // Fallback to '/' for empty paths
          }
        : {
            label:
              routeItem.meta.breadcrumb !== 'photographer'
                ? t(`breadcrumb.${routeItem.meta.breadcrumb}`)
                : user?.email || t(`breadcrumb.${routeItem.meta.breadcrumb}`),
          };
    });
});
</script>
