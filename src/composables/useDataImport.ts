import { db } from '@/config/firebase';
import type { Account, BudgetDoc, Category, Transaction } from '@/types';
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import moment from 'moment';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { FIRESTORE_BATCH_SIZE } from '@/constants/transactions';

export type ExportRange = 'all' | 'this-year' | 'this-and-last-month';

interface BudgetExport {
  period: string;
  data: BudgetDoc;
}

interface ExportDateRange {
  from: string;
  to: string;
}

interface ImportData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets?: BudgetExport[];
  exportType?: 'full' | 'partial';
  dateRange?: ExportDateRange;
}

interface ImportProgress {
  step: string;
  current: number;
  total: number;
  percentage: number;
}

export function useDataImport() {
  const { t } = useI18n();
  const importing = ref(false);
  const exporting = ref(false);
  const progress = ref<ImportProgress>({
    step: '',
    current: 0,
    total: 0,
    percentage: 0,
  });

  const updateProgress = (step: string, current: number, total: number) => {
    progress.value = {
      step,
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  };

  const deleteCollectionInBatches = async (
    userId: string,
    collectionName: string,
    batchSize: number = FIRESTORE_BATCH_SIZE,
  ): Promise<void> => {
    const collectionRef = collection(db, 'users', userId, collectionName);
    const snapshot = await getDocs(collectionRef);
    const totalDocs = snapshot.size;

    if (totalDocs === 0) {
      updateProgress(`Clearing ${collectionName}`, 0, 0);
      return;
    }

    updateProgress(`Clearing ${collectionName}`, 0, totalDocs);

    let batch = writeBatch(db);
    let count = 0;
    let totalDeleted = 0;

    for (const document of snapshot.docs) {
      batch.delete(document.ref);
      count++;
      totalDeleted++;

      // Commit batch when it reaches the batch size
      if (count >= batchSize) {
        await batch.commit();
        updateProgress(`Clearing ${collectionName}`, totalDeleted, totalDocs);
        batch = writeBatch(db);
        count = 0;
      }
    }

    // Commit any remaining deletes
    if (count > 0) {
      await batch.commit();
      updateProgress(`Clearing ${collectionName}`, totalDeleted, totalDocs);
    }
  };

  const clearAllData = async (userId: string): Promise<void> => {
    // Delete all collections using batched deletes
    await deleteCollectionInBatches(userId, 'accounts');
    await deleteCollectionInBatches(userId, 'categories');
    await deleteCollectionInBatches(userId, 'transactions');
    await deleteCollectionInBatches(userId, 'budgets');
  };

  const importInBatches = async <T extends { id: string }>(
    collectionName: string,
    items: T[],
    userId: string,
    batchSize: number = FIRESTORE_BATCH_SIZE,
  ): Promise<void> => {
    updateProgress(`Importing ${collectionName}`, 0, items.length);

    let batch = writeBatch(db);
    let count = 0;
    let totalImported = 0;

    for (const item of items) {
      const docRef = doc(collection(db, 'users', userId, collectionName), item.id);

      // Convert Date objects to Firestore Timestamps
      const dataToWrite: Record<string, unknown> = { ...item };

      // Handle different date fields based on collection
      if (collectionName === 'accounts') {
        dataToWrite.bAsOf = Timestamp.fromDate(new Date(dataToWrite.bAsOf as string | number | Date));
        dataToWrite.cAt = Timestamp.fromDate(new Date(dataToWrite.cAt as string | number | Date));
        dataToWrite.uAt = Timestamp.fromDate(new Date(dataToWrite.uAt as string | number | Date));
      } else if (collectionName === 'transactions') {
        dataToWrite.at = Timestamp.fromDate(new Date(dataToWrite.at as string | number | Date));
      }

      batch.set(docRef, dataToWrite);
      count++;
      totalImported++;

      // Commit batch when it reaches the batch size
      if (count >= batchSize) {
        await batch.commit();
        updateProgress(`Importing ${collectionName}`, totalImported, items.length);
        batch = writeBatch(db);
        count = 0;
      }
    }

    // Commit any remaining items
    if (count > 0) {
      await batch.commit();
      updateProgress(`Importing ${collectionName}`, totalImported, items.length);
    }
  };

  const importBudgets = async (
    budgets: BudgetExport[],
    userId: string,
    batchSize: number = FIRESTORE_BATCH_SIZE,
  ): Promise<void> => {
    if (!budgets || budgets.length === 0) {
      return;
    }

    updateProgress('Importing budgets', 0, budgets.length);

    let batch = writeBatch(db);
    let count = 0;
    let totalImported = 0;

    for (const budget of budgets) {
      const docRef = doc(db, 'users', userId, 'budgets', budget.period);
      batch.set(docRef, budget.data);
      count++;
      totalImported++;

      // Commit batch when it reaches the batch size
      if (count >= batchSize) {
        await batch.commit();
        updateProgress('Importing budgets', totalImported, budgets.length);
        batch = writeBatch(db);
        count = 0;
      }
    }

    // Commit any remaining items
    if (count > 0) {
      await batch.commit();
      updateProgress('Importing budgets', totalImported, budgets.length);
    }
  };

  const parseJsonFile = (file: File): Promise<ImportData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ImportData;

          // Validate data structure
          if (!data.accounts || !data.categories || !data.transactions) {
            reject(new Error(t('importExport.import.validation.missingFields')));
            return;
          }

          if (!Array.isArray(data.accounts) || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
            reject(new Error(t('importExport.import.validation.invalidArrays')));
            return;
          }

          // Budgets are optional for backward compatibility
          if (data.budgets && !Array.isArray(data.budgets)) {
            reject(new Error(t('importExport.import.validation.invalidArrays')));
            return;
          }

          resolve(data);
        } catch {
          reject(new Error(t('importExport.import.validation.parseError')));
        }
      };

      reader.onerror = () => {
        reject(new Error(t('importExport.import.validation.readError')));
      };

      reader.readAsText(file);
    });
  };

  const importTransactionsPartial = async (
    transactions: Transaction[],
    dateRange: ExportDateRange,
    userId: string,
    batchSize: number = FIRESTORE_BATCH_SIZE,
  ): Promise<void> => {
    updateProgress('Importing transactions', 0, transactions.length);

    // Fetch existing transaction IDs in the date range to avoid duplicates
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(
      transactionsRef,
      where('at', '>=', Timestamp.fromDate(new Date(dateRange.from))),
      where('at', '<=', Timestamp.fromDate(new Date(dateRange.to))),
    );
    const existingSnapshot = await getDocs(q);
    const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));

    const newTransactions = transactions.filter((t) => !existingIds.has(t.id));

    if (newTransactions.length === 0) {
      updateProgress('Importing transactions', 0, 0);
      return;
    }

    let batch = writeBatch(db);
    let count = 0;
    let totalImported = 0;

    for (const item of newTransactions) {
      const docRef = doc(collection(db, 'users', userId, 'transactions'), item.id);
      const dataToWrite: Record<string, unknown> = { ...item };
      dataToWrite.at = Timestamp.fromDate(new Date(dataToWrite.at as string | number | Date));
      batch.set(docRef, dataToWrite);
      count++;
      totalImported++;

      if (count >= batchSize) {
        await batch.commit();
        updateProgress('Importing transactions', totalImported, newTransactions.length);
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      updateProgress('Importing transactions', totalImported, newTransactions.length);
    }
  };

  const importData = async (file: File, userId: string): Promise<void> => {
    importing.value = true;

    try {
      // Step 1: Parse file
      updateProgress('Parsing file', 0, 1);
      const data = await parseJsonFile(file);
      updateProgress('Parsing file', 1, 1);

      if (data.exportType === 'partial' && data.dateRange) {
        // Partial import: do not clear data, only add missing transactions
        await importInBatches('categories', data.categories, userId);
        await importInBatches('accounts', data.accounts, userId);
        await importTransactionsPartial(data.transactions, data.dateRange, userId);
        if (data.budgets && data.budgets.length > 0) {
          await importBudgets(data.budgets, userId);
        }
      } else {
        // Full import: clear all data first
        await clearAllData(userId);
        await importInBatches('categories', data.categories, userId);
        await importInBatches('accounts', data.accounts, userId);
        await importInBatches('transactions', data.transactions, userId);
        if (data.budgets && data.budgets.length > 0) {
          await importBudgets(data.budgets, userId);
        }
      }

      updateProgress('Import complete', 1, 1);
    } catch (error) {
      throw error;
    } finally {
      importing.value = false;
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.name.endsWith('.json')) {
      return { valid: false, error: t('importExport.import.validation.fileTypeError') };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: t('importExport.import.validation.fileSizeError') };
    }

    return { valid: true };
  };

  const exportData = async (userId: string, exportRange: ExportRange = 'all'): Promise<void> => {
    exporting.value = true;

    try {
      updateProgress('Exporting data', 0, 4);

      // Fetch all accounts
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const accountsSnapshot = await getDocs(accountsRef);
      const accounts = accountsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          bAsOf: data.bAsOf?.toDate().toISOString(),
          cAt: data.cAt?.toDate().toISOString(),
          uAt: data.uAt?.toDate().toISOString(),
        } as Account;
      });
      updateProgress('Exporting data', 1, 4);

      // Fetch all categories
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categories = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      updateProgress('Exporting data', 2, 4);

      // Determine date range for transactions
      let dateRange: ExportDateRange | undefined;
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      let transactionsQuery;

      if (exportRange === 'this-year') {
        const from = moment().startOf('year').toDate();
        const to = moment().endOf('day').toDate();
        dateRange = { from: from.toISOString(), to: to.toISOString() };
        transactionsQuery = query(transactionsRef, where('at', '>=', Timestamp.fromDate(from)), where('at', '<=', Timestamp.fromDate(to)));
      } else if (exportRange === 'this-and-last-month') {
        const from = moment().subtract(1, 'month').startOf('month').toDate();
        const to = moment().endOf('day').toDate();
        dateRange = { from: from.toISOString(), to: to.toISOString() };
        transactionsQuery = query(transactionsRef, where('at', '>=', Timestamp.fromDate(from)), where('at', '<=', Timestamp.fromDate(to)));
      } else {
        transactionsQuery = query(transactionsRef);
      }

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          at: data.at?.toDate().toISOString(),
        } as Transaction;
      });
      updateProgress('Exporting data', 3, 4);

      // Fetch all budgets
      const budgetsRef = collection(db, 'users', userId, 'budgets');
      const budgetsSnapshot = await getDocs(budgetsRef);
      const budgets: BudgetExport[] = budgetsSnapshot.docs.map((doc) => ({
        period: doc.id,
        data: doc.data() as BudgetDoc,
      }));
      updateProgress('Exporting data', 4, 4);

      const isPartial = exportRange !== 'all';
      const exportDataObj: ImportData = {
        accounts,
        categories,
        transactions,
        budgets,
        exportType: isPartial ? 'partial' : 'full',
        ...(isPartial && dateRange ? { dateRange } : {}),
      };

      // Build descriptive filename
      const today = moment().format('YYYY-MM-DD');
      let filename: string;
      if (exportRange === 'this-year') {
        filename = `nifhry-partial-${moment().year()}-${today}.json`;
      } else if (exportRange === 'this-and-last-month') {
        filename = `nifhry-partial-2m-${today}.json`;
      } else {
        filename = `nifhry-backup-${today}.json`;
      }

      const dataStr = JSON.stringify(exportDataObj, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    } finally {
      exporting.value = false;
    }
  };

  const detectExportType = (file: File): Promise<'full' | 'partial' | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data.exportType === 'partial' ? 'partial' : 'full');
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  };

  return {
    importing,
    exporting,
    progress,
    importData,
    exportData,
    validateFile,
    detectExportType,
  };
}
