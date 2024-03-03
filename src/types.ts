import { z } from 'zod';

export const nullUUID = '00000000-0000-0000-0000-000000000000';

export interface Z_FormError {
  [index: string]: string[];
}

export interface Z_SelectItemObject {
  id: string;
  name: string;
  disabled?: boolean;
}

export const z_year = z.coerce.number().min(1900).max(3000);
export type Z_Year = z.infer<typeof z_year>;

export const z_month = z.coerce.number().min(0).max(11);
export type Z_Month = z.infer<typeof z_month>;

export const z_day = z.coerce.number().min(1).max(31);
export type Z_Day = z.infer<typeof z_day>;

export const z_pagination = z.object({
  page: z.number().nonnegative(),
  perPage: z.number().nonnegative(),
  totalCount: z.number().nonnegative()
});
export type Z_Pagination = z.infer<typeof z_pagination>;

export const z_sortDirection = z.nativeEnum({
  asc: 'asc',
  desc: 'desc'
});
export type Z_SortDirection = z.infer<typeof z_sortDirection>;

export const z_sort = z.object({
  column: z.string(),
  direction: z_sortDirection
});
export type Z_Sort = z.infer<typeof z_sort>;

export const z_filterBy = z.nativeEnum({
  eq: 'eq',
  neq: 'neq',
  lt: 'lt',
  gt: 'lg',
  in: 'in',
  nin: 'nin'
});
export type Z_FilterBy = z.infer<typeof z_filterBy>;

export const z_filter = z.object({
  column: z.string().min(1),
  by: z_filterBy,
  value: z.any()
});
export type Z_Filter = z.infer<typeof z_filter>;

export const z_dayFilter = z.object({
  year: z_year,
  month: z_month.optional(),
  day: z_day.optional()
});
export type Z_DayFilter = z.infer<typeof z_dayFilter>;

export const z_apiResponse = z.object({
  data: z.any(),
  success: z.boolean(),
  errors: z.string().array()
});
export type Z_ApiResponse = z.infer<typeof z_apiResponse>;

export const z_acctountType = z.nativeEnum({
  Debit: 'debit',
  Credit: 'credit',
  Saving: 'saving',
  Loan: 'loan'
});
export type Z_AccountType = z.infer<typeof z_acctountType>;

export const z_account = z.object({
  id: z.string().uuid(),
  name: z.coerce.string().min(1),
  balance: z.coerce.number(),
  aType: z_acctountType
});
export type Z_Account = z.infer<typeof z_account>;

export const z_accounts = z.map(z.string(), z_account);
export type Z_Accounts = z.infer<typeof z_accounts>;

export const z_category = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  description: z.string(),
  parent: z.string().uuid().nullable(),
  used: z.number().nonnegative()
});
export type Z_Category = z.infer<typeof z_category>;

export const z_categories = z.map(z.string(), z_category);
export type Z_Categories = z.infer<typeof z_categories>;

export const z_transactionStatus = z.nativeEnum({
  Paid: 'paid',
  Pending: 'pending'
});
export type Z_TransactionStatus = z.infer<typeof z_transactionStatus>;

export const z_transaction = z.object({
  id: z.string().uuid(),
  desc: z.string().min(1),
  category: z.string().nullable(),
  account: z.string().min(1),
  amount: z.coerce.number(),
  when: z.coerce.date(),
  status: z_transactionStatus,
  sId: z.string().uuid().nullable(),
  created: z.coerce.date()
});
export type Z_Transaction = z.infer<typeof z_transaction>;

export const z_transactions = z_transaction.array();
export type Z_Transactions = z.infer<typeof z_transactions>;

export const z_frequency = z.nativeEnum({
  Yearly: 'yearly',
  Monthly: 'monthly',
  Weekly: 'weekly',
  Daily: 'daily'
});
export type Z_Frequency = z.infer<typeof z_schedulable>;

export const z_schedulable = z.object({
  start: z.date(),
  repeatAt: z.number(),
  frequency: z_frequency
});
export type Z_Schedulable = z.infer<typeof z_schedulable>;
