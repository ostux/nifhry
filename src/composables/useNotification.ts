import { type Ref, ref } from 'vue';

const notifications: Ref<Notification[]> = ref([]);

export interface Notification {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  msg: string;
  index: number;
}

export function useNotification() {
  const addNotification = (type: 'danger' | 'warning' | 'success' | 'info', msg: string): void => {
    const id: string = (Math.random() + 1).toString(36).substring(2);
    notifications.value.push({
      id,
      type,
      msg,
      index: notifications.value.length + 1
    });

    setTimeout(() => {
      deleteNotification(id);
    }, 1 * 3000);
  };

  const deleteNotification = (id: string): void => {
    notifications.value = notifications.value.filter((n: Notification) => n.id !== id);
    notifications.value.forEach((n: Notification, index: number) => {
      n.index = index + 1;
    });
  };

  return { notifications, addNotification, deleteNotification };
}
