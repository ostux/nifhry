<template>
  <div class="flex min-h-screen pt-8 justify-center bg-surface-50 px-4 dark:bg-surface-900">
    <div class="w-full max-w-md">
      <Card>
        <template #title>
          <h1 class="text-center text-2xl font-bold">Register</h1>
        </template>
        <template #content>
          <Form
            v-slot="$form"
            :resolver="resolver"
            :initialValues="formData"
            @submit="handleSubmit"
            class="space-y-4"
          >
            <!-- Name Field -->
            <div class="flex flex-col gap-2">
              <IconField>
                <InputIcon class="pi pi-user" />
                <InputText
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  v-model="formData.name"
                  :invalid="$form.name?.invalid"
                  fluid
                  autocomplete="name"
                />
              </IconField>

              <Message
                v-if="$form.name?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.name.error?.message }}
              </Message>
            </div>

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

            <!-- Password Confirmation Field -->
            <div class="flex flex-col gap-2">
              <IconField>
                <InputIcon class="pi pi-key" />
                <Password
                  name="passwordConfirmation"
                  placeholder="Confirm your password"
                  v-model="formData.passwordConfirmation"
                  :invalid="$form.passwordConfirmation?.invalid"
                  :feedback="false"
                  toggleMask
                  fluid
                  :autocomplete="'new-password'"
                />
              </IconField>

              <Message
                v-if="$form.passwordConfirmation?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.passwordConfirmation.error?.message }}
              </Message>
            </div>

            <!-- Submit Button -->
            <Button
              type="submit"
              label="Register"
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
  passwordConfirmation: '',
  name: ''
});

const resolver = ref(
  zodResolver(
    z.object({
      name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters'),
      email: z
        .string()
        .min(1, 'Email is required')
        .pipe(
          z.email('Invalid email address')
        ),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
      passwordConfirmation: z
        .string()
        .min(1, 'Password confirmation is required'),
    }).refine((data) => data.password === data.passwordConfirmation, {
      message: 'Passwords do not match',
      path: ['passwordConfirmation'],
    })
  ),
);

const handleSubmit = async ({ valid }: { valid: boolean; }) => {
  if (!valid) return;

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await authStore.registerUser(formData.value.email, formData.value.password, formData.value.name);
    router.push('/');
  } catch {
    errorMessage.value = 'Registration failed. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
