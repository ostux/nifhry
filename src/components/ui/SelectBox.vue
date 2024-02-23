<template>
  <Listbox
    v-model="selected"
    @update:modelValue="(value) => $emit('select', value)"
  >
    <div class="relative mt-1">
      <ListboxButton class="button min-h-10 w-full">
        <span class="block truncate text-left text-black dark:text-white">
          <template v-if="selected && selected?.label">
            {{ $t(selected.label) }}
          </template>
          <template v-if="selected?.name">
            {{ selected.name }}
          </template>
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon
            class="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base ring-1 ring-black/5 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-slot="{ active, selected }"
            v-for="item in items"
            :key="item.id"
            :value="item"
            as="template"
            :disabled="item.disabled"
          >
            <li
              :class="[
                active ? 'bg-pine-green-100 text-pine-green-800' : 'text-gray-900',
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
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { ref, type PropType } from 'vue';

interface SelectItemObject {
  id: string;
  label?: string;
  name?: string;
  disabled?: boolean;
}

defineEmits(['select']);
const props = defineProps({
  items: {
    type: Array as PropType<SelectItemObject[]>,
    required: true
  },
  preSelected: {
    type: Object as PropType<SelectItemObject>,
    required: false
  }
});

const selected = ref(props.preSelected);
</script>
