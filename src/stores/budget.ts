import { db } from '@/config/firebase';
import type {
  BudgetDoc,
  BudgetStatus,
  BudgetType,
  FirestoreBudgetDoc,
  FirestoreCategoryBudget,
  Transaction,
} from '@/types';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useCategoryStore } from './category';
import { useAccountStore } from './account';
import { useCurrenciesStore } from './currencies';

export const useBudgetStore = defineStore('budget', () => {
  // State
  const loading = ref(false);
  const budgets = ref<Map<string, BudgetDoc>>(new Map()); // Map<period, BudgetDoc>

  // Helper functions for Firestore conversion

  /**
   * Convert Firestore format (abbreviated fields) to client format (full names)
   */
  function fromFirestore(firestoreDoc: FirestoreBudgetDoc): BudgetDoc {
    const budgetDoc: BudgetDoc = {};

    Object.entries(firestoreDoc).forEach(([categoryId, budget]) => {
      budgetDoc[categoryId] = {
        amount: budget.a,
        type: budget.k,
        items:
          budget.i?.map((item) => ({
            name: item.n,
            amount: item.a,
            type: item.t || 'user', // Default old items to 'user' type
          })) || [],
      };
    });

    return budgetDoc;
  }

  /**
   * Convert client format (full names) to Firestore format (abbreviated fields)
   */
  function toFirestore(budgetDoc: BudgetDoc): FirestoreBudgetDoc {
    const firestoreDoc: FirestoreBudgetDoc = {};

    Object.entries(budgetDoc).forEach(([categoryId, budget]) => {
      const firestoreBudget: FirestoreCategoryBudget = {
        a: budget.amount,
        k: budget.type,
      };

      // Only include items if there are any (Firestore doesn't allow undefined)
      if (budget.items.length > 0) {
        firestoreBudget.i = budget.items.map((item) => {
          const firestoreItem: { n: string; a: number; t?: 'user' | 'correction' } = {
            n: item.name,
            a: item.amount,
          };
          if (item.type) {
            firestoreItem.t = item.type;
          }
          return firestoreItem;
        });
      }

      firestoreDoc[categoryId] = firestoreBudget;
    });

    return firestoreDoc;
  }

  // Actions

  /**
   * Get budget document for a specific month
   * @param userId User ID
   * @param period Period in format YYYY-MM
   */
  const fetchBudget = async (userId: string, period: string): Promise<BudgetDoc> => {
    loading.value = true;

    try {
      const budgetRef = doc(db, 'users', userId, 'budgets', period);
      const budgetSnap = await getDoc(budgetRef);

      const budgetData = budgetSnap.exists() ? fromFirestore(budgetSnap.data() as FirestoreBudgetDoc) : {};
      budgets.value.set(period, budgetData);

      return budgetData;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update budget for a specific month
   * @param userId User ID
   * @param period Period in format YYYY-MM
   * @param budgetDoc Budget document with category budgets
   */
  const updateBudget = async (userId: string, period: string, budgetDoc: BudgetDoc): Promise<void> => {
    loading.value = true;

    try {
      const budgetRef = doc(db, 'users', userId, 'budgets', period);
      // Convert to Firestore format before saving
      await setDoc(budgetRef, toFirestore(budgetDoc));

      // Update local cache with client format
      budgets.value.set(period, budgetDoc);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Calculate budget status for all categories in a specific month.
   * - expense budgets: actual = sum of transaction.o (out) for that category
   * - income budgets: actual = sum of transaction.i (in) for that category
   * @param period Period in format YYYY-MM
   * @param transactions Transactions for the period
   * @returns Array of budget statuses
   */
  const calculateBudgetStatus = (period: string, transactions: Transaction[]): BudgetStatus[] => {
    const categoryStore = useCategoryStore();
    const accountStore = useAccountStore();
    const currenciesStore = useCurrenciesStore();
    const budgetDoc = budgets.value.get(period);

    if (!budgetDoc) {
      return [];
    }

    // Helper function to get the currency for a transaction
    // Priority: transaction.cur > account.cur > mainCurrency
    const getTransactionCurrency = (transaction: Transaction): string => {
      if (transaction.cur) return transaction.cur;

      const account = accountStore.accounts.find((a) => a.id === transaction.a);
      if (account?.cur) return account.cur;

      return currenciesStore.mainCurrency;
    };

    // Sum o (expense) and i (income) per category, converting to main currency
    const actualByCategory = new Map<string, { income: number; expense: number }>();

    transactions.forEach((transaction) => {
      const categoryId = transaction.c || 'uncategorized';

      if (!actualByCategory.has(categoryId)) {
        actualByCategory.set(categoryId, { income: 0, expense: 0 });
      }

      const transactionCurrency = getTransactionCurrency(transaction);
      const amounts = actualByCategory.get(categoryId)!;

      // Convert transaction amounts to main currency
      amounts.expense += currenciesStore.convertToMain(transaction.o, transactionCurrency);
      amounts.income += currenciesStore.convertToMain(transaction.i, transactionCurrency);
    });

    return Object.entries(budgetDoc).map(([categoryId, budget]) => {
      const category = categoryStore.categories.find((c) => c.id === categoryId);
      const actual = actualByCategory.get(categoryId);

      const actualAmount = budget.type === 'income' ? (actual?.income ?? 0) : (actual?.expense ?? 0);
      const remaining = budget.amount - actualAmount;
      const percentage = budget.amount > 0 ? (actualAmount / budget.amount) * 100 : actualAmount > 0 ? 101 : 0;

      return {
        categoryId,
        categoryName: category?.name || 'Unknown',
        categoryDescription: category?.desc || 'Unknown',
        budgeted: budget.amount,
        actual: actualAmount,
        remaining,
        percentage,
        type: budget.type,
      };
    });
  };

  /**
   * Get budget for a category in a specific month
   * @param period Period in format YYYY-MM
   * @param categoryId Category ID
   */
  const getCategoryBudget = (period: string, categoryId: string): { amount: number; type: BudgetType } | null => {
    const budgetDoc = budgets.value.get(period);
    return budgetDoc?.[categoryId] || null;
  };

  /**
   * Set budget for a specific category in a specific month
   * @param userId User ID
   * @param period Period in format YYYY-MM
   * @param categoryId Category ID
   * @param amount Budget amount
   * @param type Budget type (expense or income)
   */
  const setCategoryBudget = async (
    userId: string,
    period: string,
    categoryId: string,
    amount: number,
    type: BudgetType,
  ): Promise<void> => {
    const budgetDoc = budgets.value.get(period) || {};

    if (amount <= 0) {
      // Remove budget if amount is 0 or negative
      delete budgetDoc[categoryId];
    } else {
      budgetDoc[categoryId] = { amount, type, items: [] };
    }

    await updateBudget(userId, period, budgetDoc);
  };

  /**
   * Update budget for a specific category with full CategoryBudget (including items)
   * @param userId User ID
   * @param period Period in format YYYY-MM
   * @param categoryId Category ID
   * @param categoryBudget Full CategoryBudget object with amount, type, and items
   */
  const updateCategoryBudget = async (
    userId: string,
    period: string,
    categoryId: string,
    categoryBudget: import('@/types').CategoryBudget,
  ): Promise<void> => {
    const budgetDoc = budgets.value.get(period) || {};

    if (categoryBudget.amount <= 0) {
      // Remove budget if amount is 0 or negative
      delete budgetDoc[categoryId];
    } else {
      budgetDoc[categoryId] = categoryBudget;
    }

    await updateBudget(userId, period, budgetDoc);
  };

  /**
   * Remove budget for a specific category in a specific month
   * @param userId User ID
   * @param period Period in format YYYY-MM
   * @param categoryId Category ID
   */
  const removeCategoryBudget = async (userId: string, period: string, categoryId: string): Promise<void> => {
    const budgetDoc = budgets.value.get(period) || {};
    delete budgetDoc[categoryId];
    await updateBudget(userId, period, budgetDoc);
  };

  /**
   * Fetch all budget periods for a user
   * @param userId User ID
   * @returns Array of period strings (YYYY-MM)
   */
  const fetchAllBudgets = async (userId: string): Promise<string[]> => {
    loading.value = true;

    try {
      const budgetsRef = collection(db, 'users', userId, 'budgets');
      const budgetsSnap = await getDocs(budgetsRef);

      const periods: string[] = [];
      budgetsSnap.forEach((doc) => {
        periods.push(doc.id);
        budgets.value.set(doc.id, fromFirestore(doc.data() as FirestoreBudgetDoc));
      });

      return periods.sort().reverse(); // Most recent first
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete budget for a specific month
   * @param userId User ID
   * @param period Period in format YYYY-MM
   */
  const deleteBudget = async (userId: string, period: string): Promise<void> => {
    loading.value = true;

    try {
      const budgetRef = doc(db, 'users', userId, 'budgets', period);
      await deleteDoc(budgetRef);

      // Update local cache
      budgets.value.delete(period);
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Clear local budget cache
   */
  const clearCache = (): void => {
    budgets.value.clear();
  };

  return {
    // State
    loading,
    budgets,
    // Actions
    fetchBudget,
    fetchAllBudgets,
    updateBudget,
    deleteBudget,
    calculateBudgetStatus,
    getCategoryBudget,
    setCategoryBudget,
    updateCategoryBudget,
    removeCategoryBudget,
    clearCache,
  };
});
