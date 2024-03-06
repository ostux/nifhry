<template>
  <div
    class="relative flex-col rounded-lg border border-pine-green-500 bg-transparent p-4 hover:bg-pine-green-500/10"
    :class="[isChild ? 'flex min-h-[156px] min-w-[316px]' : 'flex min-h-[175px] min-w-[350px]']"
  >
    <dropdown-menu
      :items="items"
      class="-mt-2"
    />
    <div class="flex flex-row">
      <QueueListIcon class="mr-4 size-6" />
      <div class="flex flex-col">
        <span>{{ category.name }}</span>
        <rovas-component
          class="text-3xl"
          :msg="category.name"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-grow flex-col justify-end font-mono text-gray-700 dark:text-white">
      <span>
        <RouterLink :to="`category/${category.id}`">
          used: &nbsp;<strong>{{ category.used }}</strong> times
        </RouterLink>
      </span>
    </div>
    <div class="flex flex-row flex-wrap justify-evenly gap-4">
      <category-card
        v-for="child in Array.from(categories.values()).filter((c) => c.parent === category.id)"
        :category="child"
        :key="child.id"
        :is-child="true"
      />
    </div>
    <edit-category-form
      v-if="openEditModal"
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
import RovasComponent from '../ui/RovasComponent.vue';
import { storeToRefs } from 'pinia';

const { t } = useI18n();
const notifications = useNotification();
const { addNotification } = notifications;

const dataStore = useDataStore();
const { categories } = storeToRefs(dataStore);

const props = defineProps({
  category: {
    type: Object as PropType<Z_Category>,
    required: true
  },
  isChild: {
    type: Boolean,
    default: false
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
    categoryParent.value = categories.value.get(props.category.parent);
  }
});
</script>
