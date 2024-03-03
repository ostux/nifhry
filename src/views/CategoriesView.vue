<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <new-category-card />
    <category-card
      v-for="category in Array.from(categories.values())"
      :category="category"
      :key="category.name"
    />
  </div>
</template>

<script setup lang="ts">
import CategoryCard from '@/components/category/CategoryCard.vue';
import NewCategoryCard from '@/components/category/NewCategoryCard.vue';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';

const dataStore = useDataStore();
const { categories } = storeToRefs(dataStore);
</script>
