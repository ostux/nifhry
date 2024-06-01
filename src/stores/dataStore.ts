import { useCapitalize } from '@/composables/useCapitalize';
import { usePagination } from '@/composables/usePagination';
import {
  nullUUID,
  z_account,
  z_category,
  z_day,
  z_filterBy,
  z_month,
  z_transaction,
  z_transactionStatus,
  z_year,
  type Z_Account,
  type Z_Accounts,
  type Z_ApiResponse,
  type Z_Categories,
  type Z_Category,
  type Z_Day,
  type Z_Filter,
  type Z_Month,
  type Z_SelectItemObject,
  type Z_Sort,
  type Z_Transaction,
  type Z_Transactions,
  type Z_Year
} from '@/types';
import moment from 'moment';
import { acceptHMRUpdate, defineStore, type StateTree } from 'pinia';
import { computed, ref, type Ref } from 'vue';
import { z } from 'zod';

const pagination = usePagination();
const capit = useCapitalize();
const { capitalize } = capit;

const parse = (value: string) => {
  const data = JSON.parse(value);

  const accounts = new Map();
  const categories = new Map();

  data.accounts.forEach((a: Z_Account) => accounts.set(a.id, a));
  data.categories.forEach((a: Z_Account) => categories.set(a.id, a));

  return { accounts, categories, transactions: data.transactions };
};

const stringify = (value: StateTree) => {
  const data = {
    accounts: Array.from(value.accounts.values()),
    categories: Array.from(value.categories.values()),
    transactions: value.transactions
  };

  return JSON.stringify(data);
};

