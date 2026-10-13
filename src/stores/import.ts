import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { parseCSV, parseDate, generateImportId, parseAmount, readFileAsText } from '@/utils/csv';
import type { Category } from '@/types';

export interface ParsedTransaction {
  date: Date;
  description: string;
  category?: string;
  categoryId?: string;
  autoSuggestedCategory?: string;
  inAmount: number;
  outAmount: number;
  importId: string;
  rawRow: Record<string, string>;
}

export type ImportStep = 1 | 2 | 3 | 4;

export const useImportStore = defineStore('import', () => {
  // State
  const currentStep = ref<ImportStep>(1);
  const headers = ref<string[]>([]);
  const previewData = ref<Record<string, string>[]>([]);
  const rawData = ref<string[][]>([]);
  const amountMode = ref<'split' | 'single'>('split');
  const reverseAmount = ref<boolean>(true); // Default to true for debit cards

  const mapping = ref({
    date: '',
    description: '',
    category: '',
    debit: '',
    credit: '',
    amount: '',
  });

  const parsedTransactions = ref<ParsedTransaction[]>([]);
  const parseErrors = ref<number>(0);

  const importing = ref(false);
  const importResults = ref({
    imported: 0,
    duplicates: [] as string[],
    linkedOpposites: 0,
  });
  const duplicateTransactions = ref<ParsedTransaction[]>([]);
  const forceImporting = ref<string | null>(null);

  // Computed
  const isMappingValid = computed(() => {
    if (!mapping.value.date || !mapping.value.description) return false;

    if (amountMode.value === 'split') {
      return !!mapping.value.debit && !!mapping.value.credit;
    } else {
      return !!mapping.value.amount;
    }
  });

  // Actions
  const autoDetectMapping = (): void => {
    const headerLower = headers.value.map((h) => h.toLowerCase().trim());

    // Known column mappings from various bank formats
    const datePatterns = ['transaction date', 'date', 'transaction cleared date'];
    const descriptionPatterns = ['transaction description', 'description', 'name'];
    const categoryPatterns = ['category'];
    const debitPatterns = ['debit amount', 'debit', 'money out'];
    const creditPatterns = ['credit amount', 'credit', 'money in'];
    const amountPatterns = ['transaction amount', 'amount'];

    // Helper function to find matching header
    const findMatch = (patterns: string[]): string => {
      for (const pattern of patterns) {
        const index = headerLower.indexOf(pattern);
        if (index !== -1) {
          return headers.value[index] || '';
        }
      }
      return '';
    };

    // Map date
    mapping.value.date = findMatch(datePatterns);

    // Map description
    mapping.value.description = findMatch(descriptionPatterns);

    // Map category (optional)
    mapping.value.category = findMatch(categoryPatterns);

    // Check if we have debit/credit columns or single amount column
    const hasDebit = findMatch(debitPatterns);
    const hasCredit = findMatch(creditPatterns);
    const hasAmount = findMatch(amountPatterns);

    if (hasDebit && hasCredit) {
      // Split mode: has separate debit and credit columns
      amountMode.value = 'split';
      mapping.value.debit = hasDebit;
      mapping.value.credit = hasCredit;
      mapping.value.amount = '';
      reverseAmount.value = true;
    } else if (hasAmount) {
      // Single amount mode
      amountMode.value = 'single';
      mapping.value.amount = hasAmount;
      mapping.value.debit = '';
      mapping.value.credit = '';

      // For credit card files (typically have negative amounts for payments)
      // Check if the first few non-empty amounts are mixed signs
      let hasNegative = false;
      let hasPositive = false;

      for (let i = 0; i < Math.min(5, rawData.value.length); i++) {
        const row = rawData.value[i];
        if (!row) continue;
        const amountIndex = headers.value.indexOf(hasAmount);
        if (amountIndex !== -1) {
          const amountStr = row[amountIndex];
          const amount = parseAmount(amountStr);
          if (amount < 0) hasNegative = true;
          if (amount > 0) hasPositive = true;
        }
      }

      // If we have both positive and negative, it's likely a credit card format
      // where negative = payment (money in), positive = charge (money out)
      reverseAmount.value = hasNegative && hasPositive;
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    const content = await readFileAsText(file);
    const rows = parseCSV(content);

    if (rows.length < 2) {
      throw new Error('CSV file is too small');
    }

    headers.value = rows[0] || [];
    rawData.value = rows.slice(1);

    // Create preview data (first 5 rows)
    previewData.value = rawData.value.slice(0, 3).map((row) => {
      const obj: Record<string, string> = {};
      headers.value.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Auto-detect column mappings
    autoDetectMapping();

    currentStep.value = 2;
  };

  const setMapping = (field: keyof typeof mapping.value, value: string): void => {
    mapping.value[field] = value;
  };

  const setAmountMode = (mode: 'split' | 'single'): void => {
    amountMode.value = mode;
  };

  const toggleReverseAmount = (): void => {
    reverseAmount.value = !reverseAmount.value;
  };

  const previewImport = async (
    userId: string,
    categories: Category[],
    findCategoryByDescription: (userId: string, description: string) => Promise<string | undefined>,
    createCategory: (userId: string, categoryData: { name: string; desc: string }) => Promise<void>,
    getCategoriesFresh: () => Category[],
  ): Promise<void> => {
    const transactions: ParsedTransaction[] = [];
    let errors = 0;

    for (const row of rawData.value) {
      try {
        const rowObj: Record<string, string> = {};
        headers.value.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });

        // Parse date
        const dateStr = rowObj[mapping.value.date];
        const date = parseDate(dateStr);
        if (!date) {
          errors++;
          continue;
        }

        // Parse description
        const description = rowObj[mapping.value.description]?.trim();
        if (!description) {
          errors++;
          continue;
        }

        // Parse amounts
        let inAmount = 0;
        let outAmount = 0;

        if (amountMode.value === 'split') {
          const creditStr = rowObj[mapping.value.credit];
          const debitStr = rowObj[mapping.value.debit];
          inAmount = Math.abs(parseAmount(creditStr));
          outAmount = Math.abs(parseAmount(debitStr));
        } else {
          const amountStr = rowObj[mapping.value.amount];
          const amount = parseAmount(amountStr);

          if (reverseAmount.value) {
            if (amount < 0) {
              inAmount = Math.abs(amount);
            } else {
              outAmount = amount;
            }
          } else {
            if (amount >= 0) {
              inAmount = amount;
            } else {
              outAmount = Math.abs(amount);
            }
          }
        }

        // Parse category (optional)
        let category: string | undefined = undefined;
        if (mapping.value.category) {
          const categoryName = rowObj[mapping.value.category]?.trim();
          if (categoryName) {
            category = categoryName;
          }
        }

        // Generate import ID
        const importId = await generateImportId(rowObj);

        transactions.push({
          date,
          description,
          category,
          inAmount,
          outAmount,
          importId,
          rawRow: rowObj,
        });
      } catch (error) {
        console.error('Error parsing row:', error);
        errors++;
      }
    }

    parsedTransactions.value = transactions;
    parseErrors.value = errors;

    // Create categories from CSV if they don't exist
    const categoryMap = new Map<string, string>();

    // First, collect all unique category names from CSV
    const uniqueCategoryNames = new Set<string>();
    for (const transaction of parsedTransactions.value) {
      if (transaction.category) {
        uniqueCategoryNames.add(transaction.category.toLowerCase());
      }
    }

    // Create all missing categories
    for (const lowerCaseName of uniqueCategoryNames) {
      const existingCategory = categories.find((c) => c.name.toLowerCase() === lowerCaseName);

      if (existingCategory) {
        categoryMap.set(lowerCaseName, existingCategory.id);
      } else {
        // Find the original case-sensitive name
        const originalName = parsedTransactions.value.find(
          (t) => t.category?.toLowerCase() === lowerCaseName,
        )?.category;

        if (originalName) {
          try {
            await createCategory(userId, {
              name: originalName,
              desc: `Imported from CSV`,
            });

            // Wait a bit for the onSnapshot listener to update
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Get fresh categories after creation
            const freshCategories = getCategoriesFresh();
            const newCategory = freshCategories.find((c) => c.name.toLowerCase() === lowerCaseName);
            if (newCategory) {
              categoryMap.set(lowerCaseName, newCategory.id);
            }
          } catch (error) {
            // If category already exists (race condition or duplicate), try to find it again
            if (error instanceof Error && error.message === 'DUPLICATE_CATEGORY_NAME') {
              const freshCategories = getCategoriesFresh();
              const existingCat = freshCategories.find((c) => c.name.toLowerCase() === lowerCaseName);
              if (existingCat) {
                categoryMap.set(lowerCaseName, existingCat.id);
              }
            } else {
              console.error('Error creating category:', error);
            }
          }
        }
      }
    }

    // Apply categories and auto-categorization
    for (const transaction of parsedTransactions.value) {
      if (transaction.category) {
        const categoryId = categoryMap.get(transaction.category.toLowerCase());
        if (categoryId) {
          transaction.categoryId = categoryId;
        }
      } else {
        // Apply auto-categorization for transactions without categories
        const suggestedCategoryId = await findCategoryByDescription(userId, transaction.description);
        if (suggestedCategoryId) {
          transaction.autoSuggestedCategory = suggestedCategoryId;
          transaction.categoryId = suggestedCategoryId;
        }
      }
    }

    currentStep.value = 3;
  };

  const startImport = async (
    userId: string,
    accountId: string,
    importTransactionsAction: (
      userId: string,
      accountId: string,
      transactions: Array<{
        description: string;
        category?: string;
        inAmount: number;
        outAmount: number;
        date: Date;
        importId: string;
      }>,
    ) => Promise<{ imported: number; duplicates: string[]; linkedOpposites: number }>,
  ): Promise<void> => {
    importing.value = true;

    try {
      const transactionsToImport = parsedTransactions.value.map((t) => ({
        description: t.description,
        category: t.categoryId,
        inAmount: t.inAmount,
        outAmount: t.outAmount,
        date: t.date,
        importId: t.importId,
      }));

      const results = await importTransactionsAction(userId, accountId, transactionsToImport);

      importResults.value = results;

      // Find duplicate transactions for display
      const duplicateIdsSet = new Set(results.duplicates);
      duplicateTransactions.value = parsedTransactions.value.filter((t) => duplicateIdsSet.has(t.importId));

      currentStep.value = 4;
    } finally {
      importing.value = false;
    }
  };

  const forceImportTransaction = async (
    userId: string,
    accountId: string,
    transaction: ParsedTransaction,
    categories: Category[],
    forceImportAction: (
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
    ) => Promise<void>,
  ): Promise<void> => {
    forceImporting.value = transaction.importId;

    try {
      let categoryId: string | undefined = undefined;
      if (transaction.category) {
        const existingCategory = categories.find((c) => c.name.toLowerCase() === transaction.category!.toLowerCase());
        if (existingCategory) {
          categoryId = existingCategory.id;
        }
      }

      await forceImportAction(userId, accountId, {
        description: transaction.description,
        category: categoryId,
        inAmount: transaction.inAmount,
        outAmount: transaction.outAmount,
        date: transaction.date,
        importId: transaction.importId,
      });

      // Remove from duplicates list
      duplicateTransactions.value = duplicateTransactions.value.filter((t) => t.importId !== transaction.importId);

      // Update imported count
      importResults.value.imported++;
    } finally {
      forceImporting.value = null;
    }
  };

  const resetImport = (): void => {
    currentStep.value = 1;
    headers.value = [];
    previewData.value = [];
    rawData.value = [];
    amountMode.value = 'split';
    reverseAmount.value = true;
    mapping.value = {
      date: '',
      description: '',
      category: '',
      debit: '',
      credit: '',
      amount: '',
    };
    parsedTransactions.value = [];
    parseErrors.value = 0;
    importResults.value = { imported: 0, duplicates: [], linkedOpposites: 0 };
    duplicateTransactions.value = [];
    forceImporting.value = null;
  };

  const goToStep = (step: ImportStep): void => {
    currentStep.value = step;
  };

  return {
    // State
    currentStep,
    headers,
    previewData,
    rawData,
    amountMode,
    reverseAmount,
    mapping,
    parsedTransactions,
    parseErrors,
    importing,
    importResults,
    duplicateTransactions,
    forceImporting,
    // Computed
    isMappingValid,
    // Actions
    uploadFile,
    setMapping,
    setAmountMode,
    toggleReverseAmount,
    previewImport,
    startImport,
    forceImportTransaction,
    resetImport,
    goToStep,
  };
});
