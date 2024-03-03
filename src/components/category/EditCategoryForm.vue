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
      <input-field
        name="name"
        type="text"
        v-model="state.name"
        :label="$t('category.form.edit.name')"
        :errors="errors?.name"
        required
      />

      <input-field
        name="description"
        type="text"
        v-model="state.description"
        :label="$t('category.form.edit.description')"
        :errors="errors?.description"
      />

      <select-box
        name="status"
        :options="categorySelectList"
        :pre-selected="selectedParentCategory?.name"
        @select="setCategoryParent"
        :label="$t('category.form.edit.parent')"
      />
    </div>

    <template
      v-slot:errors
      v-if="resError.length"
    >
      <ul>
        <li
          v-for="er in resError"
          :key="er"
        >
          {{ $t(er) }}
        </li>
      </ul>
    </template>
  </base-modal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/ui/BaseModal.vue';
import SelectBox from '@/components/ui/SelectBox.vue';
import { useNotification } from '@/composables/useNotification';
import { useDataStore } from '@/stores/dataStore';
import { z_category, type Z_ApiResponse, type Z_Category, type Z_FormError } from '@/types';
import { storeToRefs } from 'pinia';
import { ref, watch, type PropType, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import InputField from '../ui/InputField.vue';

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
  parent: props.category?.parent || null,
  used: 0
} as Z_Category);

const resError: Ref<string[]> = ref([]);

const selectedParentCategory = ref(categorySelectList.value.find((c) => c.name === state.value.parent));

const okDisabled: Ref<boolean> = ref(true);
const errors: Ref<Z_FormError> = ref({});

const setCategoryParent = (e: { id: string }) => {
  state.value.parent = e.id;
};

watch(
  [state],
  () => {
    errors.value = {};

    const valid = z_category.safeParse(state.value);

    if (!valid.success) {
      valid.error.issues.forEach((err) => {
        err.path.forEach((p) => {
          if (!errors.value[p]) {
            errors.value[p] = [];
          }

          errors.value[p].push(err.message);
        });
      });
    }

    okDisabled.value = !valid.success;
  },
  { deep: true }
);

const save = () => {
  let res: Z_ApiResponse | undefined = undefined;

  if (props.category) {
    console.log(state.value);
    res = dataStore.editCategory(state.value);
  } else {
    res = dataStore.addCategory(state.value);
  }

  if (res && res.success) {
    addNotification('success', t('category.form.saved'));
    emit('close');
  } else {
    resError.value = res.errors;
    addNotification('danger', t('category.form.saveFailed'));
  }
};
</script>
