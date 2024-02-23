<template>
  <div class="flex flex-wrap justify-center gap-4 py-4">
    <new-category-card />
    <category-card
      :category="category"
      v-for="category in categories"
      :key="category.id"
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
