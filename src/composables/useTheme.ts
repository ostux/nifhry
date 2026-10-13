import { ref, computed, onMounted, onUnmounted } from 'vue';

const isDark = ref(false);

// Check if dark mode is enabled
const checkDarkMode = () => {
  isDark.value = document.documentElement.classList.contains('dark');
};

/**
 * Composable for reactive theme detection
 * Watches for changes to the .dark class on the document element
 */
export const useTheme = () => {
  let observer: MutationObserver | null = null;

  onMounted(() => {
    // Initial check
    checkDarkMode();

    // Watch for class changes on the document element
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  const theme = computed(() => (isDark.value ? 'dark' : 'light'));

  return {
    isDark,
    theme,
  };
};
