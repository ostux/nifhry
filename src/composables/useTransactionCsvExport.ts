import type { Transaction } from '@/types';
import moment from 'moment';

export interface TransactionCsvExportOptions {
  transactions: Transaction[];
  getAccountName: (accountId: string) => string;
  getCategoryName: (categoryId: string) => string;
  filename?: string;
}

/**
 * Composable for exporting transactions to CSV format
 */
export function useTransactionCsvExport() {
  /**
   * Escape CSV field value (handle quotes and commas)
   */
  const escapeCsvField = (value: string | number): string => {
    const strValue = String(value);
    // If the value contains comma, quote, or newline, wrap it in quotes and escape existing quotes
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  };

  /**
   * Convert transactions to CSV format
   */
  const convertToCSV = (options: TransactionCsvExportOptions): string => {
    const { transactions, getAccountName, getCategoryName } = options;

    // CSV headers
    const headers = ['Date', 'Description', 'Account', 'Category', 'Income', 'Expense', 'Status'];
    const csvRows: string[] = [headers.join(',')];

    // Convert each transaction to a CSV row
    for (const transaction of transactions) {
      const row = [
        escapeCsvField(moment(transaction.at).format('DD/MM/YYYY')),
        escapeCsvField(transaction.d),
        escapeCsvField(getAccountName(transaction.a)),
        escapeCsvField(transaction.c ? getCategoryName(transaction.c) : ''),
        escapeCsvField(transaction.i || 0),
        escapeCsvField(transaction.o || 0),
        escapeCsvField(transaction.s),
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  };

  /**
   * Download transactions as CSV file
   */
  const downloadCSV = (options: TransactionCsvExportOptions): void => {
    const { filename = 'transactions.csv' } = options;

    // Convert to CSV
    const csvContent = convertToCSV(options);

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);
  };

  return {
    downloadCSV,
    convertToCSV,
  };
}
