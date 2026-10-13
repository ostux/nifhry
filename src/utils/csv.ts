/**
 * Parse CSV file content into rows and columns
 * @param content - Raw CSV file content
 * @returns Array of rows, where each row is an array of column values
 */
export function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
    } else {
      currentCell += char;
    }
  }

  // Add last row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse date string in various European formats (DD/MM/YYYY, D/M/YYYY, etc.)
 * @param dateStr - Date string to parse
 * @returns Parsed Date object or null if invalid
 */
export function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY format (European)
  const patterns = [
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, // DD/MM/YYYY or D/M/YYYY
    /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, // YYYY/MM/DD
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match && match[1] && match[2] && match[3]) {
      let day: number, month: number, year: number;

      if (match[1].length === 4) {
        // YYYY/MM/DD format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // DD/MM/YYYY format (European default)
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      // Validate date components
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        continue;
      }

      const date = new Date(year, month - 1, day);

      // Verify the date is valid (handles cases like Feb 30)
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Generate a hash from CSV row data for duplicate detection
 * @param rowData - Object containing the entire CSV row data
 * @returns SHA-1 hash string
 */
export async function generateImportId(rowData: Record<string, string>): Promise<string> {
  // Sort keys to ensure consistent ordering
  const sortedKeys = Object.keys(rowData).sort();
  const sortedData: Record<string, string> = {};
  sortedKeys.forEach((key) => {
    sortedData[key] = rowData[key] || '';
  });

  const message = JSON.stringify(sortedData);
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Parse amount string to number
 * @param amountStr - Amount string (may include commas, currency symbols)
 * @returns Parsed number or 0 if invalid
 */
export function parseAmount(amountStr: string | undefined): number {
  if (!amountStr) return 0;

  // Remove currency symbols, spaces, and convert comma decimals to dots
  const cleaned = amountStr.replace(/[£$€\s]/g, '').replace(/,/g, '');

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Read file as text
 * @param file - File object
 * @returns Promise with file content as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
  });
}
