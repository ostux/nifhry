<template>
  <div class="mb-2 min-h-screen">
    <!-- Hero Section -->
    <section class="bg-linear-to-br from-violet-900 to-violet-400 py-20 text-white">
      <div class="container mx-auto px-4">
        <div class="mx-auto max-w-4xl text-center">
          <h1 class="mb-6 text-5xl font-bold md:text-6xl">{{ $t('home.hero.title') }}</h1>
          <p class="mb-8 text-xl md:text-2xl">{{ $t('home.hero.subtitle') }}</p>
          <p class="mb-8 text-lg opacity-90">
            {{ $t('home.hero.description') }}
          </p>

          <!-- Development Notice -->
          <div class="mb-8 inline-block rounded-lg bg-yellow-500 px-6 py-3 text-yellow-950">
            <i class="pi pi-info-circle mr-2"></i>
            <strong>{{ $t('home.devNotice.title') }}</strong> {{ $t('home.devNotice.message') }}
          </div>

          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              :label="$t('home.hero.signIn')"
              icon="pi pi-sign-in"
              size="large"
              severity="secondary"
              @click="$router.push('/login')"
            />
            <Button
              :label="$t('home.hero.learnMore')"
              icon="pi pi-arrow-down"
              size="large"
              outlined
              severity="secondary"
              @click="scrollToFeatures"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      class="py-20"
    >
      <div class="container mx-auto px-4">
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-4xl font-bold">{{ $t('home.features.title') }}</h2>
          <p class="text-surface-600 dark:text-surface-400 mx-auto max-w-2xl text-lg">
            {{ $t('home.features.subtitle') }}
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature 1 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-wallet text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.multiAccount.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.multiAccount.description') }}
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-tags text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.categorization.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.categorization.description') }}
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-upload text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.csvImport.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.csvImport.description') }}
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-chart-line text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.analytics.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.analytics.description') }}
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-sync text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.transfers.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.transfers.description') }}
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="border-surface-200 dark:border-surface-700 rounded-lg border p-6">
            <div class="bg-primary-100 dark:bg-primary-900 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
              <i class="pi pi-cloud text-primary-600 dark:text-primary-400 text-2xl"></i>
            </div>
            <h3 class="mb-3 text-xl font-semibold">{{ $t('home.features.cloudSync.title') }}</h3>
            <p class="text-surface-600 dark:text-surface-400">
              {{ $t('home.features.cloudSync.description') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-surface-50 dark:bg-surface-900 py-20">
      <div class="container mx-auto px-4 text-center">
        <h2 class="mb-4 text-3xl font-bold">{{ $t('home.callToAction.title') }}</h2>
        <p class="text-surface-600 dark:text-surface-400 mb-8 text-lg">{{ $t('home.callToAction.description') }}</p>
        <Button
          :label="$t('home.callToAction.signInButton')"
          icon="pi pi-sign-in"
          size="large"
          @click="$router.push('/login')"
        />
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-surface-200 dark:border-surface-700 border-t py-8">
      <div class="container mx-auto px-4 text-center">
        <p class="text-surface-600 dark:text-surface-400">&copy; {{ new Date().getFullYear() }} {{ $t('home.footer.copyright') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const scrollToFeatures = () => {
  const featuresSection = document.getElementById('features');
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>
