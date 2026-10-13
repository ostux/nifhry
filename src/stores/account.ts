import { db } from '@/config/firebase';
import type { Account, AccountKind } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { FIRESTORE_BATCH_SIZE } from '@/constants/transactions';
import { useCurrenciesStore } from './currencies';

export const useAccountStore = defineStore('account', () => {
  const currenciesStore = useCurrenciesStore();
  // State
  const loading = ref(false);
  const accounts = ref<Account[]>([]);
  const showArchived = ref(false);
  const unsubscribe = ref<Unsubscribe | null>(null);

  // Getters
  const visibleAccounts = computed(() => {
    if (showArchived.value) {
      return accounts.value;
    }
    return accounts.value.filter((account) => account.status !== 'archived');
  });

  const activeAccounts = computed(() => {
    return accounts.value.filter((account) => account.status === 'active');
  });

  const closedAccounts = computed(() => {
    return accounts.value.filter((account) => account.status === 'closed');
  });

  const archivedAccounts = computed(() => {
    return accounts.value.filter((account) => account.status === 'archived');
  });

  // Actions
  const initAccountsListener = (userId: string): void => {
    if (accounts.value.length) return;

    // Cleanup existing listener if any
    if (unsubscribe.value) {
      unsubscribe.value();
    }

    loading.value = true;

    try {
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const q = query(accountsRef);

      unsubscribe.value = onSnapshot(
        q,
        (snapshot) => {
          accounts.value = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name,
                bal: data.bal,
                bAsOf: data.bAsOf?.toDate() || new Date(),
                kind: data.kind,
                status: data.status,
                order: data.order ?? 0, // Default to 0 if missing
                cAt: data.cAt?.toDate() || new Date(),
                uAt: data.uAt?.toDate() || new Date(),
                // Migration: default to main currency if cur field is missing
                cur: data.cur || currenciesStore.mainCurrency,
              } as Account;
            })
            .sort((a, b) => a.order - b.order) // Sort by order
            .map((account, index) => ({ ...account, order: index })); // Normalize to sequential indices
          loading.value = false;
        },
        (error) => {
          console.error('Error fetching accounts:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          loading.value = false;
        },
      );
    } catch (error) {
      console.error('Error initializing accounts listener:', error);
      loading.value = false;
    }
  };

  const cleanupListener = (): void => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    accounts.value = [];
  };

  const createAccount = async (
    userId: string,
    accountData: { name: string; kind: AccountKind; balance?: number; currency?: string },
  ): Promise<void> => {
    loading.value = true;

    try {
      const accountsRef = collection(db, 'users', userId, 'accounts');

      const accountRef = await addDoc(accountsRef, {
        name: accountData.name,
        kind: accountData.kind,
        bal: accountData.balance ?? 0,
        bAsOf: serverTimestamp(),
        status: 'active',
        order: 0,
        cAt: serverTimestamp(),
        uAt: serverTimestamp(),
        cur: accountData.currency || currenciesStore.mainCurrency,
      });

      // Create initial balance transaction if balance is non-zero
      const balance = accountData.balance ?? 0;
      if (balance !== 0) {
        const { useTransactionStore } = await import('./transaction');
        const transactionStore = useTransactionStore();

        await transactionStore.createTransaction(userId, {
          description: 'Initial Balance', // This will be displayed in the UI, translations handle display
          account: accountRef.id,
          inAmount: balance > 0 ? balance : 0,
          outAmount: balance < 0 ? Math.abs(balance) : 0,
          date: new Date(),
          status: 'paid',
        });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateAccount = async (
    userId: string,
    accountId: string,
    updates: { name?: string; kind?: AccountKind; currency?: string },
  ): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      const updateData: any = {
        ...updates,
        uAt: serverTimestamp(),
      };

      // If currency is being updated, use 'cur' field name for Firestore
      if (updates.currency !== undefined) {
        updateData.cur = updates.currency;
        delete updateData.currency;
      }

      await updateDoc(accountRef, updateData);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const setAccountBalance = async (userId: string, accountId: string, balance: number): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      await updateDoc(accountRef, {
        bal: balance,
        bAsOf: serverTimestamp(),
        uAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting account balance:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const closeAccount = async (userId: string, accountId: string): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      await updateDoc(accountRef, {
        status: 'closed',
        uAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error closing account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const reopenAccount = async (userId: string, accountId: string): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      await updateDoc(accountRef, {
        status: 'active',
        uAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error reopening account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const archiveAccount = async (userId: string, accountId: string): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      await updateDoc(accountRef, {
        status: 'archived',
        uAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteAccount = async (userId: string, accountId: string): Promise<void> => {
    loading.value = true;

    try {
      // Delete all transactions belonging to this account in batches
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsQuery = query(transactionsRef, where('a', '==', accountId));
      const snapshot = await getDocs(transactionsQuery);

      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        docs.slice(i, i + FIRESTORE_BATCH_SIZE).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      const accountRef = doc(db, 'users', userId, 'accounts', accountId);
      await deleteDoc(accountRef);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const setAccountOrder = async (userId: string, accountId: string, order: number): Promise<void> => {
    loading.value = true;

    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountId);

      await updateDoc(accountRef, {
        order,
        uAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting account order:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const reorderAccounts = async (userId: string, accountOrders: { accountId: string; order: number }[]): Promise<void> => {
    loading.value = true;

    try {
      const batch = writeBatch(db);

      accountOrders.forEach(({ accountId, order }) => {
        const accountRef = doc(db, 'users', userId, 'accounts', accountId);
        batch.update(accountRef, {
          order,
          uAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error reordering accounts:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const toggleShowArchived = (): void => {
    showArchived.value = !showArchived.value;
  };

  return {
    // State
    loading,
    accounts,
    showArchived,
    // Getters
    visibleAccounts,
    activeAccounts,
    closedAccounts,
    archivedAccounts,
    // Actions
    initAccountsListener,
    cleanupListener,
    createAccount,
    updateAccount,
    setAccountBalance,
    closeAccount,
    reopenAccount,
    archiveAccount,
    deleteAccount,
    setAccountOrder,
    reorderAccounts,
    toggleShowArchived,
  };
});
