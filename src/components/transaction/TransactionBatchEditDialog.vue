<template>
  <Dialog
    v-model:visible="isVisible"
    :header="$t('transactions.batchEdit.title')"
    :modal="true"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="grid grid-cols-2 gap-4">
      <!-- Left side: Transaction IDs input -->
      <div class="col-span-1">
        <label
          for="transactionIds"
          class="mb-2 block text-sm font-medium"
        >
          {{ $t('transactions.batchEdit.transactionIds') }}
        </label>
        <Textarea
          id="transactionIds"
          v-model="transactionIdsInput"
          rows="10"
          class="w-full"
          :placeholder="$t('transactions.batchEdit.transactionIdsPlaceholder')"
        />
        <small class="mt-1 block text-gray-500">
          {{ parsedIds.length }} {{ $t('transactions.batchEdit.transactionsFound') }}
        </small>
      </div>

      <!-- Right side: Action buttons -->
      <div class="col-span-1">
        <div class="flex flex-col gap-4">
          <!-- Category Update -->
          <div>
            <label
              for="category"
              class="mb-2 block text-sm font-medium"
            >
              {{ $t('transactions.batchEdit.updateCategory') }}
            </label>
            <Select
              id="category"
              v-model="selectedCategory"
              :options="categoryStore.categories"
              option-label="name"
              option-value="id"
              :placeholder="$t('transactions.batchEdit.selectCategory')"
              class="w-full"
            />
            <Button
              :label="$t('transactions.batchEdit.updateCategoryButton')"
              icon="pi pi-tag"
              class="mt-2 w-full"
              :disabled="!selectedCategory || parsedIds.length === 0 || isUpdating"
              :loading="isUpdating && currentAction === 'category'"
              @click="updateCategory"
            />
          </div>

          <Divider />

          <!-- Status Updates -->
          <div>
            <label class="mb-2 block text-sm font-medium">
              {{ $t('transactions.batchEdit.updateStatus') }}
            </label>
            <div class="flex flex-col gap-2">
              <Button
                :label="$t('transactions.batchEdit.markAllPaid')"
                icon="pi pi-check"
                severity="success"
                class="w-full"
                :disabled="parsedIds.length === 0 || isUpdating"
                :loading="isUpdating && currentAction === 'paid'"
                @click="updateStatus('paid')"
              />
              <Button
                :label="$t('transactions.batchEdit.markAllPending')"
                icon="pi pi-clock"
                severity="info"
                class="w-full"
                :disabled="parsedIds.length === 0 || isUpdating"
                :loading="isUpdating && currentAction === 'pending'"
                @click="updateStatus('pending')"
              />
            </div>
          </div>

          <Divider />

          <!-- Delete Transactions -->
          <div>
            <label class="mb-2 block text-sm font-medium">
              {{ $t('transactions.batchEdit.deleteTransactions') }}
            </label>
            <Button
              :label="$t('transactions.batchEdit.deleteButton')"
              icon="pi pi-trash"
              severity="danger"
              class="w-full"
              :disabled="parsedIds.length === 0 || isUpdating"
              :loading="isUpdating && currentAction === 'delete'"
              @click="deleteTransactions"
            />
          </div>

          <!-- Success feedback -->
          <div
            v-if="updateSuccess"
            class="rounded-md bg-teal-50 p-3 text-sm text-teal-800"
          >
            <i class="pi pi-check-circle mr-2"></i>
            {{ $t('transactions.batchEdit.updateSuccess', { count: updatedCount }) }}
          </div>

          <!-- Error feedback -->
          <div
            v-if="updateError"
            class="rounded-md bg-pink-50 p-3 text-sm text-pink-800"
          >
            <i class="pi pi-exclamation-circle mr-2"></i>
            {{ updateError }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        :label="updateSuccess ? $t('common.done') : $t('common.cancel')"
        :severity="updateSuccess ? 'success' : 'secondary'"
        @click="closeDialog"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import { useAuthStore } from '@/stores/auth';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const authStore = useAuthStore();

const props = defineProps<{
  visible: boolean;
  initialTransactionIds?: string[];
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const transactionIdsInput = ref('');
const selectedCategory = ref<string | null>(null);
const isUpdating = ref(false);
const currentAction = ref<'category' | 'paid' | 'pending' | 'delete' | null>(null);
const updateSuccess = ref(false);
const updatedCount = ref(0);
const updateError = ref<string | null>(null);

// Parse comma-separated IDs
const parsedIds = computed(() => {
  return transactionIdsInput.value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
});

// Reset state when dialog opens
watch(isVisible, (visible) => {
  if (visible) {
    // Prepopulate with initial IDs if provided
    transactionIdsInput.value = props.initialTransactionIds?.join(', ') || '';
    selectedCategory.value = null;
    updateSuccess.value = false;
    updatedCount.value = 0;
    updateError.value = null;
    isUpdating.value = false;
    currentAction.value = null;
  }
});

const updateCategory = async () => {
  if (!selectedCategory.value || !authStore.currentUser) return;

  isUpdating.value = true;
  currentAction.value = 'category';
  updateError.value = null;
  updateSuccess.value = false;

  try {
    const count = await transactionStore.batchUpdateCategory(authStore.currentUser.uid, parsedIds.value, selectedCategory.value);
    updatedCount.value = count;
    updateSuccess.value = true;
  } catch (error) {
    console.error('Error updating category:', error);
    updateError.value = t('transactions.batchEdit.updateError');
  } finally {
    isUpdating.value = false;
    currentAction.value = null;
  }
};

const updateStatus = async (status: 'paid' | 'pending') => {
  if (!authStore.currentUser) return;

  isUpdating.value = true;
  currentAction.value = status;
  updateError.value = null;
  updateSuccess.value = false;

  try {
    const count = await transactionStore.batchUpdateStatus(authStore.currentUser.uid, parsedIds.value, status);
    updatedCount.value = count;
    updateSuccess.value = true;
  } catch (error) {
    console.error('Error updating status:', error);
    updateError.value = t('transactions.batchEdit.updateError');
  } finally {
    isUpdating.value = false;
    currentAction.value = null;
  }
};

const deleteTransactions = async () => {
  if (!authStore.currentUser) return;

  isUpdating.value = true;
  currentAction.value = 'delete';
  updateError.value = null;
  updateSuccess.value = false;

  try {
    const count = await transactionStore.batchDeleteTransactions(authStore.currentUser.uid, parsedIds.value);
    updatedCount.value = count;
    updateSuccess.value = true;
    // Clear the input after successful deletion
    transactionIdsInput.value = '';
  } catch (error) {
    console.error('Error deleting transactions:', error);
    updateError.value = t('transactions.batchEdit.deleteError');
  } finally {
    isUpdating.value = false;
    currentAction.value = null;
  }
};

const closeDialog = () => {
  isVisible.value = false;
};
</script>
