<template>
  <div class="mx-4 my-8">
    <Card style="width: 50%; margin: auto">
      <template #title>{{ $t('emailNotVerified.title') }}</template>
      <template #content>
        <Message
          severity="info"
          :pt="{ text: 'w-full flex' }"
        >
          <div class="flex w-full items-center justify-between">
            {{ $t('emailNotVerified.message') }}
            <Button
              :label="$t('emailNotVerified.resendButton')"
              severity="info"
              @click="sendVerification"
              :disabled="verificationEmailSent"
            />
          </div>
        </Message>

        <Message
          class="mt-4"
          v-if="verificationEmailSent"
          severity="warn"
          :pt="{ text: 'w-full flex' }"
        >
          <div class="flex w-full items-center justify-center">
            {{ $t('emailNotVerified.emailSent') }}
          </div>
        </Message>
      </template>

      <template #footer>
        <div class="mt-1 flex gap-4">
          <Button
            :label="$t('emailNotVerified.reloadButton')"
            severity="secondary"
            @click="reload"
            outlined
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { sendEmailVerification } from 'firebase/auth';
import { storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const authStore = useAuthStore();
const { currentUser } = storeToRefs(authStore);

const verificationEmailSent: Ref<boolean> = ref(false);

const sendVerification = () => {
  if (currentUser.value) {
    verificationEmailSent.value = true;
    sendEmailVerification(currentUser.value);
  }
};

const reload = () => {
  authStore.reloadUserData();

  if (currentUser.value?.emailVerified) {
    router.push('/');
  }
};
</script>
