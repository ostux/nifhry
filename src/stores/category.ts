import { db } from '@/config/firebase';
import type { Category } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export const useCategoryStore = defineStore('category', () => {
  // State
  const loading = ref(false);
  const categories = ref<Category[]>([]);
  const unsubscribe = ref<Unsubscribe | null>(null);
  const { t } = useI18n();

  // Actions
  const initCategoriesListener = (userId: string): void => {
    if (categories.value.length) return;

    // Cleanup existing listener if any
    if (unsubscribe.value) {
      unsubscribe.value();
    }

    loading.value = true;

    try {
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const q = query(categoriesRef);

      unsubscribe.value = onSnapshot(
        q,
        (snapshot) => {
          categories.value = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name,
                desc: data.desc,
              } as Category;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
          loading.value = false;
        },
        (error) => {
          console.error('Error fetching categories:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          loading.value = false;
        },
      );
    } catch (error) {
      console.error('Error initializing categories listener:', error);
      loading.value = false;
    }
  };

  const cleanupListener = (): void => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    categories.value = [];
  };

  const createCategory = async (userId: string, categoryData: { name: string; desc: string }): Promise<void> => {
    loading.value = true;

    try {
      // Check if category with the same name already exists (case-insensitive)
      const duplicate = categories.value.find((cat) => cat.name.toLowerCase() === categoryData.name.toLowerCase());

      if (duplicate) {
        throw new Error('DUPLICATE_CATEGORY_NAME');
      }

      const categoriesRef = collection(db, 'users', userId, 'categories');

      await addDoc(categoriesRef, {
        name: categoryData.name,
        desc: categoryData.desc,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateCategory = async (userId: string, categoryId: string, updates: { name?: string; desc?: string }): Promise<void> => {
    loading.value = true;

    try {
      // If updating name, check for duplicates (case-insensitive)
      if (updates.name) {
        const duplicate = categories.value.find(
          (cat) => cat.id !== categoryId && cat.name.toLowerCase() === updates.name!.toLowerCase(),
        );

        if (duplicate) {
          throw new Error('DUPLICATE_CATEGORY_NAME');
        }
      }

      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);

      await updateDoc(categoryRef, updates);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
    loading.value = true;

    try {
      // First, find all transactions with this category
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(transactionsRef, where('c', '==', categoryId));
      const snapshot = await getDocs(q);

      // Update all transactions to remove the category using batch write
      if (!snapshot.empty) {
        const batch = writeBatch(db);

        snapshot.docs.forEach((docSnapshot) => {
          const transactionRef = doc(db, 'users', userId, 'transactions', docSnapshot.id);
          batch.update(transactionRef, { c: null });
        });

        await batch.commit();
      }

      // Then delete the category
      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const prepopulateCategories = async (userId: string): Promise<void> => {
    loading.value = true;

    const defaultCategories = [
      { name: t('categories.defaults.bills.name'), desc: t('categories.defaults.bills.desc') },
      { name: t('categories.defaults.cigi.name'), desc: t('categories.defaults.cigi.desc') },
      { name: t('categories.defaults.eatingOut.name'), desc: t('categories.defaults.eatingOut.desc') },
      { name: t('categories.defaults.entertainment.name'), desc: t('categories.defaults.entertainment.desc') },
      { name: t('categories.defaults.expenses.name'), desc: t('categories.defaults.expenses.desc') },
      { name: t('categories.defaults.home.name'), desc: t('categories.defaults.home.desc') },
      { name: t('categories.defaults.family.name'), desc: t('categories.defaults.family.desc') },
      { name: t('categories.defaults.finances.name'), desc: t('categories.defaults.finances.desc') },
      { name: t('categories.defaults.general.name'), desc: t('categories.defaults.general.desc') },
      { name: t('categories.defaults.giftsCharity.name'), desc: t('categories.defaults.giftsCharity.desc') },
      { name: t('categories.defaults.groceries.name'), desc: t('categories.defaults.groceries.desc') },
      { name: t('categories.defaults.holidays.name'), desc: t('categories.defaults.holidays.desc') },
      { name: t('categories.defaults.income.name'), desc: t('categories.defaults.income.desc') },
      { name: t('categories.defaults.personalCare.name'), desc: t('categories.defaults.personalCare.desc') },
      { name: t('categories.defaults.shopping.name'), desc: t('categories.defaults.shopping.desc') },
      { name: t('categories.defaults.transfers.name'), desc: t('categories.defaults.transfers.desc') },
      { name: t('categories.defaults.transport.name'), desc: t('categories.defaults.transport.desc') },
    ];

    try {
      const categoriesRef = collection(db, 'users', userId, 'categories');

      // Get existing category names for duplicate check (case-insensitive)
      const existingNames = new Set(categories.value.map((cat) => cat.name.toLowerCase()));

      // Filter out categories that already exist
      const categoriesToCreate = defaultCategories.filter((cat) => !existingNames.has(cat.name.toLowerCase()));

      // Create only non-duplicate categories in parallel
      await Promise.all(
        categoriesToCreate.map((category) =>
          addDoc(categoriesRef, {
            name: category.name,
            desc: category.desc,
          }),
        ),
      );
    } catch (error) {
      console.error('Error prepopulating categories:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    loading,
    categories,
    // Actions
    initCategoriesListener,
    cleanupListener,
    createCategory,
    updateCategory,
    deleteCategory,
    prepopulateCategories,
  };
});
