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

    const categorySelectList = computed(() => {
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

      const filterableColumns = ['id', 'desc', 'category', 'account', 'from', 'amount', 'to', 'when', 'status', 'sId'];
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
                if (d.category && categories.value.get(d.category)?.name !== filter.value) m.push(false);
              }
              break;
            case 'status':
              if (filter.by === z_filterBy.enum.eq) {
                if (d.status !== filter.value) m.push(false);
              }
              break;

            case 'account':
              if (filter.by === z_filterBy.enum.eq) {
                if (!(d.from === filter.value || d.to === filter.value)) m.push(false);
              }
              break;

            case 'from':
              if (filter.by === z_filterBy.enum.in) {
                if (d.from !== filter.value) m.push(false);
              }
              break;

            case 'to':
              if (filter.by === z_filterBy.enum.in) {
                if (d.to !== filter.value) m.push(false);
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
          case 'from':
            data = sortBy('from', data);
            break;
          case 'to':
            data = sortBy('to', data);
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
        if (moment(b.when).isBefore(moment(a.when)) || Math.abs(a.amount) - Math.abs(b.amount)) {
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

      transactions.value
        .filter((t) => t.status === z_transactionStatus.enum.Paid)
        .forEach((t: Z_Transaction) => {
          const aFrom = accounts.value.get(t.from);

          if (aFrom) {
            aFrom.balance = z.coerce.number().parse((aFrom.balance + t.amount).toFixed(2));
            accounts.value.set(t.from, aFrom);
          }

          const aTo = accounts.value.get(t.to);

          if (aTo) {
            aTo.balance = z.coerce.number().parse((aTo.balance + Math.abs(t.amount)).toFixed(2));
            accounts.value.set(t.to, aTo);
          }
        });

      return true;
    }

    function accountById(id: string): Z_Account | undefined {
      return accounts.value.get(id);
    }

    function categoryById(id: string): Z_Category | undefined {
      return categories.value.get(id);
    }

    function transactionById(id: string): Z_Transaction | undefined {
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
        const childs: string[] = [];
        categories.value.forEach((v, k) => {
          if (v.parent === category.id) childs.push(k);
        });

        transactions.value = transactions.value.map((t) => {
          if (t.category && childs.includes(t.category)) {
            t.category = null;
            return t;
          }
          return t;
        });
      }

      categories.value.delete(id);
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
        const t = z_transaction.parse(transaction);

        const exist = transactions.value.find(
          (d) =>
            d.id === t.id || (d.iId.from === t.iId.from && t.iId.from !== null) || (d.iId.to === t.iId.to && t.iId.to !== null)
        );

        if (exist) {
          response.success = false;
          response.errors.push('transaction.error.already_exist');
          return response;
        }

        t.amount = z.coerce.number().parse(t.amount.toFixed(2));
        t.when = moment(t.when).format('YYYY-MM-DD') as unknown as Date;

        const from = accounts.value.get(t.from);
        const to = accounts.value.get(t.to);

        if (!from && !to) {
          response.success = false;
          response.errors.push('transaction.error.account_not_exist');
          console.error('Account not exist');
          return response;
        }

        if (!batch) {
          transactions.value = [...transactions.value, t];

          if (t.category) increaseCategoryUsage(t.category);

          sortTransactions();
          recalculateBalances();

          return response;
        }

        let opositeTransaction: Z_Transaction[] = [];

        if (t.category) {
          const category = Array.from(categories.value.values()).find((c) => c.id == t.category);

          let aExist: Z_Account | undefined;

          if (category) aExist = Array.from(accounts.value.values()).find((a) => a.name == category.name);

          if (aExist) {
            if (t.from && t.from !== nullUUID) {
              opositeTransaction = transactions.value.filter(
                (f) =>
                  moment(f.when).isSame(moment(t.when), 'day') &&
                  f.amount * -1 === t.amount &&
                  f.to === aExist?.id &&
                  f.from === nullUUID &&
                  f.iId.from === null
              );
            } else if (t.to && t.to !== nullUUID) {
              opositeTransaction = transactions.value.filter(
                (f) =>
                  moment(f.when).isSame(moment(t.when), 'day') &&
                  f.amount * -1 === t.amount &&
                  f.from === aExist?.id &&
                  f.to === nullUUID &&
                  f.iId.to === null
              );
            }

            if (opositeTransaction.length === 1) {
              const ot = opositeTransaction[0];

              if (ot.from === aExist.id) {
                ot.to = t.to;
                ot.desc = `${ot.desc}|${t.desc}`;
                ot.iId.to = t.iId.to;
              } else if (ot.to === aExist.id) {
                ot.amount = t.amount;
                ot.from = t.from;
                ot.desc = `${t.desc}|${ot.desc}`;
                ot.iId.from = t.iId.from;
              }

              editTransaction(ot, true);

              return response;
            }
          }
        }

        transactions.value = [...transactions.value, t];

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
      }
    }

    function removeTransaction(i: string) {
      const id = z.string().parse(i);

      const t = transactions.value.find((t) => t.id === id);

      transactions.value = transactions.value.filter((c) => c.id !== id);

      if (t && t?.category) decreaseCategoryUsage(t.category);

      recalculateBalances();

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
          if (t.from === account.id) {
            balance = z.coerce.number().parse((balance + t.amount).toFixed(2));
          }

          if (t.to === account.id) {
            balance = z.coerce.number().parse((balance + Math.abs(t.amount)).toFixed(2));
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
            (withPending || t.to === nullUUID) &&
            moment(t.when).isSame(moment(date), 'month') &&
            (withPending || t.status === z_transactionStatus.enum.Paid)
        );

        if (pendingOnly) {
          ts = ts.filter((t) => t.status === z_transactionStatus.enum.Pending);
        }

        ts.forEach((t: Z_Transaction) => {
          if (t.from === account.id) {
            balance = z.coerce.number().parse((balance + t.amount).toFixed(2));
          }
          // if (t.to === account.id) {
          //   balance = z.coerce.number().parse((balance + Math.abs(t.amount)).toFixed(2));
          // }
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
            (withPending || t.from === nullUUID) &&
            moment(t.when).isSame(moment(date), 'month') &&
            (withPending || t.status === z_transactionStatus.enum.Paid)
        );

        if (pendingOnly) {
          ts = ts.filter((t) => t.status === z_transactionStatus.enum.Pending);
        }

        ts.forEach((t: Z_Transaction) => {
          // if (t.from === account.id) {
          //   balance = z.coerce.number().parse((balance + t.amount).toFixed(2));
          // }
          if (t.to === account.id) {
            balance = z.coerce.number().parse((balance + Math.abs(t.amount)).toFixed(2));
          }
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
