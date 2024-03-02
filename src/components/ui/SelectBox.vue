<template>
  <label class="flex w-full flex-col text-sm font-medium leading-6 text-gray-900 dark:text-white">
    <span v-if="label">{{ label }}</span>
    <Combobox
      v-model="selected"
      @update:modelValue="(value) => $emit('select', value)"
    >
      <div class="relative mt-1">
        <div
          class="f-w relative w-full cursor-default overflow-hidden rounded-lg border border-gray-400/30 bg-transparent text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
        >
          <ComboboxInput
            class="disabled-select w-full border-none bg-transparent py-2 pl-3 pr-10 text-sm leading-5 text-black outline-none focus:ring-0 dark:text-white"
            :displayValue="(item: any) => item.name"
            @change="query = $event.target.value"
            :disabled="disabled"
          />
          <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions
            class="absolute mt-1 max-h-60 w-full overflow-visible rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-400/30 dark:bg-gray-800 sm:text-sm"
            style="z-index: 999; max-height: 250px; overflow-y: auto"
          >
            <div
              v-if="filteredOptions.length === 0 && query !== ''"
              class="relative cursor-default select-none px-4 py-2 text-gray-700 dark:border dark:border-gray-400/30 dark:bg-gray-800 dark:text-white sm:text-sm"
            >
              {{ $t('select.nothingFound') }}
            </div>

            <ComboboxOption
              v-for="item in filteredOptions"
              as="template"
              :key="item.id"
              :value="item"
              :disabled="item.disabled"
              v-slot="{ selected, active }"
            >
              <li
                class="relative cursor-default select-none py-2 pl-10 pr-4"
                :class="[
                  active ? 'bg-pine-green-100 text-pine-green-900' : 'text-gray-900 dark:text-white',
                  'relative cursor-default select-none py-2 pl-10 pr-4',
                  item.disabled ? 'cursor-not-allowed bg-gray-200 line-through opacity-50' : ''
                ]"
              >
                <span
                  class="block truncate"
                  :class="{ 'font-medium': selected, 'font-normal': !selected }"
                >
                  {{ item.name }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-pine-green-600"
                  :class="{ 'text-white': active, 'text-teal-600': !active }"
                >
                  <CheckIcon
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>
  </label>
</template>

<script setup lang="ts">
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, TransitionRoot } from '@headlessui/vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref, type PropType, type Ref } from 'vue';

interface SelectItemObject {
  id: string;
  name: string;
  disabled?: boolean;
}

defineEmits(['select']);
const props = defineProps({
  options: {
    type: Array as PropType<SelectItemObject[]>,
    required: true
  },
  preSelected: {
    type: String,
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

let selected: Ref<SelectItemObject | undefined> = ref(undefined);

let query = ref('');

let filteredOptions = computed(() =>
  query.value === ''
    ? props.options
    : props.options.filter((item) =>
        item?.name?.toLowerCase().replace(/\s+/g, '').includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
);

onMounted(() => {
  if (props.preSelected) {
    selected.value = props.options.find((o) => o.id === props.preSelected);
  }
});
</script>
