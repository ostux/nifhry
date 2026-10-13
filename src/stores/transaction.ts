import { db } from '@/config/firebase';
import type { Account, FirestoreTransactionData, Transaction, TransactionFilters, TransactionStatus } from '@/types';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAccountStore } from './account';
import moment from 'moment';
import {
  TRANSACTION_QUERY_LIMIT,
  FIRESTORE_BATCH_SIZE,
  OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS,
} from '@/constants/transactions';

export const useTransactionStore = defineStore('transaction', () => {
  // State
  const loading = ref(false);
  const transactions = ref<Transaction[]>([]);

  // Actions
  const clearTransactions = () => {
    transactions.value = [];
  };

  const fetchTransactions = async (userId: string, filters?: TransactionFilters, forceLimit: boolean = true): Promise<void> => {
    loading.value = true;

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const queryConstraints: QueryConstraint[] = [];

      // Apply filters
      if (filters?.status) {
        queryConstraints.push(where('s', '==', filters.status));
      }

      if (filters?.accountIds && filters.accountIds.length > 0) {
        queryConstraints.push(where('a', 'in', filters.accountIds));
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        queryConstraints.push(where('c', 'in', filters.categoryIds));
      }

      if (filters?.dateFrom) {
        queryConstraints.push(where('at', '>=', filters.dateFrom));
      }

      if (filters?.dateTo) {
        queryConstraints.push(where('at', '<=', filters.dateTo));
      }

      // Always order by date and limit results
      queryConstraints.push(orderBy('at', 'desc'));
      if (forceLimit) queryConstraints.push(limit(TRANSACTION_QUERY_LIMIT));

      const q = query(transactionsRef, ...queryConstraints);
      const snapshot = await getDocs(q);

      let results = snapshot.docs.map((doc) => {
        const data = doc.data();
        const accountStore = useAccountStore();

        // Migration: Get currency from account if not present on transaction
        let currency = data.cur;
        if (!currency) {
          const account = accountStore.accounts.find((acc) => acc.id === data.a);
          currency = account?.cur;
        }

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
          pId: data.pId,
          cur: currency,
        } as Transaction;
      });

      // Apply client-side filters for fields that can't be efficiently queried in Firestore
      if (filters?.description) {
        const searchTerm = filters.description.toLowerCase();
        results = results.filter((t) => t.d.toLowerCase().includes(searchTerm));
      }

      transactions.value = results;

      loading.value = false;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      loading.value = false;
      throw error;
    }
  };

  const createTransaction = async (
    userId: string,
    transactionData: {
      description: string;
      category?: string;
      account: string;
      target?: string;
      inAmount: number;
      outAmount: number;
      date: Date;
      status: TransactionStatus;
      oppositeTransactionId?: string;
    },
  ): Promise<void> => {
    loading.value = true;

    try {
      const accountStore = useAccountStore();
      const transactionsRef = collection(db, 'users', userId, 'transactions');

      if (transactionData.target) {
        // Create opposite transactions using batch write
        const firstRef = doc(transactionsRef);
        const secondRef = doc(transactionsRef);

        const batch = writeBatch(db);

        // Get currency from accounts
        const sourceAccount = accountStore.accounts.find((acc) => acc.id === transactionData.account);
        const targetAccount = accountStore.accounts.find((acc) => acc.id === transactionData.target);

        // Determine if this is a cross-currency transfer
        const isCrossCurrency = sourceAccount?.cur !== targetAccount?.cur;

        // For cross-currency transfers:
        // - Source transaction has only OUT (money leaving in source currency)
        // - Target transaction has only IN (money arriving in target currency)
        // For same-currency transfers:
        // - Reverse the amounts (out from source becomes in at target)
        let firstIn, firstOut, secondIn, secondOut;

        if (isCrossCurrency) {
          // Cross-currency: outAmount is what leaves source, inAmount is what arrives at target
          firstIn = 0;
          firstOut = transactionData.outAmount;
          secondIn = transactionData.inAmount;
          secondOut = 0;
        } else {
          // Same currency: reverse the single amount
          firstIn = transactionData.inAmount;
          firstOut = transactionData.outAmount;
          secondIn = transactionData.outAmount;
          secondOut = transactionData.inAmount;
        }

        // First transaction (source account)
        const firstData: FirestoreTransactionData = {
          d: transactionData.description,
          a: transactionData.account,
          i: firstIn,
          o: firstOut,
          op: secondRef.id,
          at: transactionData.date,
          s: transactionData.status,
          cur: sourceAccount?.cur,
        };
        if (transactionData.category) {
          firstData.c = transactionData.category;
        }

        batch.set(firstRef, firstData);

        // Opposite transaction (target account)
        const secondData: FirestoreTransactionData = {
          d: transactionData.description,
          a: transactionData.target,
          i: secondIn,
          o: secondOut,
          op: firstRef.id,
          at: transactionData.date,
          s: transactionData.status,
          cur: targetAccount?.cur,
        };
        if (transactionData.category) {
          secondData.c = transactionData.category;
        }

        batch.set(secondRef, secondData);

        await batch.commit();

        // Update account balances
        await updateAccountBalances(
          userId,
          accountStore,
          [
            { accountId: transactionData.account, inAmount: firstIn, outAmount: firstOut },
            { accountId: transactionData.target, inAmount: secondIn, outAmount: secondOut },
          ],
          transactionData.status,
        );
      } else if (transactionData.oppositeTransactionId) {
        // Link to existing opposite transaction
        const account = accountStore.accounts.find((acc) => acc.id === transactionData.account);

        const newTransactionData: FirestoreTransactionData = {
          d: transactionData.description,
          a: transactionData.account,
          i: transactionData.inAmount,
          o: transactionData.outAmount,
          op: transactionData.oppositeTransactionId,
          at: transactionData.date,
          s: transactionData.status,
          cur: account?.cur,
        };
        if (transactionData.category) {
          newTransactionData.c = transactionData.category;
        }

        const newTransactionRef = await addDoc(transactionsRef, newTransactionData);

        // Update the opposite transaction to link back
        const oppositeTransactionRef = doc(db, 'users', userId, 'transactions', transactionData.oppositeTransactionId);
        await updateDoc(oppositeTransactionRef, {
          op: newTransactionRef.id,
        });

        // Update account balance
        await updateAccountBalances(
          userId,
          accountStore,
          [{ accountId: transactionData.account, inAmount: transactionData.inAmount, outAmount: transactionData.outAmount }],
          transactionData.status,
        );
      } else {
        // Single transaction
        const account = accountStore.accounts.find((acc) => acc.id === transactionData.account);

        const newTransactionData: FirestoreTransactionData = {
          d: transactionData.description,
          a: transactionData.account,
          i: transactionData.inAmount,
          o: transactionData.outAmount,
          at: transactionData.date,
          s: transactionData.status,
          cur: account?.cur,
        };
        if (transactionData.category) {
          newTransactionData.c = transactionData.category;
        }

        await addDoc(transactionsRef, newTransactionData);

        // Update account balance
        await updateAccountBalances(
          userId,
          accountStore,
          [{ accountId: transactionData.account, inAmount: transactionData.inAmount, outAmount: transactionData.outAmount }],
          transactionData.status,
        );
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateTransaction = async (
    userId: string,
    transactionId: string,
    updates: {
      description?: string;
      category?: string;
      account?: string;
      inAmount?: number;
      outAmount?: number;
      date?: Date;
      status?: TransactionStatus;
      oppositeTransactionId?: string;
    },
    originalTransaction: Transaction,
  ): Promise<void> => {
    loading.value = true;

    try {
      const accountStore = useAccountStore();
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);

      // Build update object
      const updateData: Partial<FirestoreTransactionData> & { op?: string | null } = {};
      if (updates.description !== undefined) updateData.d = updates.description;
      if (updates.category !== undefined) updateData.c = updates.category;
      if (updates.account !== undefined) updateData.a = updates.account;
      if (updates.inAmount !== undefined) updateData.i = updates.inAmount;
      if (updates.outAmount !== undefined) updateData.o = updates.outAmount;
      if (updates.date !== undefined) updateData.at = updates.date;
      if (updates.status !== undefined) updateData.s = updates.status;

      // Handle opposite transaction ID change
      if (updates.oppositeTransactionId !== undefined) {
        // If changing opposite transaction
        if (originalTransaction.op && originalTransaction.op !== updates.oppositeTransactionId) {
          // Remove old opposite link
          const oldOppositeRef = doc(db, 'users', userId, 'transactions', originalTransaction.op);
          await updateDoc(oldOppositeRef, {
            op: null,
          });
        }

        if (updates.oppositeTransactionId) {
          updateData.op = updates.oppositeTransactionId;
          // Update new opposite transaction to link back
          const newOppositeRef = doc(db, 'users', userId, 'transactions', updates.oppositeTransactionId);
          await updateDoc(newOppositeRef, {
            op: transactionId,
          });
        } else {
          updateData.op = undefined;
        }
      }

      await updateDoc(transactionRef, updateData);

      // If this transaction has an opposite transaction and we're not removing/changing the link,
      // update the opposite transaction with synchronized changes
      const isRemovingOppositeLink = updates.oppositeTransactionId !== undefined && !updates.oppositeTransactionId;
      const isChangingOppositeLink = updates.oppositeTransactionId !== undefined && updates.oppositeTransactionId !== originalTransaction.op;

      if (originalTransaction.op && !isRemovingOppositeLink && !isChangingOppositeLink) {
        const oppositeTransaction = transactions.value.find((t) => t.id === originalTransaction.op);

        if (oppositeTransaction) {
          const oppositeRef = doc(db, 'users', userId, 'transactions', originalTransaction.op);
          const oppositeUpdateData: Partial<FirestoreTransactionData> = {};

          // Sync description, category, date, and status
          if (updates.description !== undefined) oppositeUpdateData.d = updates.description;
          if (updates.category !== undefined) oppositeUpdateData.c = updates.category;
          if (updates.date !== undefined) oppositeUpdateData.at = updates.date;
          if (updates.status !== undefined) oppositeUpdateData.s = updates.status;

          // Check if this is a cross-currency transfer
          const isCrossCurrency = originalTransaction.cur !== oppositeTransaction.cur;

          // Handle amounts based on transfer type
          if (isCrossCurrency) {
            // For cross-currency: don't reverse amounts
            // - If updating inAmount, that's for the target account (opposite)
            // - If updating outAmount, that's for the source account (original)
            if (updates.inAmount !== undefined) oppositeUpdateData.i = updates.inAmount;
            if (updates.outAmount !== undefined) oppositeUpdateData.o = updates.outAmount;
          } else {
            // For same currency: reverse amounts (in becomes out, out becomes in)
            if (updates.inAmount !== undefined) oppositeUpdateData.o = updates.inAmount;
            if (updates.outAmount !== undefined) oppositeUpdateData.i = updates.outAmount;
          }

          // Only update if there are changes
          if (Object.keys(oppositeUpdateData).length > 0) {
            await updateDoc(oppositeRef, oppositeUpdateData);

            // Update local state for opposite transaction
            const oppositeIndex = transactions.value.findIndex((t) => t.id === originalTransaction.op);
            if (oppositeIndex !== -1 && transactions.value[oppositeIndex]) {
              const localStateUpdates: any = {
                ...transactions.value[oppositeIndex]!,
                ...(updates.description !== undefined && { d: updates.description }),
                ...(updates.category !== undefined && { c: updates.category }),
                ...(updates.date !== undefined && { at: updates.date }),
                ...(updates.status !== undefined && { s: updates.status }),
              };

              // Apply amount updates based on transfer type
              if (isCrossCurrency) {
                if (updates.inAmount !== undefined) localStateUpdates.i = updates.inAmount;
                if (updates.outAmount !== undefined) localStateUpdates.o = updates.outAmount;
              } else {
                if (updates.inAmount !== undefined) localStateUpdates.o = updates.inAmount;
                if (updates.outAmount !== undefined) localStateUpdates.i = updates.outAmount;
              }

              transactions.value[oppositeIndex] = localStateUpdates;
            }
          }
        }
      }

      // Update account balances based on status changes
      const oldStatus = originalTransaction.s;
      const newStatus = updates.status ?? originalTransaction.s;
      const balanceUpdates: Array<{ accountId: string; inAmount: number; outAmount: number }> = [];

      // If original was paid, reverse its effect
      if (oldStatus === 'paid') {
        balanceUpdates.push({
          accountId: originalTransaction.a,
          inAmount: -originalTransaction.i,
          outAmount: -originalTransaction.o,
        });

        // If there's an opposite transaction, reverse its effect too
        if (originalTransaction.op) {
          const oppositeTransaction = transactions.value.find((t) => t.id === originalTransaction.op);
          if (oppositeTransaction) {
            balanceUpdates.push({
              accountId: oppositeTransaction.a,
              inAmount: -oppositeTransaction.i,
              outAmount: -oppositeTransaction.o,
            });
          }
        }
      }

      // If new status is paid, apply the new transaction effect
      if (newStatus === 'paid') {
        balanceUpdates.push({
          accountId: updates.account ?? originalTransaction.a,
          inAmount: updates.inAmount ?? originalTransaction.i,
          outAmount: updates.outAmount ?? originalTransaction.o,
        });

        // If there's an opposite transaction and we're not removing/changing the link,
        // apply its new effect too
        if (originalTransaction.op && !isRemovingOppositeLink && !isChangingOppositeLink) {
          const oppositeTransaction = transactions.value.find((t) => t.id === originalTransaction.op);
          if (oppositeTransaction) {
            // Check if this is a cross-currency transfer
            const isCrossCurrency = originalTransaction.cur !== oppositeTransaction.cur;

            let oppositeInAmount, oppositeOutAmount;
            if (isCrossCurrency) {
              // For cross-currency: use the updated values directly (no reversal)
              oppositeInAmount = updates.inAmount ?? oppositeTransaction.i;
              oppositeOutAmount = updates.outAmount ?? oppositeTransaction.o;
            } else {
              // For same currency: reverse the amounts
              oppositeInAmount = updates.outAmount ?? originalTransaction.o;
              oppositeOutAmount = updates.inAmount ?? originalTransaction.i;
            }

            balanceUpdates.push({
              accountId: oppositeTransaction.a,
              inAmount: oppositeInAmount,
              outAmount: oppositeOutAmount,
            });
          }
        }
      }

      // Only update balances if there are changes to apply
      if (balanceUpdates.length > 0) {
        await updateAccountBalances(userId, accountStore, balanceUpdates, 'paid');
      }

      // Update local transaction state
      const index = transactions.value.findIndex((t) => t.id === transactionId);
      if (index !== -1) {
        transactions.value[index] = {
          ...transactions.value[index]!,
          ...(updates.description !== undefined && { d: updates.description }),
          ...(updates.category !== undefined && { c: updates.category }),
          ...(updates.account !== undefined && { a: updates.account }),
          ...(updates.inAmount !== undefined && { i: updates.inAmount }),
          ...(updates.outAmount !== undefined && { o: updates.outAmount }),
          ...(updates.date !== undefined && { at: updates.date }),
          ...(updates.status !== undefined && { s: updates.status }),
          ...(updates.oppositeTransactionId !== undefined && { op: updates.oppositeTransactionId }),
        };
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteTransaction = async (userId: string, transactionId: string): Promise<void> => {
    loading.value = true;

    try {
      const accountStore = useAccountStore();

      // Get the transaction to find opposite transaction and account
      const transaction = transactions.value.find((t) => t.id === transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const batch = writeBatch(db);
      const balanceUpdates: Array<{ accountId: string; inAmount: number; outAmount: number }> = [];

      // Case 1: Deleting a parent transaction - delete all children
      if (!transaction.pId) {
        const children = transactions.value.filter((t) => t.pId === transactionId);

        if (children.length > 0) {
          // Delete all child transactions
          children.forEach((child) => {
            const childRef = doc(db, 'users', userId, 'transactions', child.id);
            batch.delete(childRef);
            // Track balance changes for children
            balanceUpdates.push({
              accountId: child.a,
              inAmount: -child.i,
              outAmount: -child.o,
            });
          });

          // Remove children from local state
          transactions.value = transactions.value.filter((t) => t.pId !== transactionId);
        }
      }

      // Case 2: Deleting a child transaction - restore amount to parent
      if (transaction.pId) {
        const parent = transactions.value.find((t) => t.id === transaction.pId);

        if (parent) {
          const parentRef = doc(db, 'users', userId, 'transactions', transaction.pId);
          const isIncome = transaction.i > 0;

          // Restore the deleted child's amount to the parent
          const parentUpdate: Partial<FirestoreTransactionData> = {};
          if (isIncome) {
            parentUpdate.i = parent.i + transaction.i;
          } else {
            parentUpdate.o = parent.o + transaction.o;
          }

          batch.update(parentRef, parentUpdate);

          // Update local state for parent
          const parentIndex = transactions.value.findIndex((t) => t.id === transaction.pId);
          if (parentIndex !== -1 && transactions.value[parentIndex]) {
            if (isIncome) {
              transactions.value[parentIndex]!.i += transaction.i;
            } else {
              transactions.value[parentIndex]!.o += transaction.o;
            }
          }
        }
      }

      // Handle opposite transaction link
      if (transaction.op) {
        const oppositeTransactionRef = doc(db, 'users', userId, 'transactions', transaction.op);
        batch.update(oppositeTransactionRef, {
          op: null,
        });
      }

      // Delete the main transaction
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
      batch.delete(transactionRef);

      // Track balance change for main transaction
      balanceUpdates.push({
        accountId: transaction.a,
        inAmount: -transaction.i,
        outAmount: -transaction.o,
      });

      await batch.commit();

      // Update account balances
      await updateAccountBalances(userId, accountStore, balanceUpdates, transaction.s);

      // Remove from local state
      transactions.value = transactions.value.filter((t) => t.id !== transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const findPotentialOppositeTransactions = async (
    userId: string,
    params: {
      currentAccount: string;
      inAmount: number;
      outAmount: number;
      date: Date;
    },
  ): Promise<Transaction[]> => {
    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');

      // Calculate date range (±N days tolerance)
      const startDate = moment(params.date).subtract(OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS, 'days').toDate();
      const endDate = moment(params.date).add(OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS, 'days').toDate();

      // Query for transactions in the date range with reversed amounts
      const q = query(transactionsRef, where('at', '>=', startDate), where('at', '<=', endDate), orderBy('at', 'desc'));

      const snapshot = await getDocs(q);

      const potentialTransactions = snapshot.docs
        .map((doc) => {
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
            pId: data.pId,
          } as Transaction;
        })
        .filter((transaction) => {
          // Filter out transactions from the same account
          if (transaction.a === params.currentAccount) return false;

          // Filter out transactions that already have an opposite link
          if (transaction.op) return false;

          // Check if amounts are reversed
          const amountsMatch = transaction.i === params.outAmount && transaction.o === params.inAmount;

          return amountsMatch;
        });

      return potentialTransactions;
    } catch (error) {
      console.error('Error finding potential opposite transactions:', error);
      return [];
    }
  };

  // Helper function to update account balances
  const updateAccountBalances = async (
    userId: string,
    accountStore: ReturnType<typeof useAccountStore>,
    updates: Array<{ accountId: string; inAmount: number; outAmount: number }>,
    status: TransactionStatus,
  ): Promise<void> => {
    // Only update balances for paid transactions
    if (status !== 'paid') {
      return;
    }

    try {
      // Group updates by account ID
      const balanceChanges = new Map<string, number>();

      for (const update of updates) {
        const currentChange = balanceChanges.get(update.accountId) || 0;
        const netChange = update.inAmount - update.outAmount;
        balanceChanges.set(update.accountId, currentChange + netChange);
      }

      // Apply balance changes
      for (const [accountId, change] of balanceChanges.entries()) {
        const account = accountStore.accounts.find((a: Account) => a.id === accountId);
        if (account) {
          const newBalance = account.bal + change;
          await accountStore.setAccountBalance(userId, accountId, newBalance);
        }
      }
    } catch (error) {
      console.error('Error updating account balances:', error);
      throw error;
    }
  };

  // Reset transactions (for backward compatibility with pagination removal)
  const resetPagination = (): void => {
    transactions.value = [];
  };

  /**
   * Check which import IDs already exist in the database
   * @param userId - User ID
   * @param importIds - Array of import IDs to check
   * @returns Array of existing import IDs
   */
  const checkDuplicatesByImportIds = async (userId: string, importIds: string[]): Promise<string[]> => {
    if (importIds.length === 0) return [];

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const existingIds: string[] = [];

      // Firestore 'in' query supports up to 10 values at a time
      const chunkSize = 10;
      for (let i = 0; i < importIds.length; i += chunkSize) {
        const chunk = importIds.slice(i, i + chunkSize);
        const q = query(transactionsRef, where('iId', 'in', chunk));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.iId) {
            existingIds.push(data.iId);
          }
        });
      }

      return existingIds;
    } catch (error) {
      console.error('Error checking duplicate import IDs:', error);
      return [];
    }
  };

  /**
   * Import transactions in bulk with duplicate detection and opposite transaction matching
   * @param userId - User ID
   * @param accountId - Account ID for these transactions
   * @param transactionsData - Array of transaction data to import
   * @returns Object with imported count, duplicate import IDs, and linked opposites count
   */
  const importTransactions = async (
    userId: string,
    accountId: string,
    transactionsData: Array<{
      description: string;
      category?: string;
      inAmount: number;
      outAmount: number;
      date: Date;
      importId: string;
    }>,
  ): Promise<{ imported: number; duplicates: string[]; linkedOpposites: number }> => {
    loading.value = true;

    try {
      const accountStore = useAccountStore();

      // Check for duplicates
      const importIds = transactionsData.map((t) => t.importId);
      const existingIds = await checkDuplicatesByImportIds(userId, importIds);
      const existingIdsSet = new Set(existingIds);

      // Filter out duplicates
      const newTransactions = transactionsData.filter((t) => !existingIdsSet.has(t.importId));

      if (newTransactions.length === 0) {
        loading.value = false;
        return { imported: 0, duplicates: existingIds, linkedOpposites: 0 };
      }

      // Find opposite transactions
      const oppositeMatches = await findOppositeTransactionsDuringImport(userId, accountId, newTransactions);

      // Import in batches (Firestore batch limit is 500 operations)
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const batchSize = FIRESTORE_BATCH_SIZE;
      let totalBalanceChange = 0;

      // Get account currency for imported transactions
      const importAccount = accountStore.accounts.find((a: Account) => a.id === accountId);
      const accountCurrency = importAccount?.cur;

      // Store new transaction IDs mapped to import IDs
      const newTransactionIds = new Map<string, string>();

      for (let i = 0; i < newTransactions.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = newTransactions.slice(i, i + batchSize);

        chunk.forEach((transaction) => {
          const docRef = doc(transactionsRef);
          const transactionData: FirestoreTransactionData & { iId?: string; op?: string } = {
            d: transaction.description,
            a: accountId,
            i: transaction.inAmount,
            o: transaction.outAmount,
            at: transaction.date,
            s: 'paid' as TransactionStatus,
            iId: transaction.importId,
          };

          // Add currency from account if available
          if (accountCurrency) {
            transactionData.cur = accountCurrency;
          }

          if (transaction.category) {
            transactionData.c = transaction.category;
          }

          // Add opposite transaction link if found
          const oppositeId = oppositeMatches.get(transaction.importId);
          if (oppositeId) {
            transactionData.op = oppositeId;
          }

          batch.set(docRef, transactionData);
          newTransactionIds.set(transaction.importId, docRef.id);

          // Calculate balance change
          totalBalanceChange += transaction.inAmount - transaction.outAmount;
        });

        await batch.commit();
      }

      // Update existing opposite transactions to link back (in batches)
      if (oppositeMatches.size > 0) {
        const updateBatchSize = 500;
        const oppositeUpdates = Array.from(oppositeMatches.entries());

        for (let i = 0; i < oppositeUpdates.length; i += updateBatchSize) {
          const batch = writeBatch(db);
          const chunk = oppositeUpdates.slice(i, i + updateBatchSize);

          chunk.forEach(([importId, existingTxId]) => {
            const newTxId = newTransactionIds.get(importId);
            if (newTxId) {
              const oppositeRef = doc(db, 'users', userId, 'transactions', existingTxId);
              batch.update(oppositeRef, { op: newTxId });
            }
          });

          await batch.commit();
        }
      }

      // Update account balance once after all imports
      const account = accountStore.accounts.find((a: Account) => a.id === accountId);
      if (account) {
        const newBalance = account.bal + totalBalanceChange;
        await accountStore.setAccountBalance(userId, accountId, newBalance);
      }

      loading.value = false;
      return { imported: newTransactions.length, duplicates: existingIds, linkedOpposites: oppositeMatches.size };
    } catch (error) {
      console.error('Error importing transactions:', error);
      loading.value = false;
      throw error;
    }
  };

  /**
   * Find opposite transactions during import
   * Matches transactions by date (±5 days), reversed amounts, and different accounts
   * @param userId - User ID
   * @param accountId - Account ID being imported to
   * @param transactionsToImport - Array of transactions being imported
   * @returns Map of importId -> existing transaction ID
   */
  const findOppositeTransactionsDuringImport = async (
    userId: string,
    accountId: string,
    transactionsToImport: Array<{
      date: Date;
      inAmount: number;
      outAmount: number;
      importId: string;
    }>,
  ): Promise<Map<string, string>> => {
    const matches = new Map<string, string>();

    if (transactionsToImport.length === 0) return matches;

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');

      // Get date range for all transactions (with tolerance)
      const dates = transactionsToImport.map((t) => t.date);
      const minDate = moment.min(dates.map((d) => moment(d))).subtract(OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS, 'days').toDate();
      const maxDate = moment.max(dates.map((d) => moment(d))).add(OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS, 'days').toDate();

      // Query existing transactions in date range
      const q = query(transactionsRef, where('at', '>=', minDate), where('at', '<=', maxDate), orderBy('at', 'desc'));

      const snapshot = await getDocs(q);

      const existingTransactions = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            a: data.a,
            i: data.i ?? 0,
            o: data.o ?? 0,
            op: data.op,
            at: data.at?.toDate() || new Date(),
          };
        })
        .filter((t) => {
          // Filter out transactions from the same account
          if (t.a === accountId) return false;
          // Filter out transactions that already have opposite links
          if (t.op) return false;
          return true;
        });

      // Match each import transaction with existing ones
      for (const importTx of transactionsToImport) {
        for (const existingTx of existingTransactions) {
          // Check if amounts are reversed
          const amountsMatch = existingTx.i === importTx.outAmount && existingTx.o === importTx.inAmount;

          if (!amountsMatch) continue;

          // Check if dates are within tolerance
          const daysDiff = Math.abs(moment(existingTx.at).diff(moment(importTx.date), 'days'));
          if (daysDiff > OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS) continue;

          // Found a match!
          matches.set(importTx.importId, existingTx.id);
          break; // Only match once per import transaction
        }
      }

      return matches;
    } catch (error) {
      console.error('Error finding opposite transactions during import:', error);
      return matches;
    }
  };

  /**
   * Find category by description from transaction history
   * @param userId - User ID
   * @param description - Transaction description
   * @returns Category ID if found, undefined otherwise
   */
  const findCategoryByDescription = async (userId: string, description: string): Promise<string | undefined> => {
    if (!description || description.trim().length === 0) return undefined;

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const normalizedDescription = description.toLowerCase().trim();

      // Query for transactions with the same description that have a category
      const q = query(transactionsRef, orderBy('at', 'desc'), limit(TRANSACTION_QUERY_LIMIT));

      const snapshot = await getDocs(q);

      // Find transactions with matching description and category
      const categoryCounts = new Map<string, number>();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.c) continue; // Skip if no category

        const txDescription = (data.d || '').toLowerCase().trim();

        // Exact match
        if (txDescription === normalizedDescription) {
          const count = categoryCounts.get(data.c) || 0;
          categoryCounts.set(data.c, count + 1);
        }
      }

      // Return the most common category
      if (categoryCounts.size > 0) {
        let maxCount = 0;
        let mostCommonCategory = undefined;

        for (const [categoryId, count] of categoryCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonCategory = categoryId;
          }
        }

        return mostCommonCategory;
      }

      return undefined;
    } catch (error) {
      console.error('Error finding category by description:', error);
      return undefined;
    }
  };

  /**
   * Force import a single transaction (even if duplicate)
   * @param userId - User ID
   * @param accountId - Account ID
   * @param transactionData - Transaction data to import
   */
  const forceImportTransaction = async (
    userId: string,
    accountId: string,
    transactionData: {
      description: string;
      category?: string;
      inAmount: number;
      outAmount: number;
      date: Date;
      importId: string;
    },
  ): Promise<void> => {
    loading.value = true;

    try {
      const accountStore = useAccountStore();
      const transactionsRef = collection(db, 'users', userId, 'transactions');

      // Get account currency
      const importAccount = accountStore.accounts.find((a: Account) => a.id === accountId);
      const accountCurrency = importAccount?.cur;

      const newTransactionData: FirestoreTransactionData & { iId?: string } = {
        d: transactionData.description,
        a: accountId,
        i: transactionData.inAmount,
        o: transactionData.outAmount,
        at: transactionData.date,
        s: 'paid' as TransactionStatus,
        iId: transactionData.importId,
      };

      // Add currency from account if available
      if (accountCurrency) {
        newTransactionData.cur = accountCurrency;
      }

      if (transactionData.category) {
        newTransactionData.c = transactionData.category;
      }

      await addDoc(transactionsRef, newTransactionData);

      // Update account balance
      const account = accountStore.accounts.find((a: Account) => a.id === accountId);
      if (account) {
        const balanceChange = transactionData.inAmount - transactionData.outAmount;
        const newBalance = account.bal + balanceChange;
        await accountStore.setAccountBalance(userId, accountId, newBalance);
      }

      loading.value = false;
    } catch (error) {
      console.error('Error force importing transaction:', error);
      loading.value = false;
      throw error;
    }
  };

  /**
   * Recalculate all account balances from scratch based on paid transactions
   * @param userId - User ID
   * @param onProgress - Callback for progress updates
   * @returns Result object with success status and optional error message
   */
  const recalculateAccountBalances = async (
    userId: string,
    onProgress?: (step: 'accounts' | 'transactions' | 'calculating' | 'updating', data?: { count?: number }) => void,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Step 1: Fetch all accounts
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const accountsSnapshot = await getDocs(accountsRef);

      const accounts = accountsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          kind: data.kind,
        };
      });

      if (onProgress) {
        onProgress('accounts', { count: accounts.length });
      }

      // Step 2: Fetch all transactions (no limit, no filters except paid status)
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsQuery = query(transactionsRef, where('s', '==', 'paid'), orderBy('at', 'asc'));
      const transactionsSnapshot = await getDocs(transactionsQuery);

      const allTransactions = transactionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          a: data.a,
          i: data.i ?? 0,
          o: data.o ?? 0,
          at: data.at?.toDate() || new Date(),
        };
      });

      if (onProgress) {
        onProgress('transactions', { count: allTransactions.length });
      }

      // Step 3: Calculate new balances for each account
      const newBalances = new Map<string, number>();

      // Initialize all accounts with 0 balance
      accounts.forEach((account) => {
        newBalances.set(account.id, 0);
      });

      // Process all transactions chronologically
      allTransactions.forEach((transaction) => {
        const currentBalance = newBalances.get(transaction.a) || 0;
        const netChange = transaction.i - transaction.o;
        newBalances.set(transaction.a, currentBalance + netChange);
      });

      if (onProgress) {
        onProgress('calculating');
      }

      // Step 4: Update all account balances in Firestore using batch writes
      const batchSize = FIRESTORE_BATCH_SIZE;
      const accountsToUpdate = Array.from(newBalances.entries());

      for (let i = 0; i < accountsToUpdate.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = accountsToUpdate.slice(i, i + batchSize);

        chunk.forEach(([accountId, newBalance]) => {
          const accountRef = doc(db, 'users', userId, 'accounts', accountId);
          batch.update(accountRef, { bal: newBalance });
        });

        await batch.commit();
      }

      // Note: Account store uses real-time listeners (onSnapshot),
      // so the balances will update automatically after batch writes complete

      if (onProgress) {
        onProgress('updating', { count: accountsToUpdate.length });
      }

      return { success: true };
    } catch (error) {
      console.error('Error recalculating account balances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };

  /**
   * Batch update category for multiple transactions
   * @param userId - User ID
   * @param transactionIds - Array of transaction IDs to update
   * @param categoryId - Category ID to set
   * @returns Number of transactions updated
   */
  const batchUpdateCategory = async (userId: string, transactionIds: string[], categoryId: string): Promise<number> => {
    if (transactionIds.length === 0) return 0;

    loading.value = true;

    try {
      // Fetch all transactions for the user to find the ones we need
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsToUpdate: string[] = [];

      // Firestore 'in' query supports up to 30 values at a time
      const chunkSize = 30;
      for (let i = 0; i < transactionIds.length; i += chunkSize) {
        const chunk = transactionIds.slice(i, i + chunkSize);
        const q = query(transactionsRef, where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc) => {
          transactionsToUpdate.push(doc.id);
        });
      }

      // Update in batches (500 operations per batch)
      const batchSize = FIRESTORE_BATCH_SIZE;
      for (let i = 0; i < transactionsToUpdate.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = transactionsToUpdate.slice(i, i + batchSize);

        chunk.forEach((txId) => {
          const txRef = doc(db, 'users', userId, 'transactions', txId);
          batch.update(txRef, { c: categoryId });
        });

        await batch.commit();
      }

      // Update local state
      transactionsToUpdate.forEach((txId) => {
        const index = transactions.value.findIndex((t) => t.id === txId);
        if (index !== -1) {
          transactions.value[index]!.c = categoryId;
        }
      });

      loading.value = false;
      return transactionsToUpdate.length;
    } catch (error) {
      console.error('Error batch updating category:', error);
      loading.value = false;
      throw error;
    }
  };

  /**
   * Batch update status for multiple transactions
   * @param userId - User ID
   * @param transactionIds - Array of transaction IDs to update
   * @param status - Status to set ('paid' or 'pending')
   * @returns Number of transactions updated
   */
  const batchUpdateStatus = async (userId: string, transactionIds: string[], status: TransactionStatus): Promise<number> => {
    if (transactionIds.length === 0) return 0;

    loading.value = true;

    try {
      const accountStore = useAccountStore();
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsToUpdate: Transaction[] = [];

      // Firestore 'in' query supports up to 30 values at a time
      const chunkSize = 30;
      for (let i = 0; i < transactionIds.length; i += chunkSize) {
        const chunk = transactionIds.slice(i, i + chunkSize);
        const q = query(transactionsRef, where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          transactionsToUpdate.push({
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
            pId: data.pId,
          });
        });
      }

      // Calculate balance changes for each account
      const balanceChanges = new Map<string, number>();

      transactionsToUpdate.forEach((transaction) => {
        const oldStatus = transaction.s;
        const netChange = transaction.i - transaction.o;

        // If changing from paid to pending, reverse the balance change
        if (oldStatus === 'paid' && status === 'pending') {
          const currentChange = balanceChanges.get(transaction.a) || 0;
          balanceChanges.set(transaction.a, currentChange - netChange);
        }

        // If changing from pending to paid, apply the balance change
        if (oldStatus === 'pending' && status === 'paid') {
          const currentChange = balanceChanges.get(transaction.a) || 0;
          balanceChanges.set(transaction.a, currentChange + netChange);
        }
      });

      // Update transactions in batches (500 operations per batch)
      const batchSize = FIRESTORE_BATCH_SIZE;
      for (let i = 0; i < transactionsToUpdate.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = transactionsToUpdate.slice(i, i + batchSize);

        chunk.forEach((transaction) => {
          const txRef = doc(db, 'users', userId, 'transactions', transaction.id);
          batch.update(txRef, { s: status });
        });

        await batch.commit();
      }

      // Update account balances
      for (const [accountId, change] of balanceChanges.entries()) {
        const account = accountStore.accounts.find((a: Account) => a.id === accountId);
        if (account) {
          const newBalance = account.bal + change;
          await accountStore.setAccountBalance(userId, accountId, newBalance);
        }
      }

      // Update local state
      transactionsToUpdate.forEach((transaction) => {
        const index = transactions.value.findIndex((t) => t.id === transaction.id);
        if (index !== -1) {
          transactions.value[index]!.s = status;
        }
      });

      loading.value = false;
      return transactionsToUpdate.length;
    } catch (error) {
      console.error('Error batch updating status:', error);
      loading.value = false;
      throw error;
    }
  };

  const batchDeleteTransactions = async (userId: string, transactionIds: string[]): Promise<number> => {
    if (transactionIds.length === 0) return 0;

    loading.value = true;

    try {
      const accountStore = useAccountStore();
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsToDelete: Transaction[] = [];

      // Firestore 'in' query supports up to 30 values at a time
      const chunkSize = 30;
      for (let i = 0; i < transactionIds.length; i += chunkSize) {
        const chunk = transactionIds.slice(i, i + chunkSize);
        const q = query(transactionsRef, where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          transactionsToDelete.push({
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
            pId: data.pId,
          });
        });
      }

      if (transactionsToDelete.length === 0) {
        loading.value = false;
        return 0;
      }

      // Separate parents and children
      const parents = transactionsToDelete.filter((t) => !t.pId);
      const children = transactionsToDelete.filter((t) => t.pId);

      // Collect all children IDs that need to be deleted (including those not in the original list)
      const allChildrenToDelete = new Set<string>(children.map((c) => c.id));
      const parentsToRestore = new Map<
        string,
        { parent: Transaction; childrenToDelete: Transaction[]; remainingChildren: Transaction[] }
      >();

      // For each parent being deleted, find all its children
      for (const parent of parents) {
        const parentChildren = transactions.value.filter((t) => t.pId === parent.id);
        parentChildren.forEach((child) => allChildrenToDelete.add(child.id));
      }

      // For children being deleted, check if their parents need restoration
      for (const child of children) {
        if (!child.pId) continue;

        // Skip if parent is also being deleted
        if (parents.some((p) => p.id === child.pId)) continue;

        const parent = transactions.value.find((t) => t.id === child.pId);
        if (!parent) continue;

        if (!parentsToRestore.has(child.pId)) {
          const allChildrenOfParent = transactions.value.filter((t) => t.pId === child.pId);
          const childrenToDelete = allChildrenOfParent.filter((c) => allChildrenToDelete.has(c.id));
          const remainingChildren = allChildrenOfParent.filter((c) => !allChildrenToDelete.has(c.id));

          parentsToRestore.set(child.pId, {
            parent,
            childrenToDelete,
            remainingChildren,
          });
        }
      }

      // Process deletions in batches of 500 (Firestore batch limit)
      const batchSize = FIRESTORE_BATCH_SIZE;
      const balanceUpdates: { accountId: string; inAmount: number; outAmount: number }[] = [];
      const oppositeTransactionsToUpdate = new Set<string>();
      const allTransactionsToDelete = [...transactionsToDelete];

      // Add additional children that weren't in the original list
      for (const childId of allChildrenToDelete) {
        if (!transactionsToDelete.some((t) => t.id === childId)) {
          const child = transactions.value.find((t) => t.id === childId);
          if (child) {
            allTransactionsToDelete.push(child);
          }
        }
      }

      for (let i = 0; i < allTransactionsToDelete.length; i += batchSize) {
        const batchTransactions = allTransactionsToDelete.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const transaction of batchTransactions) {
          // Mark opposite transactions for update
          if (transaction.op) {
            oppositeTransactionsToUpdate.add(transaction.op);
          }

          // Delete the transaction
          const transactionRef = doc(db, 'users', userId, 'transactions', transaction.id);
          batch.delete(transactionRef);

          // Track balance changes ONLY for paid transactions (reverse the transaction)
          if (transaction.s === 'paid') {
            balanceUpdates.push({
              accountId: transaction.a,
              inAmount: -transaction.i,
              outAmount: -transaction.o,
            });
          }
        }

        await batch.commit();
      }

      // Restore parent amounts for parents that aren't being deleted
      if (parentsToRestore.size > 0) {
        const restoreBatch = writeBatch(db);

        for (const [parentId, { parent, childrenToDelete }] of parentsToRestore.entries()) {
          const parentRef = doc(db, 'users', userId, 'transactions', parentId);
          const isIncome = parent.i > 0;

          // Calculate total amount to restore
          const totalToRestore = childrenToDelete.reduce((sum, child) => {
            return sum + (isIncome ? child.i : child.o);
          }, 0);

          const parentUpdate: Partial<FirestoreTransactionData> = {};
          if (isIncome) {
            parentUpdate.i = parent.i + totalToRestore;
          } else {
            parentUpdate.o = parent.o + totalToRestore;
          }

          restoreBatch.update(parentRef, parentUpdate);

          // Update local state for parent
          const parentIndex = transactions.value.findIndex((t) => t.id === parentId);
          if (parentIndex !== -1 && transactions.value[parentIndex]) {
            if (isIncome) {
              transactions.value[parentIndex]!.i += totalToRestore;
            } else {
              transactions.value[parentIndex]!.o += totalToRestore;
            }
          }
        }

        await restoreBatch.commit();
      }

      // Remove opposite transaction links in a separate batch
      // First check which opposite transactions actually exist
      if (oppositeTransactionsToUpdate.size > 0) {
        const oppositeIds = Array.from(oppositeTransactionsToUpdate);
        const existingOppositeIds: string[] = [];

        // Check existence in chunks of 30 (Firestore 'in' query limit)
        const chunkSize = 30;
        for (let i = 0; i < oppositeIds.length; i += chunkSize) {
          const chunk = oppositeIds.slice(i, i + chunkSize);
          const q = query(transactionsRef, where('__name__', 'in', chunk));
          const snapshot = await getDocs(q);
          snapshot.docs.forEach((doc) => existingOppositeIds.push(doc.id));
        }

        // Only update opposite transactions that exist
        if (existingOppositeIds.length > 0) {
          const oppositeBatch = writeBatch(db);
          for (const opId of existingOppositeIds) {
            const oppositeRef = doc(db, 'users', userId, 'transactions', opId);
            oppositeBatch.update(oppositeRef, { op: null });
          }
          await oppositeBatch.commit();
        }
      }

      // Update account balances for all affected accounts (only paid transactions)
      if (balanceUpdates.length > 0) {
        // Group by account and sum the changes
        const accountBalanceMap = new Map<string, { inAmount: number; outAmount: number }>();
        for (const update of balanceUpdates) {
          const existing = accountBalanceMap.get(update.accountId) || { inAmount: 0, outAmount: 0 };
          accountBalanceMap.set(update.accountId, {
            inAmount: existing.inAmount + update.inAmount,
            outAmount: existing.outAmount + update.outAmount,
          });
        }

        // Apply balance updates for paid transactions
        const accountUpdates = Array.from(accountBalanceMap.entries()).map(([accountId, amounts]) => ({
          accountId,
          inAmount: amounts.inAmount,
          outAmount: amounts.outAmount,
        }));

        await updateAccountBalances(userId, accountStore, accountUpdates, 'paid');
      }

      // Remove from local state (all transactions that were deleted)
      const deletedIds = new Set(allTransactionsToDelete.map((t) => t.id));
      transactions.value = transactions.value.filter((t) => !deletedIds.has(t.id));

      loading.value = false;
      return transactionsToDelete.length;
    } catch (error) {
      console.error('Error batch deleting transactions:', error);
      loading.value = false;
      throw error;
    }
  };

  /**
   * Split a transaction into multiple categorized transactions
   * @param userId - User ID
   * @param transactionId - Original transaction ID to split
   * @param splits - Array of split items with category and amount
   * @returns Number of split transactions created
   */
  const splitTransaction = async (
    userId: string,
    transactionId: string,
    splits: Array<{ categoryId: string; amount: number }>,
  ): Promise<number> => {
    if (splits.length === 0) return 0;

    loading.value = true;

    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');

      // Get the original transaction
      const originalTransaction = transactions.value.find((t) => t.id === transactionId);
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      // Calculate total split amount
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);

      // Determine transaction direction (in or out)
      const isIncome = originalTransaction.i > 0;
      const originalAmount = isIncome ? originalTransaction.i : originalTransaction.o;

      // Validate: total splits must be <= (original - 0.01)
      if (totalSplitAmount > originalAmount - 0.01) {
        throw new Error('Split total exceeds maximum allowed amount');
      }

      // Calculate new original amount
      const newOriginalAmount = originalAmount - totalSplitAmount;

      // Prepare batch write
      const batch = writeBatch(db);

      // Update original transaction with scissors emoji prefix and reduced amount
      const originalRef = doc(db, 'users', userId, 'transactions', transactionId);
      const originalDescription = originalTransaction.d.startsWith('✂️ ') ? originalTransaction.d : `✂️ ${originalTransaction.d}`;

      const originalUpdate: Partial<FirestoreTransactionData> = {
        d: originalDescription,
      };

      if (isIncome) {
        originalUpdate.i = newOriginalAmount;
      } else {
        originalUpdate.o = newOriginalAmount;
      }

      batch.update(originalRef, originalUpdate);

      // Create split transactions
      splits.forEach((split) => {
        const splitRef = doc(transactionsRef);
        const splitData: FirestoreTransactionData = {
          d: originalDescription,
          a: originalTransaction.a,
          i: isIncome ? split.amount : 0,
          o: isIncome ? 0 : split.amount,
          at: originalTransaction.at,
          s: originalTransaction.s,
          c: split.categoryId,
          pId: transactionId, // Set parent ID
        };

        batch.set(splitRef, splitData);
      });

      await batch.commit();

      // Update local state
      const index = transactions.value.findIndex((t) => t.id === transactionId);
      if (index !== -1 && transactions.value[index]) {
        transactions.value[index]!.d = originalDescription;
        if (isIncome) {
          transactions.value[index]!.i = newOriginalAmount;
        } else {
          transactions.value[index]!.o = newOriginalAmount;
        }
      }

      // Note: Balance doesn't change because we're just redistributing the same total amount
      // The original transaction amount is reduced and new transactions add up to the same total

      loading.value = false;
      return splits.length;
    } catch (error) {
      console.error('Error splitting transaction:', error);
      loading.value = false;
      throw error;
    }
  };

  return {
    // State
    loading,
    transactions,
    // Actions
    clearTransactions,
    fetchTransactions,
    resetPagination,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    findPotentialOppositeTransactions,
    checkDuplicatesByImportIds,
    importTransactions,
    forceImportTransaction,
    findOppositeTransactionsDuringImport,
    findCategoryByDescription,
    recalculateAccountBalances,
    batchUpdateCategory,
    batchUpdateStatus,
    batchDeleteTransactions,
    splitTransaction,
  };
});
