import './style.css';
import './main.scss';
import 'primeicons/primeicons.css';

import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import english from '@/assets/lang/en.json';
import german from '@/assets/lang/de.json';
import hungarian from '@/assets/lang/hu.json';

import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura'; //aura lara material nora
import Tooltip from 'primevue/tooltip';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';

// Load saved language preference or default to Hungarian
const savedLocale = localStorage.getItem('locale');
const defaultLocale = savedLocale === 'en' || savedLocale === 'de' || savedLocale === 'hu' ? savedLocale : 'hu';

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en: english,
    de: german,
    hu: hungarian,
  },
});

const MyPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        //...
      },
      root: {
        background: '{slate.900}',
        color: '{slate.0}',
      },
      subtitle: {
        color: '{slate.400}',
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
});

const app = createApp(App);

app
  .use(i18n)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    // Default theme configuration
    theme: {
      preset: MyPreset,
      options: {
        prefix: 'p',
        darkModeSelector: '.dark',
        cssLayer: false,
      },
    },
  })
  .use(ConfirmationService)
  .use(ToastService);

app.directive('tooltip', Tooltip);

app.mount('#app');
