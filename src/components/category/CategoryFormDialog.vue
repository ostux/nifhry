<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="editMode ? $t('categories.editCategory') : $t('categories.createCategory')"
    :style="{ width: '30rem' }"
    @hide="handleClose"
  >
    <Form
      v-slot="$form"
      :resolver="resolver"
      :initialValues="formData"
      @submit="handleSubmit"
      class="space-y-4"
    >
      <!-- Name Field -->
      <div class="flex flex-col gap-2">
        <label for="name" class="font-semibold">{{ $t('categories.name') }}</label>
        <InputText
          id="name"
          name="name"
          v-model="formData.name"
          :invalid="$form.name?.invalid"
          fluid
          autocomplete="off"
        />
        <Message
          v-if="$form.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.name.error?.message }}
        </Message>
      </div>

      <!-- Description Field -->
      <div class="flex flex-col gap-2">
        <label for="desc" class="font-semibold">{{ $t('categories.description') }}</label>
        <Textarea
          id="desc"
          name="desc"
          v-model="formData.desc"
          :invalid="$form.desc?.invalid"
          rows="3"
          fluid
          autocomplete="off"
        />
        <Message
          v-if="$form.desc?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.desc.error?.message }}
        </Message>
      </div>

      <!-- Error Message -->
      <Message
        v-if="errorMessage"
        severity="error"
        :closable="false"
      >
        {{ errorMessage }}
      </Message>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          :label="$t('common.cancel')"
          severity="secondary"
          @click="handleClose"
        />
        <Button
          type="submit"
          :label="editMode ? $t('common.update') : $t('common.create')"
          :loading="isSubmitting"
        />
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/category';
import { useAuthStore } from '@/stores/auth';
import type { Category } from '@/types';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const props = defineProps<{
  visible: boolean;
  category?: Category;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const editMode = computed(() => !!props.category);
const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref({
  name: '',
  desc: '',
});

const resolver = ref(
  zodResolver(
    z.object({
      name: z
        .string()
        .min(1, t('categories.validation.nameRequired'))
        .min(2, t('categories.validation.nameMinLength')),
      desc: z.string().optional(),
    })
  )
);

const handleSubmit = async ({ valid }: { valid: boolean }) => {
  if (!valid || !authStore.currentUser) return;

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    if (editMode.value && props.category) {
      await categoryStore.updateCategory(authStore.currentUser.uid, props.category.id, {
        name: formData.value.name,
        desc: formData.value.desc,
      });
    } else {
      await categoryStore.createCategory(authStore.currentUser.uid, {
        name: formData.value.name,
        desc: formData.value.desc,
      });
    }

    handleClose();
  } catch (error: unknown) {
    console.error('Error saving category:', error);

    // Check if it's a duplicate category name error
    if (error instanceof Error && error.message === 'DUPLICATE_CATEGORY_NAME') {
      errorMessage.value = t('categories.errors.duplicateName');
    } else {
      errorMessage.value = editMode.value
        ? t('categories.errors.updateFailed')
        : t('categories.errors.createFailed');
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  isVisible.value = false;
  // Reset form
  formData.value = {
    name: '',
    desc: '',
  };
  errorMessage.value = '';
};

// Load category data when editing
watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      formData.value = {
        name: newCategory.name,
        desc: newCategory.desc,
      };
    } else {
      formData.value = {
        name: '',
        desc: '',
      };
    }
  },
  { immediate: true }
);

// Reset form when dialog is closed
watch(isVisible, (newValue) => {
  if (!newValue && !props.category) {
    formData.value = {
      name: '',
      desc: '',
    };
    errorMessage.value = '';
  }
});
</script>
