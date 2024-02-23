<template>
  <div class="relative flex justify-end self-center">
    <Menu
      as="div"
      class="relative inline-block text-left"
      v-slot="{ open }"
    >
      <div>
        <MenuButton class="z-30 inline-flex w-full justify-center rounded-md p-1 text-sm font-medium text-black">
          <template v-if="menuText">
            {{ $t(menuText) }}
            <template v-if="!open">
              <ChevronDownIcon
                class="-mr-1 ml-2 size-5"
                aria-hidden="true"
              />
              <span class="sr-only">{{ $t(menuText || 'nav.open') }}</span>
            </template>
            <template v-else>
              <ChevronUpIcon
                class="-mr-1 ml-2 size-5"
                aria-hidden="true"
              />
              <span class="sr-only">{{ $t(menuText || 'nav.open') }}</span>
            </template>
          </template>
          <template v-else>
            <EllipsisHorizontalIcon
              class="-mr-1 ml-2 size-5 text-black hover:animate-spin dark:text-white"
              aria-hidden="true"
            />
            <span class="sr-only">{{ $t(menuText || 'nav.open') }}</span>
          </template>
        </MenuButton>
      </div>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute right-0 z-40 mt-2 w-56 origin-top-right divide-y divide-gray-300 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-slate-900 dark:text-gray-100"
        >
          <div
            class="px-1 py-1"
            v-for="(group, index) in items"
            :key="`${index}+${group.length}`"
          >
            <MenuItem
              v-for="item in group"
              :key="item.label"
              as="template"
              v-slot="{ active }"
              :disabled="item.disabled"
            >
              <button
                :class="[
                  active ? 'bg-pine-green-500 text-white dark:bg-pine-green-700' : 'text-gray-900 dark:text-gray-100',
                  item.disabled ? 'cursor-not-allowed line-through opacity-50 dark:bg-slate-800 dark:text-white' : '',
                  'group flex w-full items-center px-2 py-2 text-sm'
                ]"
                @click="item.click ? item.click() : null"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="mr-2 size-5 text-pine-green-400"
                  aria-hidden="true"
                />
                {{ $t(item.label) }}
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { ChevronDownIcon, ChevronUpIcon, EllipsisHorizontalIcon } from '@heroicons/vue/20/solid';
import type { PropType } from 'vue';

interface MenuItemObject {
  label: string;
  href?: string;
  icon?: Object;
  disabled?: boolean;
  click?: Function;
}

defineProps({
  items: {
    type: Array as PropType<MenuItemObject[][]>,
    required: true
  },
  menuText: {
    type: String,
    required: false
  }
});
</script>
