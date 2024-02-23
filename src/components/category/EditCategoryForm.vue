<template>
  <base-modal
    :modal-open="modalOpen"
    :ok-disabled="okDisabled"
    ok-translation-slug="button.save"
    @modal-ok-clicked="save"
    @modal-close="$emit('close', true)"
  >
    <template v-slot:header>
      <template v-if="category">
        {{ $t('category.form.edit.title') }}
      </template>
      <template v-else>
        {{ $t('category.form.add.title') }}
      </template>
    </template>

    <div class="flex flex-col gap-4">
      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('category.form.edit.name') }}

        <input
          type="text"
          name="name"
          v-model="state.name"
          class="button w-full text-gray-800 dark:text-white"
        />
      </label>

      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('category.form.edit.description') }}

        <textarea
          rows="4"
          name="descri"
          v-model="state.description"
          class="button w-full text-gray-800 dark:text-white"
        ></textarea>
      </label>

      <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
        {{ $t('category.form.edit.parent') }}

        <select-box
          :items="categorySelectList"
          :pre-selected="selectedParentCategory"
          @select="setCategoryParent"
        />
      </label>
    </div>

    <template v-slot:errors>
      <span
        v-for="error in errors"
        :key="error"
        >{{ error }}</span
      >
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { type Z_Category, type Z_ApiResponse, z_category } from '@/types';
import { storeToRefs } from 'pinia';
import { ref, watch, type PropType, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['close']);
const props = defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  },
  category: {
    type: Object as PropType<Z_Category>,
    required: false
  }
});

const { t } = useI18n();
const dataStore = useDataStore();
const notifications = useNotification();
const { addNotification } = notifications;

const { categorySelectList } = storeToRefs(dataStore);

const state: Ref<Z_Category> = ref({
  id: props.category?.id || crypto.randomUUID(),
  name: props.category?.name || '',
  description: props.category?.description || '',
  parent: props.category?.parent || null
} as Z_Category);

const selectedParentCategory = ref(categorySelectList.value.find((c) => c.id === state.value.parent));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<string[]> = ref([]);

const setCategoryParent = (e: { id: string }) => {
  const t = categorySelectList.value.find((a) => a.id === e.id)?.id;

  console.log(t);

  if (t) state.value.parent = t;
};

watch(
  [state],
  () => {
    errors.value = [];

    const valid = z_category.safeParse(state.value);

    if (!valid.success) {
      valid.error.errors.forEach((err) => {
        errors.value.push(err.message);
      });
    }

    okDisabled.value = !valid.success;
  },
  { deep: true }
);

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (props.category) {
    res = dataStore.editCategory(state.value);
  } else {
    res = dataStore.addCategory(state.value);
  }

  if (res && res.success) {
    addNotification('success', t('category.form.saved'));
    emit('close');
  } else {
    res?.errors.forEach((e) => {
      errors.value.push(e);
    });
    addNotification('danger', t('category.form.saveFailed'));
  }
};
</script>
