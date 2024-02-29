<template>
  <label class="flex w-full flex-col text-sm font-medium leading-6 text-gray-900 dark:text-white">
    <span v-if="label">{{ label }}</span>
    <Combobox
      :name="name"
      v-model="selected"
      @update:modelValue="(value) => $emit('select', value)"
    >
      <div class="relative mt-1">
        <div
          class="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-400/30 bg-transparent text-left shadow-md focus-within:border-pine-green-500 focus-within:ring-1 focus-within:ring-pine-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-green-500/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
        >
          <ComboboxInput
            :displayValue="(item: any) => item.name"
            @change="query = $event.target.value"
            class="w-full border-none bg-transparent py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:border-pine-green-500 focus:outline-none focus:ring-1 focus:ring-pine-green-500 disabled:cursor-not-allowed disabled:bg-gray-200/10 dark:text-white dark:[color-scheme:dark]"
            :disabled="disabled"
          />
          <ComboboxButton
            class="absolute inset-y-0 right-0 flex items-center pr-2 disabled:cursor-not-allowed disabled:bg-gray-200/10 disabled:focus:ring-gray-200/20"
            :disabled="disabled"
          >
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-out"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions
            class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 text-base ring-1 ring-black/5 focus:outline-none dark:border-gray-400/30 dark:bg-gray-800 sm:text-sm"
          >
            <div
              v-if="filteredOptions.length === 0 && query !== ''"
              class="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-white"
            >
              Nothing found.
            </div>

            <ComboboxOption
              v-slot="{ active, selected }"
              v-for="item in filteredOptions"
              :key="item.id"
              :value="item"
              :disabled="item.disabled"
              class=""
            >
              <li
                :class="[
                  active ? 'bg-pine-green-100 text-pine-green-900' : 'text-gray-900 dark:text-white',
                  'relative cursor-default select-none py-2 pl-10 pr-4',
                  item.disabled ? 'cursor-not-allowed bg-gray-200 line-through opacity-50' : ''
                ]"
              >
                <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                  <template v-if="item?.label">
                    {{ $t(item.label) }}
                  </template>
                  <template v-if="item?.name">
                    {{ item.name }}
                  </template>
                  {{}}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-pine-green-600"
                >
                  <CheckIcon
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </transition>
      </div>
    </Combobox>
  </label>
</template>
<script setup lang="ts">
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { computed, ref, type PropType } from 'vue';

interface SelectItemObject {
  id: string;
  label?: string;
  name?: string;
  disabled?: boolean;
}

defineEmits(['select']);
const props = defineProps({
  options: {
    type: Array as PropType<SelectItemObject[]>,
    required: true
  },
  preSelected: {
    type: Object as PropType<SelectItemObject>,
    required: false
  },
  label: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const query = ref('');

const queryOptions = computed(() => {
  return query.value === '' ? null : { id: null, name: query.value };
});

const filteredOptions = computed(() =>
  query.value === ''
    ? props.options
    : props.options.filter((o) => {
        return o.name?.toLowerCase().includes(query.value.toLowerCase());
      })
);

const selected = ref(props.preSelected);
</script>
