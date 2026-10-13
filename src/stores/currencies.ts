import { db } from '@/config/firebase';
import type { FirestoreUserCurrencies, UserCurrencies, UserCurrency } from '@/types';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './auth';
import { useSettingsStore } from './settings';
import { EUROPEAN_CURRENCIES } from '@/constants/currencies';

export const useCurrenciesStore = defineStore('currencies', () => {
  const authStore = useAuthStore();
  const settingsStore = useSettingsStore();

  // State
  const currencies = ref<UserCurrencies>({});
  const loading = ref(true);

  let unsubscribe: Unsubscribe | null = null;

  // Getters
  const mainCurrency = computed(() => {
    // Use mainCurrency if available, otherwise fall back to defaultCurrency
    return (settingsStore.settings.mainCurrency || settingsStore.defaultCurrency) as string;
  });

  const currencyList = computed(() => {
    return Object.values(currencies.value).sort((a, b) => a.code.localeCompare(b.code));
  });

  const availableCurrencies = computed(() => {
    // Return currencies that are NOT yet onboarded
    const onboardedCodes = Object.keys(currencies.value);
    return EUROPEAN_CURRENCIES.filter((c) => !onboardedCodes.includes(c.code));
  });

  // Helper to get currency name from code
  const getCurrencyName = (code: string): string => {
    const currency = EUROPEAN_CURRENCIES.find((c) => c.code === code);
    return currency?.name || code;
  };

  // Actions
  const initCurrencies = () => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      console.error('Cannot initialize currencies: no user logged in');
      return;
    }

    loading.value = true;

    const currenciesRef = doc(db, 'users', userId, 'settings', 'currencies');

    unsubscribe = onSnapshot(
      currenciesRef,
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as FirestoreUserCurrencies;

          // Convert Firestore format to client format
          const loadedCurrencies: UserCurrencies = {};
          for (const [code, currencyData] of Object.entries(data)) {
            loadedCurrencies[code] = {
              code,
              name: currencyData.n,
              rate: currencyData.r,
              addedAt: currencyData.aAt,
            };
          }

          currencies.value = loadedCurrencies;
        } else {
          // Document doesn't exist, initialize with main currency
          currencies.value = {};
          await ensureMainCurrencyExists();
        }
        loading.value = false;
      },
      (error) => {
        console.error('Error fetching currencies:', error);
        loading.value = false;
      },
    );
  };

  const ensureMainCurrencyExists = async () => {
    const main = mainCurrency.value;
    if (!currencies.value[main]) {
      await addCurrency(main, getCurrencyName(main), 1.0);
    }
  };

  const addCurrency = async (code: string, name: string, rate: number): Promise<void> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      throw new Error('No user is currently logged in');
    }

    if (rate <= 0) {
      throw new Error('Exchange rate must be greater than 0');
    }

    try {
      const currenciesRef = doc(db, 'users', userId, 'settings', 'currencies');

      const newCurrency: UserCurrency = {
        code,
        name,
        rate,
        addedAt: new Date(),
      };

      // Convert to Firestore format
      const firestoreCurrency = {
        n: name,
        r: rate,
        aAt: newCurrency.addedAt,
      };

      // Update with merge to not overwrite other currencies
      await setDoc(currenciesRef, { [code]: firestoreCurrency }, { merge: true });

      // The real-time listener will update the local state automatically
    } catch (error) {
      console.error('Error adding currency:', error);
      throw error;
    }
  };

  const updateRate = async (code: string, rate: number): Promise<void> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      throw new Error('No user is currently logged in');
    }

    if (rate <= 0) {
      throw new Error('Exchange rate must be greater than 0');
    }

    if (!currencies.value[code]) {
      throw new Error(`Currency ${code} not found`);
    }

    try {
      const currenciesRef = doc(db, 'users', userId, 'settings', 'currencies');

      // Update only the rate, keep other fields
      await setDoc(currenciesRef, { [code]: { r: rate } }, { merge: true });

      // The real-time listener will update the local state automatically
    } catch (error) {
      console.error('Error updating currency rate:', error);
      throw error;
    }
  };

  const removeCurrency = async (code: string): Promise<void> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      throw new Error('No user is currently logged in');
    }

    // Can't remove main currency
    if (code === mainCurrency.value) {
      throw new Error('Cannot remove the main currency');
    }

    // Check if any accounts use this currency
    const accountsUsingCurrency = await checkAccountsUsingCurrency(code);
    if (accountsUsingCurrency.length > 0) {
      throw new Error(
        `Cannot remove currency ${code}. It is used by the following accounts: ${accountsUsingCurrency.join(', ')}`,
      );
    }

    try {
      const currenciesRef = doc(db, 'users', userId, 'settings', 'currencies');

      // Read current data
      const currencyDoc = await getDocs(query(collection(db, 'users', userId, 'settings')));
      const currencyData = currencyDoc.docs.find((d) => d.id === 'currencies')?.data() as
        | FirestoreUserCurrencies
        | undefined;

      if (currencyData && currencyData[code]) {
        // Remove the currency field
        const updatedData = { ...currencyData };
        delete updatedData[code];

        await setDoc(currenciesRef, updatedData);
      }

      // The real-time listener will update the local state automatically
    } catch (error) {
      console.error('Error removing currency:', error);
      throw error;
    }
  };

  const checkAccountsUsingCurrency = async (code: string): Promise<string[]> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      return [];
    }

    try {
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const accountsSnapshot = await getDocs(query(accountsRef));

      const accountNames: string[] = [];
      accountsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.cur === code) {
          accountNames.push(data.name);
        }
      });

      return accountNames;
    } catch (error) {
      console.error('Error checking accounts using currency:', error);
      return [];
    }
  };

  const getRate = (code: string): number => {
    if (code === mainCurrency.value) {
      return 1.0;
    }
    return currencies.value[code]?.rate || 1.0;
  };

  const convertToMain = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === mainCurrency.value) {
      return amount;
    }
    const rate = getRate(fromCurrency);
    return amount * rate;
  };

  const convert = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to main currency first, then to target currency
    const inMainCurrency = convertToMain(amount, fromCurrency);
    const targetRate = getRate(toCurrency);

    return inMainCurrency / targetRate;
  };

  const changeMainCurrency = async (newMainCurrency: string): Promise<void> => {
    const userId = authStore.currentUser?.uid;
    if (!userId) {
      throw new Error('No user is currently logged in');
    }

    if (!currencies.value[newMainCurrency]) {
      throw new Error(`Currency ${newMainCurrency} is not onboarded`);
    }

    const oldMainCurrency = mainCurrency.value;
    if (oldMainCurrency === newMainCurrency) {
      return; // No change needed
    }

    try {
      const currenciesRef = doc(db, 'users', userId, 'settings', 'currencies');
      const settingsRef = doc(db, 'users', userId, 'settings', 'settings');

      // Get the old rate of the new main currency
      const newMainOldRate = getRate(newMainCurrency);

      // Recalculate all rates
      const updatedCurrencies: FirestoreUserCurrencies = {};

      for (const [code, currency] of Object.entries(currencies.value)) {
        if (code === newMainCurrency) {
          // New main currency gets rate 1.0
          updatedCurrencies[code] = {
            n: currency.name,
            r: 1.0,
            aAt: currency.addedAt,
          };
        } else {
          // Recalculate: newRate = oldRate / newMainOldRate
          const newRate = currency.rate / newMainOldRate;
          updatedCurrencies[code] = {
            n: currency.name,
            r: newRate,
            aAt: currency.addedAt,
          };
        }
      }

      // Add old main currency if not already in the list
      if (!updatedCurrencies[oldMainCurrency]) {
        updatedCurrencies[oldMainCurrency] = {
          n: getCurrencyName(oldMainCurrency),
          r: 1.0 / newMainOldRate,
          aAt: new Date(),
        };
      }

      // Update both documents
      await setDoc(currenciesRef, updatedCurrencies);
      await setDoc(settingsRef, { mainCurrency: newMainCurrency }, { merge: true });

      // The real-time listeners will update the local state automatically
    } catch (error) {
      console.error('Error changing main currency:', error);
      throw error;
    }
  };

  const cleanupListener = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    // Reset to empty
    currencies.value = {};
    loading.value = true;
  };

  return {
    // State
    currencies,
    loading,
    // Getters
    mainCurrency,
    currencyList,
    availableCurrencies,
    // Actions
    initCurrencies,
    addCurrency,
    updateRate,
    removeCurrency,
    getRate,
    convertToMain,
    convert,
    changeMainCurrency,
    checkAccountsUsingCurrency,
    getCurrencyName,
    cleanupListener,
  };
});
