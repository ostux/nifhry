<template>
  <Toast />
  <div class="bg-surface-50 dark:bg-surface-900 flex min-h-screen justify-center px-4 pt-8">
    <div class="w-full">
      <Card>
        <template #title>
          <h1 class="text-center text-2xl font-bold">{{ $t('profileSettings.title') }}</h1>
        </template>
        <template #content>
          <div class="flex grow flex-col justify-around lg:flex-row">
            <div class="w-full max-w-2xl">
              <!-- Update Display Name Section -->
              <div class="mb-6">
                <h2 class="mb-4 text-xl font-semibold">{{ $t('profileSettings.updateDisplayName') }}</h2>
                <Form
                  v-slot="$form"
                  :resolver="nameResolver"
                  :initialValues="nameFormData"
                  @submit="handleNameUpdate"
                  class="space-y-4"
                >
                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-user" />
                      <InputText
                        name="name"
                        type="text"
                        :placeholder="$t('profileSettings.namePlaceholder')"
                        v-model="nameFormData.name"
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

                  <Button
                    type="submit"
                    :label="$t('profileSettings.updateNameButton')"
                    :loading="isSubmittingName"
                    class="w-full"
                    severity="primary"
                  />

                  <Message
                    v-if="nameSuccessMessage"
                    severity="success"
                    :closable="false"
                  >
                    {{ nameSuccessMessage }}
                  </Message>

                  <Message
                    v-if="nameErrorMessage"
                    severity="error"
                    :closable="false"
                  >
                    {{ nameErrorMessage }}
                  </Message>
                </Form>
              </div>

              <Divider />

              <!-- Update Email Section -->
              <div class="mb-6">
                <h2 class="mb-4 text-xl font-semibold">{{ $t('profileSettings.updateEmail') }}</h2>
                <Form
                  v-slot="$form"
                  :resolver="emailResolver"
                  :initialValues="emailFormData"
                  @submit="handleEmailUpdate"
                  class="space-y-4"
                >
                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-at" />
                      <InputText
                        name="email"
                        type="email"
                        :placeholder="$t('profileSettings.emailPlaceholder')"
                        v-model="emailFormData.email"
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

                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-key" />
                      <Password
                        name="currentPassword"
                        :placeholder="$t('profileSettings.currentPasswordPlaceholder')"
                        v-model="emailFormData.currentPassword"
                        :invalid="$form.currentPassword?.invalid"
                        :feedback="false"
                        toggleMask
                        fluid
                        autocomplete="current-password"
                      />
                    </IconField>

                    <Message
                      v-if="$form.currentPassword?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.currentPassword.error?.message }}
                    </Message>
                  </div>

                  <Button
                    type="submit"
                    :label="$t('profileSettings.updateEmailButton')"
                    :loading="isSubmittingEmail"
                    class="w-full"
                    severity="primary"
                  />

                  <Message
                    v-if="emailSuccessMessage"
                    severity="success"
                    :closable="false"
                  >
                    {{ emailSuccessMessage }}
                  </Message>

                  <Message
                    v-if="emailErrorMessage"
                    severity="error"
                    :closable="false"
                  >
                    {{ emailErrorMessage }}
                  </Message>
                </Form>
              </div>

              <Divider />

              <!-- Update Password Section -->
              <div class="mb-6">
                <h2 class="mb-4 text-xl font-semibold">{{ $t('profileSettings.updatePassword') }}</h2>
                <Form
                  v-slot="$form"
                  :resolver="passwordResolver"
                  :initialValues="passwordFormData"
                  @submit="handlePasswordUpdate"
                  class="space-y-4"
                >
                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-key" />
                      <Password
                        name="currentPassword"
                        :placeholder="$t('profileSettings.currentPasswordPlaceholder')"
                        v-model="passwordFormData.currentPassword"
                        :invalid="$form.currentPassword?.invalid"
                        :feedback="false"
                        toggleMask
                        fluid
                        autocomplete="current-password"
                      />
                    </IconField>

                    <Message
                      v-if="$form.currentPassword?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.currentPassword.error?.message }}
                    </Message>
                  </div>

                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-key" />
                      <Password
                        name="newPassword"
                        :placeholder="$t('profileSettings.newPasswordPlaceholder')"
                        v-model="passwordFormData.newPassword"
                        :invalid="$form.newPassword?.invalid"
                        :feedback="false"
                        toggleMask
                        fluid
                        autocomplete="new-password"
                      />
                    </IconField>

                    <Message
                      v-if="$form.newPassword?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.newPassword.error?.message }}
                    </Message>
                  </div>

                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-key" />
                      <Password
                        name="newPasswordConfirmation"
                        :placeholder="$t('profileSettings.confirmPasswordPlaceholder')"
                        v-model="passwordFormData.newPasswordConfirmation"
                        :invalid="$form.newPasswordConfirmation?.invalid"
                        :feedback="false"
                        toggleMask
                        fluid
                        autocomplete="new-password"
                      />
                    </IconField>

                    <Message
                      v-if="$form.newPasswordConfirmation?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.newPasswordConfirmation.error?.message }}
                    </Message>
                  </div>

                  <Button
                    type="submit"
                    :label="$t('profileSettings.updatePasswordButton')"
                    :loading="isSubmittingPassword"
                    class="w-full"
                    severity="primary"
                  />

                  <Message
                    v-if="passwordSuccessMessage"
                    severity="success"
                    :closable="false"
                  >
                    {{ passwordSuccessMessage }}
                  </Message>

                  <Message
                    v-if="passwordErrorMessage"
                    severity="error"
                    :closable="false"
                  >
                    {{ passwordErrorMessage }}
                  </Message>
                </Form>
              </div>

              <Divider />

              <!-- Delete Account Section -->
              <div>
                <h2 class="mb-4 text-xl font-semibold text-pink-600 dark:text-pink-400">
                  {{ $t('profileSettings.deleteAccount') }}
                </h2>
                <Form
                  v-slot="$form"
                  :resolver="deleteResolver"
                  :initialValues="deleteFormData"
                  @submit="handleAccountDelete"
                  class="space-y-4"
                >
                  <div class="flex flex-col gap-2">
                    <IconField>
                      <InputIcon class="pi pi-key" />
                      <Password
                        name="currentPassword"
                        :placeholder="$t('profileSettings.currentPasswordConfirmPlaceholder')"
                        v-model="deleteFormData.currentPassword"
                        :invalid="$form.currentPassword?.invalid"
                        :feedback="false"
                        toggleMask
                        fluid
                        autocomplete="current-password"
                      />
                    </IconField>

                    <Message
                      v-if="$form.currentPassword?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.currentPassword.error?.message }}
                    </Message>
                  </div>

                  <Message
                    severity="warn"
                    :closable="false"
                  >
                    {{ $t('profileSettings.deleteWarning') }}
                  </Message>

                  <Button
                    type="submit"
                    :label="$t('profileSettings.deleteAccountButton')"
                    :loading="isSubmittingDelete"
                    class="w-full"
                    severity="danger"
                  />

                  <Message
                    v-if="deleteErrorMessage"
                    severity="error"
                    :closable="false"
                  >
                    {{ deleteErrorMessage }}
                  </Message>
                </Form>
              </div>
            </div>
            <div class="w-full max-w-2xl">
              <!-- Currency Management Section -->
              <div class="mb-6">
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="text-xl font-semibold">{{ $t('profileSettings.currencyManagement') }}</h2>
                  <Button
                    :label="$t('profileSettings.addCurrency')"
                    icon="pi pi-plus"
                    @click="handleAddCurrency"
                    size="small"
                    :disabled="availableCurrencies.length === 0"
                  />
                </div>

                <!-- Main Currency -->
                <div class="mb-4 rounded-lg border border-surface-200 p-4 dark:border-surface-700">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="font-semibold text-surface-600 dark:text-surface-400">{{ $t('profileSettings.mainCurrency') }}</span>
                    <Button
                      :label="$t('profileSettings.change')"
                      size="small"
                      text
                      @click="handleOpenChangeMainCurrency"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-star-fill text-xl text-amber-500"></i>
                    <span class="text-lg font-bold">{{ mainCurrency }}</span>
                    <span class="text-surface-500">{{ currenciesStore.getCurrencyName(mainCurrency) }}</span>
                  </div>
                  <div class="mt-1 text-sm text-surface-500">
                    {{ $t('profileSettings.mainCurrencyDescription') }}
                  </div>
                </div>

                <!-- Onboarded Currencies List -->
                <div class="space-y-2">
                  <div
                    v-for="currency in currencyList"
                    :key="currency.code"
                    class="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700"
                  >
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold">{{ currency.code }}</span>
                        <span class="text-sm text-surface-500">{{ currency.name }}</span>
                      </div>
                      <div class="mt-1 text-sm text-surface-600 dark:text-surface-400">
                        1 {{ currency.code }} = {{ currency.rate.toFixed(4) }} {{ mainCurrency }}
                      </div>
                    </div>
                    <div v-if="currency.code !== mainCurrency" class="flex gap-2">
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        @click="handleEditRate(currency.code)"
                        v-tooltip.top="$t('profileSettings.editRate')"
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        severity="danger"
                        @click="handleRemoveCurrency(currency.code)"
                        v-tooltip.top="$t('profileSettings.removeCurrency')"
                      />
                    </div>
                  </div>

                  <Message
                    v-if="currencyList.length === 0"
                    severity="info"
                    :closable="false"
                  >
                    {{ $t('profileSettings.noCurrencies') }}
                  </Message>
                </div>
              </div>

              <Divider />

              <!-- User Settings Section -->
              <div class="mb-6">
                <h2 class="mb-4 text-xl font-semibold">{{ $t('profileSettings.secondaryCurrencyDisplay') }}</h2>
                <Form
                  v-slot="$form"
                  :resolver="settingsResolver"
                  :initialValues="settingsFormData"
                  @submit="handleSettingsUpdate"
                  class="space-y-4"
                >
                  <div class="flex flex-col gap-2">
                    <label
                      for="defaultCurrency"
                      class="font-medium"
                      >{{ $t('profileSettings.defaultCurrency') }}</label
                    >
                    <Select
                      id="defaultCurrency"
                      v-model="settingsFormData.defaultCurrency"
                      :options="currencies"
                      optionLabel="name"
                      optionValue="code"
                      :placeholder="$t('profileSettings.defaultCurrencyPlaceholder')"
                      fluid
                    />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label
                      for="secondaryCurrency"
                      class="font-medium"
                      >{{ $t('profileSettings.secondaryCurrency') }}</label
                    >
                    <Select
                      id="secondaryCurrency"
                      v-model="settingsFormData.secondaryCurrency"
                      :options="currencies"
                      optionLabel="name"
                      optionValue="code"
                      :placeholder="$t('profileSettings.secondaryCurrencyPlaceholder')"
                      fluid
                    />
                  </div>

                  <div class="flex items-center gap-2">
                    <Checkbox
                      v-model="settingsFormData.showSecondaryCurrency"
                      inputId="showSecondaryCurrency"
                      :binary="true"
                    />
                    <label for="showSecondaryCurrency">{{ $t('profileSettings.showSecondaryCurrency') }}</label>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label
                      for="exchangeRate"
                      class="font-medium"
                      >{{ $t('profileSettings.exchangeRate') }}</label
                    >
                    <InputNumber
                      id="exchangeRate"
                      v-model="settingsFormData.exchangeRate"
                      :placeholder="$t('profileSettings.exchangeRatePlaceholder')"
                      :minFractionDigits="2"
                      :maxFractionDigits="4"
                      :invalid="$form.exchangeRate?.invalid"
                      fluid
                    />
                    <Message
                      v-if="$form.exchangeRate?.invalid"
                      severity="error"
                      size="small"
                      variant="simple"
                    >
                      {{ $form.exchangeRate.error?.message }}
                    </Message>
                    <Message
                      v-if="settingsFormData.exchangeRate > 0"
                      severity="info"
                      size="small"
                      :closable="false"
                    >
                      {{
                        $t('profileSettings.exchangeRateExample', {
                          defaultCurrency: settingsFormData.defaultCurrency,
                          rate: settingsFormData.exchangeRate.toFixed(2),
                          secondaryCurrency: settingsFormData.secondaryCurrency,
                        })
                      }}
                    </Message>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label
                      for="liabilityPaymentCategories"
                      class="font-medium"
                      >{{ $t('profileSettings.liabilityPaymentCategories') }}</label
                    >
                    <MultiSelect
                      id="liabilityPaymentCategories"
                      v-model="settingsFormData.liabilityPaymentCategories"
                      :options="expenseCategories"
                      optionLabel="name"
                      optionValue="id"
                      :placeholder="$t('profileSettings.liabilityPaymentCategoriesPlaceholder')"
                      fluid
                      display="chip"
                    />
                    <Message
                      severity="info"
                      size="small"
                      :closable="false"
                    >
                      {{ $t('profileSettings.liabilityPaymentCategoriesHelp') }}
                    </Message>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label
                      for="investmentValueChangeCategories"
                      class="font-medium"
                      >{{ $t('profileSettings.investmentValueChangeCategories') }}</label
                    >
                    <MultiSelect
                      id="investmentValueChangeCategories"
                      v-model="settingsFormData.investmentValueChangeCategories"
                      :options="expenseCategories"
                      optionLabel="name"
                      optionValue="id"
                      :placeholder="$t('profileSettings.investmentValueChangeCategoriesPlaceholder')"
                      fluid
                      display="chip"
                    />
                    <Message
                      severity="info"
                      size="small"
                      :closable="false"
                    >
                      {{ $t('profileSettings.investmentValueChangeCategoriesHelp') }}
                    </Message>
                  </div>

                  <Button
                    type="submit"
                    :label="$t('profileSettings.updateSettingsButton')"
                    :loading="isSubmittingSettings"
                    class="w-full"
                    severity="primary"
                  />

                  <Message
                    v-if="settingsSuccessMessage"
                    severity="success"
                    :closable="false"
                  >
                    {{ settingsSuccessMessage }}
                  </Message>

                  <Message
                    v-if="settingsErrorMessage"
                    severity="error"
                    :closable="false"
                  >
                    {{ settingsErrorMessage }}
                  </Message>
                </Form>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Add/Edit Currency Dialog -->
    <Dialog
      v-model:visible="showAddCurrencyDialog"
      :header="editingCurrency ? $t('profileSettings.editCurrencyRate') : $t('profileSettings.addNewCurrency')"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <div v-if="!editingCurrency" class="flex flex-col gap-2">
          <label for="currencySelect" class="font-medium">{{ $t('profileSettings.currency') }}</label>
          <Select
            id="currencySelect"
            v-model="currencyFormData.code"
            :options="availableCurrencies"
            optionLabel="name"
            optionValue="code"
            :placeholder="$t('profileSettings.selectCurrency')"
            fluid
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ slotProps.option.code }}</span>
                <span class="text-sm text-surface-500">{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Select>
        </div>

        <div v-else class="rounded-lg bg-surface-50 p-3 dark:bg-surface-800">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ currencyFormData.code }}</span>
            <span class="text-sm text-surface-500">{{ currenciesStore.getCurrencyName(currencyFormData.code) }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="rateInput" class="font-medium">
            {{ $t('profileSettings.exchangeRateToMain', { mainCurrency: mainCurrency }) }}
          </label>
          <InputNumber
            id="rateInput"
            v-model="currencyFormData.rate"
            :placeholder="$t('profileSettings.enterRate')"
            :minFractionDigits="2"
            :maxFractionDigits="6"
            :min="0.000001"
            fluid
          />
          <Message
            v-if="currencyFormData.rate > 0"
            severity="info"
            size="small"
            :closable="false"
          >
            1 {{ currencyFormData.code || '?' }} = {{ currencyFormData.rate.toFixed(4) }} {{ mainCurrency }}
          </Message>
        </div>
      </div>

      <template #footer>
        <Button
          :label="$t('profileSettings.cancel')"
          text
          @click="showAddCurrencyDialog = false"
        />
        <Button
          :label="$t('profileSettings.save')"
          @click="handleSaveCurrency"
          :disabled="!currencyFormData.code || currencyFormData.rate <= 0"
        />
      </template>
    </Dialog>

    <!-- Change Main Currency Dialog -->
    <Dialog
      v-model:visible="showChangeMainCurrencyDialog"
      :header="$t('profileSettings.changeMainCurrency')"
      :modal="true"
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <Message severity="warn" :closable="false">
          {{ $t('profileSettings.changeMainCurrencyWarning') }}
        </Message>

        <div class="flex flex-col gap-2">
          <label for="newMainCurrency" class="font-medium">{{ $t('profileSettings.newMainCurrency') }}</label>
          <Select
            id="newMainCurrency"
            v-model="newMainCurrency"
            :options="currencyList"
            optionLabel="name"
            optionValue="code"
            :placeholder="$t('profileSettings.selectCurrency')"
            fluid
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <i v-if="slotProps.option.code === mainCurrency" class="pi pi-star-fill text-amber-500"></i>
                <span class="font-semibold">{{ slotProps.option.code }}</span>
                <span class="text-sm text-surface-500">{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Select>
        </div>

        <Message
          v-if="newMainCurrency && newMainCurrency !== mainCurrency"
          severity="info"
          :closable="false"
        >
          {{ $t('profileSettings.ratesWillRecalculate') }}
        </Message>
      </div>

      <template #footer>
        <Button
          :label="$t('profileSettings.cancel')"
          text
          @click="showChangeMainCurrencyDialog = false"
        />
        <Button
          :label="$t('profileSettings.changeMainCurrencyConfirm')"
          @click="handleChangeMainCurrency"
          :disabled="!newMainCurrency || newMainCurrency === mainCurrency"
          severity="warn"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { EUROPEAN_CURRENCIES } from '@/constants/currencies';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useSettingsStore } from '@/stores/settings';
import { useCurrenciesStore } from '@/stores/currencies';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { z } from 'zod';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const currenciesStore = useCurrenciesStore();
const categoryStore = useCategoryStore();
const { currentUser } = storeToRefs(authStore);
const { settings } = storeToRefs(settingsStore);
const { currencies: userCurrencies, mainCurrency, currencyList, availableCurrencies } = storeToRefs(currenciesStore);
const { categories } = storeToRefs(categoryStore);

const currencies = EUROPEAN_CURRENCIES;

// Compute expense categories for liability payment selection
const expenseCategories = computed(() =>
  categories.value.filter((cat) => cat.name !== '')
);

// Name update form
const isSubmittingName = ref(false);
const nameSuccessMessage = ref('');
const nameErrorMessage = ref('');
const nameFormData = ref({
  name: currentUser.value?.displayName || '',
});

const nameResolver = ref(
  zodResolver(
    z.object({
      name: z.string().min(1, t('profileSettings.nameRequired')).min(2, t('profileSettings.nameMinLength')),
    }),
  ),
);

// Email update form
const isSubmittingEmail = ref(false);
const emailSuccessMessage = ref('');
const emailErrorMessage = ref('');
const emailFormData = ref({
  email: currentUser.value?.email || '',
  currentPassword: '',
});

const emailResolver = ref(
  zodResolver(
    z.object({
      email: z
        .string()
        .min(1, t('profileSettings.emailRequired'))
        .pipe(z.email(t('profileSettings.emailInvalid'))),
      currentPassword: z.string().min(1, t('profileSettings.currentPasswordRequired')),
    }),
  ),
);

// Password update form
const isSubmittingPassword = ref(false);
const passwordSuccessMessage = ref('');
const passwordErrorMessage = ref('');
const passwordFormData = ref({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
});

const passwordResolver = ref(
  zodResolver(
    z
      .object({
        currentPassword: z.string().min(1, t('profileSettings.currentPasswordRequired')),
        newPassword: z.string().min(6, t('profileSettings.newPasswordMinLength')),
        newPasswordConfirmation: z.string().min(1, t('profileSettings.passwordConfirmRequired')),
      })
      .refine((data) => data.newPassword === data.newPasswordConfirmation, {
        message: t('profileSettings.passwordsDoNotMatch'),
        path: ['newPasswordConfirmation'],
      }),
  ),
);

// Settings form
const isSubmittingSettings = ref(false);
const settingsSuccessMessage = ref('');
const settingsErrorMessage = ref('');
const settingsFormData = ref({
  defaultCurrency: settings.value.defaultCurrency,
  secondaryCurrency: settings.value.secondaryCurrency,
  showSecondaryCurrency: settings.value.showSecondaryCurrency,
  exchangeRate: settings.value.exchangeRate,
  liabilityPaymentCategories: settings.value.liabilityPaymentCategories,
  investmentValueChangeCategories: settings.value.investmentValueChangeCategories,
});

// Sync form once when settings load from Firestore (the ref is initialized before onSnapshot fires)
const settingsSynced = ref(false);
watch(
  () => settingsStore.loading,
  (isLoading) => {
    if (!isLoading && !settingsSynced.value) {
      settingsSynced.value = true;
      settingsFormData.value = {
        defaultCurrency: settings.value.defaultCurrency,
        secondaryCurrency: settings.value.secondaryCurrency,
        showSecondaryCurrency: settings.value.showSecondaryCurrency,
        exchangeRate: settings.value.exchangeRate,
        liabilityPaymentCategories: [...settings.value.liabilityPaymentCategories],
        investmentValueChangeCategories: [...settings.value.investmentValueChangeCategories],
      };
    }
  },
);

const settingsResolver = ref(
  zodResolver(
    z.object({
      defaultCurrency: z.string().min(1),
      secondaryCurrency: z.string().min(1),
      showSecondaryCurrency: z.boolean(),
      exchangeRate: z
        .number({ message: t('profileSettings.exchangeRateRequired') })
        .min(0.0001, t('profileSettings.exchangeRateMinValue')),
      liabilityPaymentCategories: z.array(z.string()),
      investmentValueChangeCategories: z.array(z.string()),
    }),
  ),
);

// Delete account form
const isSubmittingDelete = ref(false);
const deleteErrorMessage = ref('');
const deleteFormData = ref({
  currentPassword: '',
});

const deleteResolver = ref(
  zodResolver(
    z.object({
      currentPassword: z.string().min(1, t('profileSettings.currentPasswordRequiredForDelete')),
    }),
  ),
);

// Handlers
const handleNameUpdate = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;

  nameErrorMessage.value = '';
  nameSuccessMessage.value = '';
  isSubmittingName.value = true;

  try {
    await authStore.updateDisplayName(nameFormData.value.name);
    nameSuccessMessage.value = t('profileSettings.nameUpdatedSuccess');
    setTimeout(() => {
      nameSuccessMessage.value = '';
    }, 3000);
  } catch {
    nameErrorMessage.value = t('profileSettings.nameUpdateError');
  } finally {
    isSubmittingName.value = false;
  }
};

