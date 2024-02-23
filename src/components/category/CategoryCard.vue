<template>
  <div
    class="h-[175px] w-[350px] rounded-lg border border-pine-green-500 bg-transparent pb-4 pl-4 pr-2 pt-1 hover:bg-pine-green-500/10"
  >
    <dropdown-menu :items="items"> </dropdown-menu>
    <div class="sixtyfour flex flex-row">
      <QueueListIcon class="mr-4 size-6" />
      {{ category.name }}
    </div>
    <div
      v-if="categoryParent"
      class="mt-4 flex flex-grow font-mono text-gray-700 dark:text-white"
    >
      belongs to: &nbsp;<strong>{{ categoryParent.name }}</strong>
    </div>
    <edit-category-form
      :category="category"
      :modal-open="openEditModal"
      @close="openEditModal = false"
    />
    <delete-confirmation-form
      :modal-open="confirmDeletionModal"
      :ok-disabled="false"
      ok-translation-slug="button.confirm"
      info-text="account.form.delete.warning"
      @modal-close="confirmDeletionModal = false"
      @modal-ok-clicked="deleteCategory"
    >
      <template v-slot:header> {{ $t('account.form.delete.title') }} </template>
    </delete-confirmation-form>
  </div>
</template>

<script setup lang="ts">
import { type Z_Category } from '@/types';

import { QueueListIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ref, type PropType, type Ref, onMounted } from 'vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import EditCategoryForm from '@/components/category/EditCategoryForm.vue';
import DeleteConfirmationForm from '@/components/ui/BaseModal.vue';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/stores/dataStore';
import { useNotification } from '@/composables/useNotification';

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const props = defineProps({
  category: {
    type: Object as PropType<Z_Category>,
    required: true
  }
});

const openEditModal: Ref<boolean> = ref(false);
const confirmDeletionModal: Ref<boolean> = ref(false);
const categoryParent: Ref<Z_Category | undefined> = ref(undefined);

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

const deleteCategory = () => {
  if (props.category && props.category.id) {
    dataStore.removeCategory(props.category.id);

    addNotification('success', t('account.form.delete.info', { id: props.category.name }));

    confirmDeletionModal.value = false;
  }
};

onMounted(() => {
  if (props.category.parent) {
    categoryParent.value = dataStore.getCategory(props.category.parent);
  }
});
</script>
