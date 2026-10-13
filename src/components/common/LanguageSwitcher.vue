<template>
  <div class="card flex justify-center">
    <Select
      optionLabel="name"
      class=""
      size="small"
      :options="countries"
      :defaultValue="currentLocale"
      :loading="!localeSet"
      @change="changeLanguage"
    >
      <template #option="slotProps">
        <div class="flex items-center">
          <div>
            <span>
              {{ slotProps.option.icon }}
            </span>
            {{ slotProps.option.name }}
          </div>
        </div>
      </template>
      <template #dropdownicon>
        {{ currentLocale.icon }}
      </template>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Language {
  name: string;
  code: string;
  icon: string;
}

const { locale, t } = useI18n();

const localeSet = ref(false);

const countries = ref([
  { name: t('language.english'), code: 'en', icon: '🇬🇧' },
  { name: t('language.german'), code: 'de', icon: '🇩🇪' },
  { name: t('language.hungarian'), code: 'hu', icon: '🇭🇺' },
]);

const currentLocale: Ref<Language> = ref(countries.value[0]!);

const changeLanguage = (e: { value: Language }) => {
  locale.value = e.value.code;
  // Save language preference to localStorage
  localStorage.setItem('locale', locale.value);
};

// Watch for external locale changes
watch(locale, (newLocale) => {
  currentLocale.value = countries.value.find((l) => l.code === newLocale) ?? countries.value[0]!;
});

onMounted(() => {
  // Load saved language preference on mount
  let savedLocale = localStorage.getItem('locale') || '';

  if (savedLocale === '') {
    savedLocale = countries.value[0]!.code;
    localStorage.setItem('locale', savedLocale);
  }
  if (savedLocale && (savedLocale === 'en' || savedLocale === 'de' || savedLocale === 'hu')) {
    currentLocale.value = countries.value.find((l) => l.code === savedLocale) ?? countries.value[0]!;
    locale.value = savedLocale;

    localeSet.value = true;
  } else {
    currentLocale.value = countries.value[0]!;
    locale.value = currentLocale.value.code;
    localStorage.setItem('locale', locale.value);

    localeSet.value = true;
  }
});
</script>