const handleEmailUpdate = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;

  emailErrorMessage.value = '';
  emailSuccessMessage.value = '';
  isSubmittingEmail.value = true;

  try {
    await authStore.updateEmail(emailFormData.value.email, emailFormData.value.currentPassword);
    emailSuccessMessage.value = t('profileSettings.emailUpdatedSuccess');
    emailFormData.value.currentPassword = '';
    setTimeout(() => {
      emailSuccessMessage.value = '';
    }, 3000);
  } catch {
    emailErrorMessage.value = t('profileSettings.emailUpdateError');
  } finally {
    isSubmittingEmail.value = false;
  }
};

const handlePasswordUpdate = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;

  passwordErrorMessage.value = '';
  passwordSuccessMessage.value = '';
  isSubmittingPassword.value = true;

  try {
    await authStore.updatePassword(passwordFormData.value.currentPassword, passwordFormData.value.newPassword);
    passwordSuccessMessage.value = t('profileSettings.passwordUpdatedSuccess');
    passwordFormData.value.currentPassword = '';
    passwordFormData.value.newPassword = '';
    passwordFormData.value.newPasswordConfirmation = '';
    setTimeout(() => {
      passwordSuccessMessage.value = '';
    }, 3000);
  } catch {
    passwordErrorMessage.value = t('profileSettings.passwordUpdateError');
  } finally {
    isSubmittingPassword.value = false;
  }
};

