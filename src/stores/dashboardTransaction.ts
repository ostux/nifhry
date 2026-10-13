import { db } from '@/config/firebase';
import type { Transaction } from '@/types';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Dashboard Transaction Store
 *
 * This store is specifically for dashboard data and loads a full year of transactions
 * once when the dashboard is accessed. The data is cached and won't be refetched
 * during the same page session unless explicitly cleared.
 *
 * This avoids repeatedly downloading large transaction sets when switching between
 * dashboard and account views.
 */
export const useDashboardTransactionStore = defineStore('dashboardTransaction', () => {
  // State
  const loading = ref(false);
  const transactions = ref<Transaction[]>([]);
  const lastFetchTimestamp = ref<number | null>(null);

  /**
   * Fetch transactions for dashboard (full year worth of data)
   * Only fetches if not already loaded in this session
   * @param userId - User ID
   * @param dateFrom - Start date for filtering
   * @param dateTo - End date for filtering
   * @param force - Force refetch even if data is already loaded
   */
  const fetchDashboardTransactions = async (
    userId: string,
    dateFrom: Date,
    dateTo: Date,
    force: boolean = false,
  ): Promise<void> => {
    // Skip if already loaded unless force is true
    if (!force && transactions.value.length > 0 && lastFetchTimestamp.value !== null) {
      return;
    }

    loading.value = true;

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const queryConstraints: QueryConstraint[] = [];

      // Filter by date range
      queryConstraints.push(where('at', '>=', dateFrom));
      queryConstraints.push(where('at', '<=', dateTo));

      // Order by date descending
      queryConstraints.push(orderBy('at', 'desc'));

      const q = query(transactionsRef, ...queryConstraints);
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          d: data.d,
          c: data.c,
          a: data.a,
          i: data.i ?? 0,
          o: data.o ?? 0,
          op: data.op,
          at: data.at?.toDate() || new Date(),
          s: data.s,
          iId: data.iId,
        } as Transaction;
      });

      transactions.value = results;
      lastFetchTimestamp.value = Date.now();

      loading.value = false;
    } catch (error) {
      console.error('Error fetching dashboard transactions:', error);
      loading.value = false;
      throw error;
    }
  };

  /**
   * Clear cached transactions
   * Call this when you want to force a fresh load on next dashboard visit
   */
  const clearDashboardTransactions = (): void => {
    transactions.value = [];
    lastFetchTimestamp.value = null;
  };

  /**
   * Check if transactions are loaded
   */
  const isLoaded = (): boolean => {
    return transactions.value.length > 0 && lastFetchTimestamp.value !== null;
  };

  return {
    // State
    loading,
    transactions,
    lastFetchTimestamp,
    // Actions
    fetchDashboardTransactions,
    clearDashboardTransactions,
    isLoaded,
  };
});
