<template>
  <button
    ref="button"
    :disabled="disabled"
    class="button"
    :class="[
      active ? 'bg-pine-green-300/70 text-black dark:bg-pine-green-700/70 dark:text-white' : 'text-gray-800 dark:text-gray-100'
    ]"
    @click="$emit('click', true)"
  >
    <component
      v-if="icon"
      :is="icon"
      class="size-6 text-pine-green-400"
      aria-hidden="true"
    />
    <span> {{ $t(label) }} </span>
  </button>
</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';

defineEmits(['click']);
const props = defineProps({
  label: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Object,
    required: false
  },
  active: {
    type: Boolean,
    default: false
  }
});
const button: Ref<HTMLInputElement | null> = ref(null);

const autoFocus = () => {
  if (props.autofocus) {
    button.value?.focus();
  }
};

onMounted(() => {
  autoFocus();
});
</script>
