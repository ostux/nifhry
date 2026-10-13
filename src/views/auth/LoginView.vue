<template>
  <div class="flex min-h-screen pt-8 justify-center bg-surface-50 px-4 dark:bg-surface-900">
    <div class="w-full max-w-md">
      <Card>
        <template #title>
          <h1 class="text-center text-2xl font-bold">Login</h1>
        </template>
        <template #content>
          <Form
            v-slot="$form"
            :resolver="resolver"
            :initialValues="formData"
            @submit="handleSubmit"
            class="space-y-4"
          >
            <!-- Email Field -->
            <div class="flex flex-col gap-2">
              <IconField>
                <InputIcon class="pi pi-at" />
                <InputText
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  v-model="formData.email"
                  :invalid="$form.email?.invalid"
                  fluid
                  autocomplete="email"
                />
              </IconField>

              <Message
                v-if="$form.email?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.email.error?.message }}
              </Message>
            </div>

            <!-- Password Field -->
            <div class="flex flex-col gap-2">
              <IconField>
                <InputIcon class="pi pi-key" />
                <Password
                  name="password"
                  placeholder="Enter your password"
                  v-model="formData.password"
                  :invalid="$form.password?.invalid"
                  :feedback="false"
                  toggleMask
                  fluid
                  autocomplete="new-password"
                />
              </IconField>

              <Message
                v-if="$form.password?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.password.error?.message }}
              </Message>
            </div>

            <!-- Submit Button -->
            <Button
              type="submit"
              label="Login"
              :loading="isSubmitting"
              class="w-full"
              severity="primary"
            />

            <!-- Error Message -->
            <Message
              v-if="errorMessage"
              severity="error"
              :closable="false"
            >
              {{ errorMessage }}
            </Message>
          </Form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { z } from 'zod';

const authStore = useAuthStore();
const router = useRouter();

const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref({
  email: '',
  password: '',
});

const resolver = ref(
  zodResolver(
    z.object({
      email: z
        .string()
        .min(1, 'Email is required')
        .pipe(
          z.email('Invalid email address')
        ),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
    })
  ),
);

const handleSubmit = async ({ valid }: { valid: boolean; }) => {
  if (!valid) return;

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await authStore.login(formData.value.email, formData.value.password);
    router.push('/');
  } catch {
    errorMessage.value = 'Login failed. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
