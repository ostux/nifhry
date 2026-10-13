<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ $t('notFound.title') }}</h1>
      <p class="error-message">{{ $t('notFound.message') }}</p>

      <div class="action-buttons">
        <Button
          :label="$t('notFound.goHome')"
          icon="pi pi-home"
          @click="router.push('/')"
          severity="primary"
        />
        <Button
          :label="$t('notFound.goBack')"
          icon="pi pi-arrow-left"
          @click="router.back()"
          severity="secondary"
          outlined
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
}

:global(.dark) .not-found-container {
  background: linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%);
}

.not-found-content {
  text-align: center;
  max-width: 600px;
}

.error-code {
  font-size: 10rem;
  font-weight: 700;
  line-height: 1;
  color: var(--primary-500);
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.25rem;
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 1.75rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
  }
}
</style>
