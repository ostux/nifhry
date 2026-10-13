<template>
  <DataTable
    :value="previewData"
    class="p-datatable-sm"
  >
    <Column
      v-for="(header, index) in headers"
      :key="index"
      :field="header"
      :header="header"
    />
  </DataTable>
</template>

<script setup lang="ts">
defineProps<{
  headers: string[];
  previewData: Record<string, string>[];
}>();
</script>
