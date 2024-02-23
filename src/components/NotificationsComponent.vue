<template>
  <Teleport to="body">
    <div
      v-for="notification in Object.values(notifications)"
      :key="notification.id"
      class="border-1 absolute right-4 h-auto min-w-96 max-w-xl rounded-md border-2"
      :class="{
        'border-red-300 bg-red-100 text-slate-900 shadow-xl dark:border-red-900 dark:bg-red-700 dark:text-slate-50':
          notification.type === 'danger',
        'border-orange-300 bg-orange-100 text-slate-900 shadow-xl dark:border-orange-900 dark:bg-orange-700 dark:text-slate-50':
          notification.type === 'warning',
        'border-green-300 bg-green-100 text-slate-900 shadow-xl dark:border-green-900 dark:bg-green-700 dark:text-slate-50':
          notification.type === 'success',
        'border-sky-300 bg-sky-100 text-slate-900 shadow-xl dark:border-sky-900 dark:bg-sky-700 dark:text-slate-50':
          notification.type === 'info'
      }"
      :style="{ marginTop: notification.index * 80 * -1 + 'px', zIndex: 9999 }"
    >
      <button
        class="absolute right-4 top-4"
        @click="deleteNotification(notification.id)"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
      <p class="p-4">{{ notification.msg }}</p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotification } from '@/composables/useNotification';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const notificationComposable = useNotification();

const { notifications, deleteNotification } = notificationComposable;
</script>
