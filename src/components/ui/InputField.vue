<template>
  <div>
    <label class="flex w-full flex-col text-sm font-medium leading-6 text-gray-900 dark:text-white">
      <span v-if="label">{{ label }}</span>

      <input
        ref="input"
        :name="name"
        v-model="model"
        :type="type"
        :required="required"
        :placeholder="placeholder"
        :disabled="disabled"
        :step="step"
        @change="onChange"
        class="button mb-1 mt-2 w-full text-gray-800 focus:border-pine-green-500 focus:outline-none focus:ring-1 focus:ring-pine-green-500 disabled:cursor-not-allowed disabled:bg-gray-200/10 dark:text-white dark:[color-scheme:dark]"
      />

      <template v-if="errors?.length">
        <span
          class="text-xs text-rose-800 dark:text-rose-300"
          v-for="(error, index) in errors"
          :key="index"
        >
          {{ error }}
        </span>
      </template>
    </label>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type PropType, type Ref } from 'vue';

const emit = defineEmits(['change']);
const model = defineModel();
const props = defineProps({
  label: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'text'
  },
  step: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  errors: {
    type: Array as PropType<string[]>,
    required: false
  }
});
const input: Ref<HTMLInputElement | null> = ref(null);

const autoFocus = () => {
  if (props.autofocus) {
    input.value?.focus();
  }
};

const onChange = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;

  model.value = value.trim();

  emit('change', model.value);
};

onMounted(() => {
  autoFocus();
});
</script>
