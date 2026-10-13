import { useSettingsStore } from '@/stores/settings';
import { useCurrenciesStore } from '@/stores/currencies';

/**
 * Format amount with a specific currency code
 */
export const formatCurrencyWithCode = (
  amount: number,
  currencyCode: string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {},
): string => {
  const defaultOptions = {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  };

  return new Intl.NumberFormat(getLocaleForCurrency(currencyCode), {
    style: 'currency',
    currency: currencyCode,
    ...defaultOptions,
    ...options,
  }).format(amount);
};

/**
 * Format amount in the user's default/main currency (from settings)
 * If currencyCode is provided, formats in that currency instead
 */
export const formatCurrency = (
  amount: number,
  currencyCode?: string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {},
): string => {
  const defaultOptions = {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  };

  if (currencyCode) {
    return formatCurrencyWithCode(amount, currencyCode, { ...defaultOptions, ...options });
  }

  const settingsStore = useSettingsStore();
  const currenciesStore = useCurrenciesStore();

  // Use mainCurrency if available, otherwise fall back to defaultCurrency
  const currency = currenciesStore.mainCurrency || settingsStore.defaultCurrency;

  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency,
    ...defaultOptions,
    ...options,
  }).format(amount);
};

/**
 * Format amount in the user's secondary currency (from settings)
 * Converts the amount using the exchange rate from settings
 * If fromCurrency is provided, converts from that currency to secondary currency
 */
export const formatSecondaryCurrency = (amount: number, fromCurrency?: string): string => {
  const settingsStore = useSettingsStore();
  const currenciesStore = useCurrenciesStore();
  const secondaryCurrency = settingsStore.secondaryCurrency;
  const secondaryExchangeRate = settingsStore.exchangeRate;

  let convertedAmount = amount;

  if (fromCurrency) {
    // Convert: fromCurrency → main currency → secondary currency
    const amountInMainCurrency = currenciesStore.convertToMain(amount, fromCurrency);
    convertedAmount = amountInMainCurrency * secondaryExchangeRate;
  } else {
    // Legacy behavior: assume amount is already in main currency
    convertedAmount = amount * secondaryExchangeRate;
  }

  return new Intl.NumberFormat(getLocaleForCurrency(secondaryCurrency), {
    style: 'currency',
    currency: secondaryCurrency,
    maximumFractionDigits: 0,
  }).format(convertedAmount);
};

/**
 * Get the appropriate locale for a given currency code
 */
const getLocaleForCurrency = (currency: string): string => {
  const localeMap: Record<string, string> = {
    GBP: 'en-GB',
    EUR: 'de-DE',
    HUF: 'hu-HU',
    USD: 'en-US',
  };

  return localeMap[currency] || 'en-GB';
};
