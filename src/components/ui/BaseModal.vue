<template>
  <!-- Wrap your dialog in a `TransitionRoot` to add transitions. -->
  <TransitionRoot
    appear
    :show="modalOpen"
  >
    <Dialog
      @close="$emit('modal-close', true)"
      class="relative z-40"
    >
      <!-- The backdrop, rendered as a fixed sibling to the panel container -->
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black/10 dark:bg-white/10"
          aria-hidden="true"
        />
      </TransitionChild>
      <!-- Full-screen container to center the panel -->
      <div class="fixed inset-0 flex w-screen items-center justify-center md:items-start">
        <!-- The actual dialog panel -->

        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel
            class="z-30 h-fit max-h-screen w-full max-w-xl transform self-center rounded-lg bg-slate-100 text-left text-gray-800 shadow-xl transition-all dark:border dark:border-gray-400/20 dark:bg-slate-800 dark:text-gray-200"
            style="overflow: auto"
          >
            <DialogTitle class="border-b border-slate-200 p-4 text-lg font-medium leading-6 dark:border-slate-700">
              <slot name="header"></slot>
            </DialogTitle>

            <div
              v-if="infoText"
              class="m-4 rounded-md border border-sky-400 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-800"
            >
              {{ $t(infoText) }}
            </div>

            <div class="z-50 p-4">
              <slot></slot>
            </div>

            <div class="flex flex-col p-4 text-red-700 dark:text-red-400">
              <slot name="errors"></slot>
            </div>

            <div class="flex justify-between border-t border-slate-200 p-4 dark:border-slate-700">
              <simple-button
                class="z-40"
                label="button.cancel"
                @click="$emit('modal-close', true)"
              />

              <simple-button
                class="z-40"
                :label="okTranslationSlug"
                :disabled="okDisabled"
                @click="$emit('modal-ok-clicked', true)"
              />
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import SimpleButton from './SimpleButton.vue';

defineEmits(['modal-close', 'modal-ok-clicked']);
defineProps({
  modalOpen: {
    type: Boolean,
    required: true
  },
  okTranslationSlug: {
    type: String,
    required: true
  },
  okDisabled: {
    type: Boolean,
    required: true
  },
  infoText: {
    type: String,
    required: false
  }
});
</script>