const handleSettingsUpdate = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;

  settingsErrorMessage.value = '';
  settingsSuccessMessage.value = '';
  isSubmittingSettings.value = true;

  try {
    await settingsStore.updateSettings({
      defaultCurrency: settingsFormData.value.defaultCurrency,
      secondaryCurrency: settingsFormData.value.secondaryCurrency,
      showSecondaryCurrency: settingsFormData.value.showSecondaryCurrency,
      exchangeRate: settingsFormData.value.exchangeRate,
      liabilityPaymentCategories: settingsFormData.value.liabilityPaymentCategories,
      investmentValueChangeCategories: settingsFormData.value.investmentValueChangeCategories,
    });
    settingsSuccessMessage.value = t('profileSettings.settingsUpdatedSuccess');
    setTimeout(() => {
      settingsSuccessMessage.value = '';
    }, 3000);
  } catch {
    settingsErrorMessage.value = t('profileSettings.settingsUpdateError');
  } finally {
    isSubmittingSettings.value = false;
  }
};

const handleAccountDelete = async ({ valid }: { valid: boolean }) => {
  if (!valid) return;

  deleteErrorMessage.value = '';
  isSubmittingDelete.value = true;

  try {
    await authStore.deleteAccount(deleteFormData.value.currentPassword);
    router.push('/login');
  } catch {
    deleteErrorMessage.value = t('profileSettings.deleteAccountError');
  } finally {
    isSubmittingDelete.value = false;
  }
};

