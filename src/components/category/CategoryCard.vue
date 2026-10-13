<template>
  <Card
    style="width: 100%; overflow: hidden"
    :pt="passThrough"
  >
    <template #header>
      <div class="flex justify-between px-2 pt-2">
        <div
          class="flex flex-col"
          @click="openCategoryDetails(category.id)"
        >
          <span><i class="pi pi-tag"></i> {{ category.name }}</span>
          <rovas-component
            class="ml-4 text-2xl"
            :msg="category.name"
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
          aria-label="Category menu"
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
        class="mt-2 mb-4 flex grow justify-center text-gray-700 dark:text-white"
        @click="openCategoryDetails(category.id)"
      >
        {{ category.desc || $t('categories.noDescription') }}
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/category';
import { useAuthStore } from '@/stores/auth';
import type { Category } from '@/types';
import { useConfirm } from 'primevue/useconfirm';
import { computed, ref, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import RovasComponent from '@/components/common/RovasComponent.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const router = useRouter();

const props = defineProps({
  category: {
    type: Object as PropType<Category>,
    required: true,
  },
});

const emit = defineEmits<{
  edit: [category: Category];
}>();

const menu = ref();
const items = computed(() => [
  {
    label: 'Edit',
    icon: 'pi pi-file-edit',
    command: () => {
      emit('edit', props.category);
    },
  },
  {
    separator: true,
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      handleDeleteCategory();
    },
  },
]);

const passThrough = computed(() => {
  return {
    body: '!p-0',
    root: 'border-2 border-teal-500 hover:!bg-teal-700/10',
  };
});

const errorMessage = ref('');

const handleDeleteCategory = () => {
  if (!authStore.currentUser || !props.category) return;

  confirm.require({
    message: t('categories.confirmDelete'),
    header: t('common.delete'),
    icon: 'pi pi-trash',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await categoryStore.deleteCategory(authStore.currentUser!.uid, props.category!.id);
      } catch (error) {
        console.error('Error deleting category:', error);
        errorMessage.value = t('categories.errors.deleteFailed');
      }
    },
  });
};

const openCategoryDetails = (id: string) => {
  router.push(`category/details/${id}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toggle = (event: any) => {
  menu.value.toggle(event);
};
</script>
