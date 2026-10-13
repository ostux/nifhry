import { db } from '@/config/firebase';
import type { FirestoreUserSettings, UserSettings } from '@/types';
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from './auth';

const getDefaultSettings = (locale: string): UserSettings => {
  let defaultCurrency = 'HUF';
  let secondaryCurrency = 'HUF';
  let showSecondaryCurrency = false;
  let exchangeRate = 1;

  if (locale === 'en') {
    defaultCurrency = 'GBP';
    secondaryCurrency = 'HUF';
    showSecondaryCurrency = true;
    exchangeRate = 430;
  } else if (locale === 'de') {
    defaultCurrency = 'EUR';
    secondaryCurrency = 'HUF';
    showSecondaryCurrency = true;
    exchangeRate = 380;
  }

  return {
    defaultCurrency,
    secondaryCurrency,
    showSecondaryCurrency,
    exchangeRate,
    liabilityPaymentCategories: [],
    investmentValueChangeCategories: [],
  };
};

export const useSettingsStore = defineStore('settings', () => {
  const { locale } = useI18n();
  const authStore = useAuthStore();

  // State
  const settings = ref<UserSettings>(getDefaultSettings(locale.value));
  const loading = ref(true);

  let unsubscribe: Unsubscribe | null = null;

  // Getters
  const defaultCurrency = computed(() => settings.value.defaultCurrency);
  const mainCurrency = computed(() => settings.value.mainCurrency || settings.value.defaultCurrency); // For backward compatibility
  const secondaryCurrency = computed(() => settings.value.secondaryCurrency);
  const showSecondaryCurrency = computed(() => settings.value.showSecondaryCurrency);
  const exchangeRate = computed(() => settings.value.exchangeRate);
  const liabilityPaymentCategories = computed(() => settings.value.liabilityPaymentCategories);
  const investmentValueChangeCategories = computed(() => settings.value.investmentValueChangeCategories);

  // Actions
  const initSettings = () => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      console.error('Cannot initialize settings: no user logged in');
      return;
    }

    loading.value = true;

    const settingsRef = doc(db, 'users', userId, 'settings', 'settings');

    unsubscribe = onSnapshot(
      settingsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as FirestoreUserSettings;
          settings.value = {
            defaultCurrency: data.defaultCurrency,
            mainCurrency: data.mainCurrency || data.defaultCurrency, // For backward compatibility
            secondaryCurrency: data.secondaryCurrency,
            showSecondaryCurrency: data.showSecondaryCurrency,
            exchangeRate: data.exchangeRate,
            liabilityPaymentCategories: data.liabilityPaymentCategories || [],
            investmentValueChangeCategories: data.investmentValueChangeCategories || [],
          };
        } else {
          // Document doesn't exist, use defaults based on locale
          settings.value = getDefaultSettings(locale.value);
        }
        loading.value = false;
      },
      (error) => {
        console.error('Error fetching settings:', error);
        loading.value = false;
      },
    );
  };

  const updateSettings = async (newSettings: UserSettings): Promise<void> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      throw new Error('No user is currently logged in');
    }

    try {
      const settingsRef = doc(db, 'users', userId, 'settings', 'settings');
      const firestoreSettings: FirestoreUserSettings = {
        defaultCurrency: newSettings.defaultCurrency,
        mainCurrency: newSettings.mainCurrency || newSettings.defaultCurrency, // Set to defaultCurrency if undefined for backward compatibility
        secondaryCurrency: newSettings.secondaryCurrency,
        showSecondaryCurrency: newSettings.showSecondaryCurrency,
        exchangeRate: newSettings.exchangeRate,
        liabilityPaymentCategories: newSettings.liabilityPaymentCategories,
        investmentValueChangeCategories: newSettings.investmentValueChangeCategories,
      };

      await setDoc(settingsRef, firestoreSettings);
      // The real-time listener will update the local state automatically
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const cleanupListener = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    // Reset to defaults when cleaning up
    settings.value = getDefaultSettings(locale.value);
    loading.value = true;
  };

  return {
    // State
    settings,
    loading,
    // Getters
    defaultCurrency,
    mainCurrency,
    secondaryCurrency,
    showSecondaryCurrency,
    exchangeRate,
    liabilityPaymentCategories,
    investmentValueChangeCategories,
    // Actions
    initSettings,
    updateSettings,
    cleanupListener,
  };
});
