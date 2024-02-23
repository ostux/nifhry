import { z } from 'zod';

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
  startingBalance: z.coerce.number(),
  createdAt: z.coerce.date(),
  aType: z_acctountType
});
export type Z_Account = z.infer<typeof z_account>;

export const z_accounts = z_account.array();
export type Z_Accounts = z.infer<typeof z_accounts>;

export const z_category = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  parent: z.string().uuid().nullable()
});
export type Z_Category = z.infer<typeof z_category>;

export const z_categories = z_category.array();
export type Z_Categories = z.infer<typeof z_categories>;

export const z_budget = z.object({
  id: z.string().uuid(),
  category: z.string().uuid(),
  account: z.string().uuid(),
  when: z.string(), // format("YYYY-MM")
  amount: z.number()
});
export type Z_Budget = z.infer<typeof z_budget>;

export const z_budgets = z_budget.array();
export type Z_Budgets = z.infer<typeof z_budgets>;

export const z_transactionStatus = z.nativeEnum({
  Paid: 'paid',
  Pending: 'pending'
});
export type Z_TransactionStatus = z.infer<typeof z_transactionStatus>;

export const z_transaction = z.object({
  id: z.string().uuid(),
  desc: z.string(),
  amount: z.coerce.number(),
  category: z.string().uuid(),
  from: z.string().uuid().nullable(),
  to: z.string().uuid().nullable(),
  when: z.coerce.date(),
  status: z_transactionStatus,
  sId: z.string().uuid().nullable()
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
