export enum Kind {
  debit = 'debit',
  credit = 'credit',
  loan = 'loan',
  lending = 'lending',
  saving = 'saving',
  investment = 'investment',
}

export enum Status {
  active = 'active',
  closed = 'closed',
  archived = 'archived',
}

export type AccountKind = 'debit' | 'credit' | 'loan' | 'lending' | 'saving' | 'investment';
export type AccountStatus = 'active' | 'closed' | 'archived';

export interface Account {
  id: string;
  name: string;
  bal: number; // balance
  bAsOf: Date; // balance as of timestamp
  kind: AccountKind;
  status: AccountStatus;
  order: number;
  cAt: Date; // createdAt
  uAt: Date; // updatedAt
  cur?: string; // currency code (optional for backward compatibility)
}

export interface Category {
  id: string;
  name: string;
  desc: string; // description
}

export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  d: string; // description
  c?: string; // category (optional)
  a: string; // account id
  i: number; // in (income/credit)
  o: number; // out (expense/debit)
  op?: string; // opposite transaction id (optional)
  at: Date; // createdAt
  s: TransactionStatus; // status
  iId?: string; // import md5 hash to eliminate double import (optional)
  pId?: string; // parent transaction id for split transactions (optional)
  cur?: string; // currency code (optional, inherits from account)
}

export interface TransactionFilters {
  status?: TransactionStatus | null;
  accountIds?: string[];
  categoryIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  description?: string;
}

// Firestore document data types (using abbreviated field names)
export interface FirestoreTransactionData {
  d: string; // description
  a: string; // account id
  i: number; // in amount
  o: number; // out amount
  at: Date; // date
  s: TransactionStatus; // status
  c?: string; // category (optional)
  op?: string; // opposite transaction id (optional)
  iId?: string; // import id (optional)
  pId?: string; // parent transaction id for split transactions (optional)
  cur?: string; // currency code (optional)
}

export interface FirestoreTransactionUpdate {
  d?: string;
  c?: string;
  a?: string;
  i?: number;
  o?: number;
  at?: Date;
  s?: TransactionStatus;
  op?: string | null;
  cur?: string;
}

export type BudgetType = 'expense' | 'income';

// Budget item for itemization
export interface BudgetItem {
  name: string; // Item name (e.g., "Netflix", "Groceries")
  amount: number; // Item amount (e.g., 12.99)
  type?: 'user' | 'correction'; // Item type: 'user' (manual) or 'correction' (auto-generated from inline edits)
}

// Client-side category budget (full field names)
export interface CategoryBudget {
  amount: number; // Auto-calculated from items or 0 if items empty
  type: BudgetType;
  items: BudgetItem[]; // Always present (empty array if no items)
}

// Firestore storage format (abbreviated field names)
export interface FirestoreCategoryBudget {
  a: number; // amount
  k: BudgetType; // kind/type
  i?: Array<{ n: string; a: number; t?: 'user' | 'correction' }>; // items (optional: n=name, a=amount, t=type)
}

// Firestore document: users/{userId}/budgets/{YYYY-MM}
export interface FirestoreBudgetDoc {
  [categoryId: string]: FirestoreCategoryBudget;
}

// Client-side budget document (full field names)
export interface BudgetDoc {
  [categoryId: string]: CategoryBudget;
}

// Client-side budget with calculations
export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  budgeted: number;
  actual: number;
  remaining: number;
  percentage: number;
  type: BudgetType;
}

// User settings
export interface UserSettings {
  defaultCurrency: string;
  mainCurrency?: string; // Optional for backward compatibility
  secondaryCurrency: string;
  showSecondaryCurrency: boolean;
  exchangeRate: number;
  liabilityPaymentCategories: string[]; // Category IDs that represent liability payments
  investmentValueChangeCategories: string[]; // Category IDs that represent investment market value changes
}

// Firestore settings document: users/{userId}/settings
export interface FirestoreUserSettings {
  defaultCurrency: string;
  secondaryCurrency: string;
  showSecondaryCurrency: boolean;
  exchangeRate: number;
  liabilityPaymentCategories?: string[]; // Optional for backwards compatibility
  investmentValueChangeCategories?: string[]; // Optional for backwards compatibility
  mainCurrency?: string; // Optional for backwards compatibility (new field)
}

// User currency configuration (client-side)
export interface UserCurrency {
  code: string;
  name: string;
  rate: number; // exchange rate to main currency
  addedAt: Date;
}

// User currencies collection (client-side)
export interface UserCurrencies {
  [code: string]: UserCurrency;
}

// Firestore currencies document: users/{userId}/settings/currencies
export interface FirestoreUserCurrencies {
  [code: string]: {
    n: string; // name
    r: number; // rate
    aAt: Date; // addedAt
  };
}
