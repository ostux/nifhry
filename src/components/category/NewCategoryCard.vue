<template>
  <div
    class="h-[175px] w-[350px] rounded-lg border-2 border-pine-green-800 bg-pine-green-400/20 pb-4 pl-4 pr-2 pt-1 text-purple-900 dark:bg-pine-green-400"
  >
    <div
      class="sixtyfour flex cursor-pointer flex-row p-4 pt-8"
      @click="modalOpen = true"
    >
      <FolderPlusIcon class="mr-4 size-6" />
      {{ $t('account.card.new') }}
    </div>
    <div class="mt-4 flex flex-grow justify-center font-mono text-4xl text-gray-800"></div>
    <edit-category-form
      :modal-open="modalOpen"
      @close="modalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import EditCategoryForm from '@/components/category/EditCategoryForm.vue';
import { FolderPlusIcon } from '@heroicons/vue/24/outline';
import { ref, type Ref } from 'vue';

const modalOpen: Ref<boolean> = ref(false);
</script>