// Currency Management
const showAddCurrencyDialog = ref(false);
const showChangeMainCurrencyDialog = ref(false);
const editingCurrency = ref<string | null>(null);

const currencyFormData = ref({
  code: '',
  rate: 1,
});

const resetCurrencyForm = () => {
  currencyFormData.value = {
    code: '',
    rate: 1,
  };
  editingCurrency.value = null;
};

const handleAddCurrency = () => {
  resetCurrencyForm();
  showAddCurrencyDialog.value = true;
};

const handleEditRate = (currencyCode: string) => {
  const currency = userCurrencies.value[currencyCode];
  if (currency) {
    currencyFormData.value = {
      code: currencyCode,
      rate: currency.rate,
    };
    editingCurrency.value = currencyCode;
    showAddCurrencyDialog.value = true;
  }
};

const handleSaveCurrency = async () => {
  try {
    if (editingCurrency.value) {
      // Update existing currency rate
      await currenciesStore.updateRate(currencyFormData.value.code, currencyFormData.value.rate);
      toast.add({
        severity: 'success',
        summary: t('profileSettings.currencyUpdated'),
        detail: t('profileSettings.currencyUpdatedDetail'),
        life: 3000,
      });
    } else {
      // Add new currency
      const currencyInfo = EUROPEAN_CURRENCIES.find((c) => c.code === currencyFormData.value.code);
      if (currencyInfo) {
        await currenciesStore.addCurrency(
          currencyFormData.value.code,
          currencyInfo.name,
          currencyFormData.value.rate,
        );
        toast.add({
          severity: 'success',
          summary: t('profileSettings.currencyAdded'),
          detail: t('profileSettings.currencyAddedDetail'),
          life: 3000,
        });
      }
    }
    showAddCurrencyDialog.value = false;
    resetCurrencyForm();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('profileSettings.currencyError'),
      detail: error.message || t('profileSettings.currencyErrorDetail'),
      life: 5000,
    });
  }
};

const handleRemoveCurrency = async (currencyCode: string) => {
  try {
    await currenciesStore.removeCurrency(currencyCode);
    toast.add({
      severity: 'success',
      summary: t('profileSettings.currencyRemoved'),
      detail: t('profileSettings.currencyRemovedDetail'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('profileSettings.currencyRemoveError'),
      detail: error.message || t('profileSettings.currencyRemoveErrorDetail'),
      life: 5000,
    });
  }
};

const newMainCurrency = ref('');

const handleOpenChangeMainCurrency = () => {
  newMainCurrency.value = mainCurrency.value;
  showChangeMainCurrencyDialog.value = true;
};

const handleChangeMainCurrency = async () => {
  try {
    await currenciesStore.changeMainCurrency(newMainCurrency.value);
    toast.add({
      severity: 'success',
      summary: t('profileSettings.mainCurrencyChanged'),
      detail: t('profileSettings.mainCurrencyChangedDetail'),
      life: 3000,
    });
    showChangeMainCurrencyDialog.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('profileSettings.mainCurrencyChangeError'),
      detail: error.message || t('profileSettings.mainCurrencyChangeErrorDetail'),
      life: 5000,
    });
  }
};
</script>