export const useDataStore = defineStore(
  'dataStore',
  () => {
    const accounts: Ref<Z_Accounts> = ref(new Map());
    const categories: Ref<Z_Categories> = ref(new Map());
    const transactions: Ref<Z_Transactions> = ref([]);

    const paginatedTransactions: Ref<Z_Transactions> = ref([]);

    const getAccounts = computed(() => {
      return Array.from(accounts.value.values());
    });

    const accountSelectList = computed(() => {
      const selectList: Z_SelectItemObject[] = [];

      accounts.value.forEach((value, key) => {
        selectList.push({
          id: key,
          name: value.name
        });
      });

      selectList.push({ id: nullUUID, name: '-' });

      return selectList;
    });

    const categorySelectList = computed((): Z_SelectItemObject[] => {
      const selectList: Z_SelectItemObject[] = [];

      categories.value.forEach((value, key) => {
        selectList.push({
          id: key,
          name: value.name
        });
      });

      selectList.push({ id: nullUUID, name: '-' });

      return selectList;
    });

    function transactionSelectList(accountId: string, when: Date, amountIn: number, amountOut: number): Z_SelectItemObject[] {
      const selectList: Z_SelectItemObject[] = [];

      const nearTransactions = transactions.value.filter(
        (t) =>
          t.account !== accountId &&
          t.out === amountIn &&
          t.in === amountOut &&
          moment(t.when).isBetween(moment(when).subtract(6, 'days'), moment(when).add(6, 'days'), 'day')
      );

      nearTransactions.forEach((t) => {
        selectList.push({
          id: t.id,
          name: `${accountById(t.account)?.name} - ${t.desc} - ${t.in > 0 ? 'in: ' + t.in : 'out: ' + t.out} - ${moment(t.when).format('YYYY-MM-DD')}`
        });
      });

      selectList.push({ id: nullUUID, name: '-' });

      return selectList;
    }

    function fetchRangeTransactions(): Z_Transactions {
      let data: Z_Transactions = transactions.value;

      if (!pagination.rangeFilter.value) return data;

      data = data.filter((t: Z_Transaction) => {
        if (
          moment(t.when).isBetween(moment(pagination.rangeFilter.value?.from), moment(pagination.rangeFilter.value?.to), 'month')
        )
          return true;
      });

      return data;
    }

    function fetchTransactions(): Z_Transactions {
      let data: Z_Transactions = transactions.value;

      const filterableColumns = ['id', 'desc', 'category', 'account', 'in', 'out', 'opId', 'when', 'status', 'sId'];
      const filterableBy = ['eq', 'neq', 'lt', 'lg', 'in', 'nin'];

      const statusFilterSet = pagination.filters.value.find((f) => f.column === 'status');

      if (!statusFilterSet && !pagination.showPending.value) {
        data = data.filter((d: Z_Transaction) => d.status === z_transactionStatus.enum.Paid);
      }

      data = data.filter((d: Z_Transaction) => {
        const m: boolean[] = [true];

        pagination.filters.value.forEach((filter: Z_Filter) => {
          if (!filterableColumns.includes(filter.column)) return;

          if (!filterableBy.includes(filter.by)) return;

          switch (filter.column) {
            case 'category':
              if (filter.by === z_filterBy.enum.eq) {
                if (d.category !== filter.value) m.push(false);
              }
              break;
            case 'status':
              if (filter.by === z_filterBy.enum.eq) {
                if (d.status !== filter.value) m.push(false);
              }
              break;

            case 'account':
              if (filter.by === z_filterBy.enum.eq) {
                if (d.account !== filter.value) m.push(false);
              }
              break;

            case 'opId':
              if (filter.by === z_filterBy.enum.in) {
                if (d.opId !== filter.value) m.push(false);
              }
              break;

            case 'desc':
              if (filter.by === z_filterBy.enum.in) {
                if (!d.desc.toLowerCase().includes(filter.value.toLowerCase())) m.push(false);
              }
              break;

            default:
              break;
          }
        });

        return !m.includes(false);
      });

      console.log(pagination.dayFilter.value);

      if (pagination.dayFilter.value) {
        let y: Z_Year | null = null;
        let m: Z_Month | null = null;
        let d: Z_Day | null = null;

        if (z_year.safeParse(pagination.dayFilter.value?.year).success) {
          y = z_year.parse(pagination.dayFilter.value?.year);
        }

        if (z_month.safeParse(pagination.dayFilter.value?.month).success) {
          m = z_month.parse(pagination.dayFilter.value?.month);
        }

        if (z_day.safeParse(pagination.dayFilter.value?.day).success) {
          d = z_day.parse(pagination.dayFilter.value?.day);
        }

        if (y && m && d) {
          data = data.filter((t) => moment(t.when).isSame(moment().year(y!).month(m!).day(d!), 'day'));
        } else if (y && (m || m === 0)) {
          data = data.filter((t) => moment(t.when).isSame(moment().year(y!).month(m!), 'month'));
        } else if (y) {
          data = data.filter((t) => moment(t.when).isSame(moment().year(y!), 'year'));
        }
      }

      const sort: Z_Sort = {
        column: 'when',
        direction: 'desc'
      };

      if (sort) {
        switch (sort.column) {
          case 'when':
            data = sortByTime(data);
            break;
          case 'amount':
            data = sortBy('amount', data);
            break;
          case 'category':
            data = sortBy('category', data);
            break;
          case 'account':
            data = sortBy('from', data);
            break;
          case 'status':
            data = sortBy('status', data);
            break;

          default:
            break;
        }

        if (sort.direction === 'desc') {
          data = data.reverse();
        }
      }

      pagination.setTotalCount(data.length);

      data = data.slice(
        (pagination.pagination.value.page - 1) * pagination.pagination.value.perPage,
        (pagination.pagination.value.page - 1) * pagination.pagination.value.perPage + pagination.pagination.value.perPage
      );

      return data;
    }

    function sortByTime(transactionsToSort: Z_Transactions) {
      const sortedTransactions = transactionsToSort.sort((a: Z_Transaction, b: Z_Transaction) => {
        if (moment(b.when).isBefore(moment(a.when))) {
          return 1;
        } else if (moment(a.when).isBefore(moment(b.when))) {
          return -1;
        }

        return 0;
      });

      return sortedTransactions;
    }

    function sortBy(field: keyof any, transactionsToSort: any) {
      const sortedTransactions = transactionsToSort.sort((_a: any, _b: any) => {
        const a = _a[field];
        const b = _b[field];

        if (a === null || b === null) {
          return 0;
        }

        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        }

        return 0;
      });

      return sortedTransactions;
    }

    function sortCategories() {
      categories.value = new Map(
        [...categories.value.entries()].sort((a: [string, Z_Category], b: [string, Z_Category]) => {
          if (a[1].name > b[1].name) {
            return 1;
          } else if (a[1].name < b[1].name) {
            return -1;
          }

          return 0;
        })
      );
    }

    function sortTransactions() {
      transactions.value = transactions.value.sort((a: Z_Transaction, b: Z_Transaction) => {
        // eturn a["one"] - b["one"] || a["two"] - b["two"];
        if (moment(b.when).isBefore(moment(a.when))) {
          return 1;
        } else if (moment(a.when).isBefore(moment(b.when))) {
          return -1;
        }

        return 0;
      });
    }

    function recalculateBalances() {
      const balanceToZero = (v: Z_Account, k: string, m: Map<string, Z_Account>) => {
        v.balance = 0;
        m.set(k, v);
      };

      accounts.value.forEach(balanceToZero);

      const brokenTransactions: Z_Transactions = [];

      transactions.value
        .filter((t) => t.status === z_transactionStatus.enum.Paid)
        .forEach((t: Z_Transaction) => {
          const account = accounts.value.get(t.account);

          if (account) {
            account.balance = z.coerce.number().parse((account.balance + t.in - t.out).toFixed(2));
            accounts.value.set(t.account, account);
          } else {
            brokenTransactions.push(t);
          }
        });

      const brIDs = brokenTransactions.map((x) => x.id);

      console.log('broken transactions to delete:', brIDs);

      transactions.value = transactions.value.filter((t) => !brIDs.includes(t.id));

      return true;
    }

    function accountById(id: string | null): Z_Account | undefined {
      if (!id) return undefined;

      return accounts.value.get(id);
    }

    function categoryById(id: string | null): Z_Category | undefined {
      if (!id) return undefined;

      return categories.value.get(id);
    }

    function transactionById(id: string | null): Z_Transaction | undefined {
      if (!id) return undefined;

      return transactions.value.find((t) => t.id === id);
    }

    function addAccount(account: Z_Account) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_account.safeParse(account).success) {
        const acc = z_account.parse(account);

        acc.name = capitalize(acc.name);

        const exist = accounts.value.get(acc.id) || Array.from(accounts.value.values()).find((a) => a.name === acc.name);
        if (exist) {
          response.success = false;
          response.errors.push('account.error.account_name_already_exist');

          return response;
        }

        accounts.value.set(acc.id, acc);

        recalculateBalances();

        return response;
      }

      response.success = false;
      response.errors.push('account.error.not_valid');

      return response;
    }

    function editAccount(account: Z_Account) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_account.safeParse(account).success) {
        const newAccount = z_account.parse(account);

        const exist = accounts.value.get(newAccount.id);

        if (!exist) {
          response.success = false;
          response.errors.push('account.error.not_found');

          return response;
        }

        newAccount.name = capitalize(newAccount.name);

        accounts.value.set(newAccount.id, newAccount);

        recalculateBalances();

        return response;
      }

      response.success = false;
      response.errors.push('account.error.not_valid');

      return response;
    }

    function recalculateCategoryUsage() {
      const countUsage = (v: Z_Category, k: string, m: Map<string, Z_Category>) => {
        v.used = transactions.value.filter((t) => t.category === v.id).length;
        m.set(k, v);
      };

      categories.value.forEach(countUsage);

      return true;
    }

    function removeAccount(id: string) {
      const res = accounts.value.delete(id);

      const trToRemove = transactions.value.filter((t) => t.account === id).map((x) => x.id);
      transactions.value = transactions.value.map((t) => {
        if (t.opId && trToRemove.includes(t.opId)) {
          t.opId = null;
        }

        return t;
      });

      transactions.value = transactions.value.filter((t) => !trToRemove.includes(t.id));

      if (res) {
        recalculateCategoryUsage();
        recalculateBalances();
      }

      return res;
    }

    function addCategory(category: Z_Category) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_category.safeParse(category).success) {
        const cat = z_category.parse(category);

        cat.name = capitalize(cat.name);

        const exist = categories.value.get(cat.id) || Array.from(categories.value.values()).find((c) => c.name === cat.name);
        if (exist) {
          response.success = false;
          response.errors.push('category.error.already_exist');

          return response;
        }

        categories.value.set(cat.id, cat);

        sortCategories();

        return response;
      }

      const err = z_category.safeParse(category);
      console.error('category error: ', err);

      response.success = false;
      response.errors.push('category.error.not_valid');

      return response;
    }

    function editCategory(category: Z_Category) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_category.safeParse(category).success) {
        const newCategory = z_category.parse(category);

        const exist = categories.value.get(newCategory.id);

        if (!exist) {
          response.success = false;
          response.errors.push('category.error.not_found');

          return response;
        }

        newCategory.name = capitalize(newCategory.name);

        categories.value.set(newCategory.id, newCategory);

        sortCategories();

        return response;
      }

      response.success = false;
      response.errors.push('category.error.not_valid');

      return response;
    }

    function removeCategory(id: string) {
      const category = z_category.parse(categories.value.get(id));

      if (category) {
        const categoriesToRemove: string[] = [category.id];
        categories.value.forEach((v, k) => {
          if (v.parent === category.id) categoriesToRemove.push(k);
        });

        transactions.value = transactions.value.map((t) => {
          if (t.category && categoriesToRemove.includes(t.category)) {
            t.category = null;
          }

          return t;
        });

        categoriesToRemove.forEach((c) => categories.value.delete(c));
      }
    }

    function increaseCategoryUsage(id: string) {
      const category = categories.value.get(id);

      if (category) {
        category.used = category.used + 1;

        categories.value.set(id, category);
      }
    }

    function decreaseCategoryUsage(id: string) {
      const category = categories.value.get(id);

      if (category) {
        category.used = category.used - 1;
        if (category.used < 0) category.used = 0;

        categories.value.set(id, category);
      }
    }

    function addTransaction(transaction: Z_Transaction, batch: boolean = false) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_transaction.safeParse(transaction).success) {
        const newTransaction = z_transaction.parse(transaction);

        const account = accounts.value.get(newTransaction.account);

        if (!account) {
          response.success = false;
          response.errors.push('transaction.error.account_not_exist');
          console.error('Account not exist');

          return response;
        }

        let exist = transactions.value.find((d) => d.id === newTransaction.id);

        if (!exist && newTransaction.iId) {
          exist = transactions.value.find((d) => d.iId === newTransaction.iId);
        }

        if (exist) {
          response.success = false;
          response.errors.push('transaction.error.already_exist');
          console.error('Existing transaction found: ', newTransaction);

          return response;
        }

        newTransaction.in = z.coerce.number().parse(Math.abs(newTransaction.in).toFixed(2));
        newTransaction.out = z.coerce.number().parse(Math.abs(newTransaction.out).toFixed(2));

        if (newTransaction.in === null && newTransaction.out === null) {
          response.success = false;
          response.errors.push('transaction.error.no_in_or_out');
          console.error("No in or out, can't be right: ", newTransaction);

          return response;
        }

        newTransaction.when = moment(newTransaction.when).format('YYYY-MM-DD') as unknown as Date;

        if (newTransaction.opId === nullUUID) newTransaction.opId = null;
        if (newTransaction.opId) {
          newTransaction.opId = transactions.value.find((f) => f.id === newTransaction.opId)?.id || null;
        }

        if (!batch) {
          transactions.value = [...transactions.value, newTransaction];

          if (newTransaction.category) increaseCategoryUsage(newTransaction.category);

          sortTransactions();
          recalculateBalances();

          return response;
        }

        let opositeTransaction: Z_Transaction[] = [];

        opositeTransaction = transactions.value.filter(
          (f) =>
            f.opId === null &&
            f.account !== newTransaction.account &&
            (newTransaction.in !== 0 ? newTransaction.in === f.out : newTransaction.out === f.in) &&
            moment(f.when).isSame(moment(newTransaction.when), 'day')
        );

        if (opositeTransaction.length === 1) {
          const ot = opositeTransaction[0];

          const otAccount = accounts.value.get(ot.account);

          if (otAccount) {
            if (newTransaction.in === 0) {
              newTransaction.opId = ot.id;
              ot.opId = newTransaction.id;

              newTransaction.desc = `transfer to: ${otAccount.name}`;
              ot.desc = `transfer from: ${account.name}`;
            } else {
              newTransaction.opId = ot.id;
              ot.opId = newTransaction.id;

              newTransaction.desc = `transfer from: ${otAccount.name}`;
              ot.desc = `transfer to: ${account.name}`;
            }
          }

          const otIndex = transactions.value.findIndex((t) => t.id === transaction.id);
          if (otIndex >= 0) {
            transactions.value[otIndex] = ot;
          }
        }

        const pendingTrs: Z_Transaction[] | undefined = transactions.value.filter(
          (t) =>
            t.iId === null &&
            t.status === z_transactionStatus.enum.Pending &&
            t.account === newTransaction.account &&
            t.in === newTransaction.in &&
            t.out === newTransaction.out &&
            moment(t.when).isSame(moment(newTransaction.when), 'day')
        );

        if (pendingTrs.length === 1) {
          const pTr = pendingTrs[0];

          pTr.status = z_transactionStatus.enum.Paid;
          pTr.desc = newTransaction.desc;

          if (newTransaction.iId) {
            pTr.iId = newTransaction.iId;
          }

          const ntIndex = transactions.value.findIndex((t) => t.id === pTr.id);
          if (ntIndex >= 0) {
            transactions.value[ntIndex] = pTr;
          }
        } else {
          transactions.value = [...transactions.value, newTransaction];
        }

        return response;
      } else {
        response.success = false;
        response.errors.push('transaction.error.not_valid');

        console.error(response, z_transaction.parse(transaction));

        return response;
      }
    }

    function editTransaction(transaction: Z_Transaction, batch: boolean = false) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_transaction.safeParse(transaction).success) {
        const newTransaction = z_transaction.parse(transaction);

        const transactionIndex = transactions.value.findIndex((t) => t.id === transaction.id);
        if (transactionIndex < 0) {
          response.success = false;
          response.errors.push('transaction.error.not_found');

          return response;
        }

        if (newTransaction.opId === nullUUID) newTransaction.opId = null;

        if (newTransaction.opId) {
          const ot = transactions.value.find((f) => f.id === newTransaction.opId);

          if (ot) {
            newTransaction.opId = ot?.id || null;

            const account = accounts.value.get(newTransaction.account);
            const otAccount = accounts.value.get(ot.account);

            if (otAccount && account) {
              if (newTransaction.in === 0) {
                newTransaction.desc = `transfer to: ${otAccount.name}`;
                ot.desc = `transfer from: ${account.name}`;
              } else {
                newTransaction.desc = `transfer from: ${otAccount.name}`;
                ot.desc = `transfer to: ${account.name}`;
              }
            }

            ot.in = newTransaction.out;
            ot.out = newTransaction.in;

            const otIndex = transactions.value.findIndex((t) => t.id === transaction.id);
            if (otIndex >= 0) {
              transactions.value[otIndex] = ot;
            }
          }
        }

        transactions.value[transactionIndex] = newTransaction;

        if (!batch) {
          const oldTransaction = transactions.value.find((t) => t.id === transaction.id);

          if (oldTransaction?.category) decreaseCategoryUsage(oldTransaction.category);
          if (newTransaction?.category) increaseCategoryUsage(newTransaction.category);

          sortTransactions();
          recalculateBalances();
          recalculateCategoryUsage();
        }

        return response;
      } else {
        response.success = false;
        response.errors.push('transaction.error.not_valid');

        console.error(response, z_transaction.parse(transaction));

        return response;
      }
    }

    function removeTransaction(i: string) {
      const id = z.string().parse(i);

      const tr = transactions.value.find((t) => t.id === id);
      const optr = transactions.value.find((t) => t.id === tr?.opId);

      if (tr || optr) {
        if (tr && tr?.category) decreaseCategoryUsage(tr.category);

        transactions.value = transactions.value.filter((c) => c.id !== tr?.id && c.id !== optr?.id);

        recalculateBalances();
      }
      return true;
    }

    function accountBalanceAt(accountId: string, date: Date, withPending: boolean = false, pendingOnly: boolean = false): number {
      const account = accounts.value.get(accountId);
      if (account) {
        let balance = 0;

        let allTransactions = transactions.value.filter(
          (t) => moment(t.when).isSameOrBefore(moment(date), 'day') && (withPending || t.status === z_transactionStatus.enum.Paid)
        );

        if (pendingOnly) {
          allTransactions = allTransactions.filter((t) => t.status === z_transactionStatus.enum.Pending);
        }

        allTransactions.forEach((t: Z_Transaction) => {
          if (t.account === account.id) {
            balance = z.coerce.number().parse((balance + t.in - t.out).toFixed(2));
          }
        });

        return balance;
      }

      console.error('Account ID not exist in accounts!');

      return 0;
    }

    function accountMonthOutAt(
      accountId: string,
      date: Date,
      withPending: boolean = false,
      pendingOnly: boolean = false
    ): number {
      const account = accounts.value.get(accountId);
      if (account) {
        let balance = 0;

        let ts = transactions.value.filter(
          (t) =>
            t.account === accountId &&
            moment(t.when).isSame(moment(date), 'month') &&
            (withPending || t.status === z_transactionStatus.enum.Paid)
        );

        if (pendingOnly) {
          ts = ts.filter((t) => t.status === z_transactionStatus.enum.Pending);
        }

        ts.forEach((t: Z_Transaction) => {
          balance = z.coerce.number().parse((balance - t.out).toFixed(2));
        });

        return balance;
      }

      console.error('Account ID not exist in accounts!');

      return 0;
    }

    function accountMonthInAt(accountId: string, date: Date, withPending: boolean = false, pendingOnly: boolean = false): number {
      const account = accounts.value.get(accountId);
      if (account) {
        let balance = 0;

        let ts = transactions.value.filter(
          (t) =>
            t.account === accountId &&
            moment(t.when).isSame(moment(date), 'month') &&
            (withPending || t.status === z_transactionStatus.enum.Paid)
        );

        if (pendingOnly) {
          ts = ts.filter((t) => t.status === z_transactionStatus.enum.Pending);
        }

        ts.forEach((t: Z_Transaction) => {
          balance = z.coerce.number().parse((balance + t.in).toFixed(2));
        });

        return balance;
      }

      console.error('Account ID not exist in accounts!');

      return 0;
    }

    return {
      // loading,

      accounts,
      categories,
      transactions,

      paginatedTransactions,

      getAccounts,

      accountSelectList,
      categorySelectList,
      transactionSelectList,

      fetchRangeTransactions,
      fetchTransactions,

      addAccount,
      editAccount,
      removeAccount,

      addCategory,
      editCategory,
      removeCategory,
      recalculateCategoryUsage,

      addTransaction,
      editTransaction,
      removeTransaction,
      sortTransactions,

      accountById,
      categoryById,
      transactionById,

      recalculateBalances,
      accountBalanceAt,
      accountMonthOutAt,
      accountMonthInAt
    };
  },
  {
    persist: {
      key: import.meta.env.VITE_LOCALSTORAGE_DATA_KEY,
      serializer: {
        deserialize: parse,
        serialize: stringify
      },
      paths: ['accounts', 'categories', 'transactions'],
      debug: true
    }
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
