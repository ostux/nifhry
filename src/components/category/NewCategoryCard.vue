<template>
  <div
    class="h-[175px] w-[350px] cursor-pointer rounded-lg border-2 border-pine-green-800 bg-pine-green-400/20 pb-4 pl-4 pr-2 pt-1 text-purple-900 dark:bg-pine-green-400"
    @click="modalOpen = true"
  >
    <div class="flex flex-row p-4 pt-8">
      <FolderPlusIcon class="mr-4 size-6" />
      <div class="flex flex-col">
        <span> {{ $t('category.card.new') }} </span>
        <rovas-component
          class="text-2xl"
          :msg="$t('category.card.new')"
        />
      </div>
    </div>
    <div class="mt-4 flex flex-grow justify-center font-mono text-4xl text-gray-800"></div>
    <edit-category-form
      v-if="modalOpen"
      :modal-open="modalOpen"
      @close="modalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import EditCategoryForm from '@/components/category/EditCategoryForm.vue';
import { FolderPlusIcon } from '@heroicons/vue/24/outline';
import { ref, type Ref } from 'vue';
import RovasComponent from '../ui/RovasComponent.vue';

const modalOpen: Ref<boolean> = ref(false);
</script>
