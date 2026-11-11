<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <new-category-card />
    <category-card
      v-for="category in categories"
      :category="category"
      :key="category.id"
    />
  </div>
</template>

<script setup lang="ts">
import CategoryCard from '@/components/category/CategoryCard.vue';
import NewCategoryCard from '@/components/category/NewCategoryCard.vue';
import { useCategoryStore } from '@/stores/category';
import { storeToRefs } from 'pinia';

const categoryStore = useCategoryStore();
const { categories } = storeToRefs(categoryStore);
</script>
