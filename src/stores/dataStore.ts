import { usePagination } from '@/composables/usePagination';
import {
  nullUUID,
  z_account,
  z_budget,
  z_category,
  z_day,
  z_month,
  z_transaction,
  z_transactionStatus,
  z_year,
  type Z_Account,
  type Z_Accounts,
  type Z_ApiResponse,
  type Z_Budget,
  type Z_Budgets,
  type Z_Categories,
  type Z_Category,
  type Z_Day,
  type Z_Month,
  type Z_Transaction,
  type Z_Transactions,
  type Z_Year
} from '@/types';
import moment from 'moment';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, type Ref } from 'vue';
import { z } from 'zod';

const pagination = usePagination();
export const useDataStore = defineStore(
  'dataStore',
  () => {
    const loading: Ref<boolean> = ref(false);

    const accounts: Ref<Z_Accounts> = ref([]);
    const budgets: Ref<Z_Budgets> = ref([]);
    const categories: Ref<Z_Categories> = ref([]);
    const transactions: Ref<Z_Transactions> = ref([]);

    const paginatedTransactions: Ref<Z_Transactions> = ref([]);

    const accountSelectList = computed(() => {
      const selectList = accounts.value.map((a) => {
        return { id: a.id, name: a.name };
      });

      selectList.push({
        id: nullUUID,
        name: 'null'
      });

      return selectList;
    });

    const budgetSelectList = computed(() => {
      const selectList = budgets.value.map((b) => {
        return {
          label: categories.value.find((c) => c.id === b.category) || b.id,
          value: b.id
        };
      });

      return selectList;
    });

    const categorySelectList = computed(() => {
      const selectList = categories.value.map((c) => {
        return { id: c.id, name: c.name };
      });

      return selectList;
    });

    const categoryTopLevelSelectList = computed(() => {
      const selectList = categories.value
        .filter((c) => c.parent === null)
        .map((c) => {
          return { label: c.name, value: c.id };
        });

      return selectList;
    });

    const getPaginatedBudgets = computed(
      () =>
        (
          page: number,
          pageCount: number,
          sort: any = null,
          range: any = null,
          nameFilter: any = null
        ): { items: Z_Budgets; total: number } => {
          let data = budgets.value;

          if (z.string().safeParse(nameFilter).success) {
            const category = categories.value.find((c) => c.name.includes(nameFilter) && c.parent === null);
            data = data.filter((b) => b.category === category?.id);
          }

          if (range) {
            data = data.filter((b) => b.when === range);
          }

          if (sort) {
            switch (sort.column) {
              case 'category':
                data = sortBy('category', data);
                break;
              case 'name':
                data = sortBy('name', data);
                break;

              default:
                break;
            }

            if (sort.direction === 'desc') {
              data = data.reverse();
            }
          }

          return {
            items: data.slice((page - 1) * pageCount, (page - 1) * pageCount + pageCount),
            total: data.length
          };
        }
    );

    function fetchTransactions(): Z_Transactions {
      loading.value = true;

      let data: Z_Transactions = [];

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
          data = transactions.value.filter((t) => moment(t.when).isSame(moment().year(y!).month(m!).day(d!), 'day'));
        } else if (y && (m || m === 0)) {
          data = transactions.value.filter((t) => moment(t.when).isSame(moment().year(y!).month(m!), 'month'));
        } else if (y) {
          data = transactions.value.filter((t) => moment(t.when).isSame(moment().year(y!), 'year'));
        }
      } else {
        data = transactions.value;
      }

      // if (sort) {
      //   switch (sort.column) {
      //     case 'when':
      //       data = sortByTime(data);
      //       break;
      //     case 'amount':
      //       data = sortBy('amount', data);
      //       break;
      //     case 'category':
      //       data = sortBy('category', data);
      //       break;
      //     case 'from':
      //       data = sortBy('from', data);
      //       break;
      //     case 'to':
      //       data = sortBy('to', data);
      //       break;
      //     case 'status':
      //       data = sortBy('status', data);
      //       break;

      //     default:
      //       break;
      //   }

      //   if (sort.direction === 'desc') {
      //     data = data.reverse();
      //   }
      // }

      pagination.setTotalCount(data.length);

      data = data.slice(
        (pagination.pagination.value.page - 1) * pagination.pagination.value.perPage,
        (pagination.pagination.value.page - 1) * pagination.pagination.value.perPage + pagination.pagination.value.perPage
      );

      loading.value = false;

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

    function sortBudgets() {
      budgets.value = budgets.value.sort((a: Z_Budget, b: Z_Budget) => {
        if (moment(b.when).isBefore(moment(a.when), 'month')) {
          return 1;
        } else if (moment(a.when).isBefore(moment(b.when), 'month')) {
          return -1;
        }
        return 0;
      });
    }

    function sortCategories() {
      categories.value = categories.value.sort((a: Z_Category, b: Z_Category) => {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        }
        return 0;
      });
    }

    function sortTransactions() {
      transactions.value = transactions.value.sort((a: Z_Transaction, b: Z_Transaction) => {
        if (moment(b.when).isBefore(moment(a.when))) {
          return 1;
        } else if (moment(a.when).isBefore(moment(b.when))) {
          return -1;
        }
        return 0;
      });
    }

    function accountBalanceAt(accountId: string, date: Date): number {
      const account = accounts.value.find((a) => a.id === accountId);
      if (account) {
        const transactionsTill = transactions.value.filter((t) => moment(t.when).isSameOrBefore(moment(date), 'day'));

        let balance = account.startingBalance;

        transactionsTill.forEach((t) => {
          if (t.from === account.id) {
            balance = balance - t.amount;
          }

          if (t.to === account.id) {
            balance = balance + t.amount;
          }
        });

        return balance;
      }

      console.error('Account ID not exist in accounts!');
      return 0;
    }

    function recalculateBalances() {
      accounts.value = accounts.value.map((a) => {
        a.balance = z.coerce.number().parse(a.startingBalance.toFixed(2));
        return a;
      });

      transactions.value
        .filter((t) => t.status === z_transactionStatus.enum.Paid)
        .forEach((t: Z_Transaction) => {
          recalculateBalanceForTransaction(t);
        });

      return true;
    }

    function recalculateBalanceForTransaction(t: Z_Transaction) {
      if (t.status === z_transactionStatus.enum.Pending) {
        return;
      }

      const fromIndex = accounts.value.findIndex((a) => a.id === t.from);
      const toIndex = accounts.value.findIndex((a) => a.id === t.to);

      if (fromIndex !== -1) {
        accounts.value[fromIndex].balance = z.coerce.number().parse((accounts.value[fromIndex].balance - t.amount).toFixed(2));
      }

      if (toIndex !== -1) {
        accounts.value[toIndex].balance = z.coerce.number().parse((accounts.value[toIndex].balance + t.amount).toFixed(2));
      }

      // const category = getTopLevelCategory(t.category);

      // const categoryId = category?.id;
      // if (categoryId) {
      //   const correspondingBudgetIndex = budgets.value.findIndex(
      //     (b) =>
      //       moment(t.when).isSame(moment(b.when), "month") &&
      //       t.category === categoryId
      //   );

      //   if (correspondingBudgetIndex >= 0) {
      //     budgets.value[correspondingBudgetIndex].used =
      //       budgets.value[correspondingBudgetIndex].used + t.amount;
      //   }
      // }
    }

    function getTopLevelCategory(id: string): Z_Category | undefined {
      let category = categoryFromId(id);

      if (category?.parent) {
        category = categoryFromId(category.parent);
      }

      return category;
    }

    function accountFromId(id: string): Z_Account | undefined {
      return accounts.value.find((a) => a.id === id);
    }

    function categoryFromId(id: string): Z_Category | undefined {
      return categories.value.find((c) => c.id === id);
    }

    function transactionFromId(id: string): Z_Transaction | undefined {
      return transactions.value.find((t) => t.id === id);
    }

    function addAccount(account: Z_Account) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_account.safeParse(account).success) {
        const acc = z_account.parse(account);

        const exist = accounts.value.find((a) => a.name === acc.name || a.id === acc.id);
        if (exist) {
          response.success = false;
          response.errors.push('account.error.account_name_already_exist');
          return response;
        }

        accounts.value = [...accounts.value, acc];
        recalculateBalances();
        return response;
      }
    }

    function editAccount(account: Z_Account) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_account.safeParse(account).success) {
        const newAccount = z_account.parse(account);

        const accountIndex = accounts.value.findIndex((a) => a.id === account.id);
        if (accountIndex < 0) {
          response.success = false;
          response.errors.push('account.error.not_found');
          return response;
        }

        accounts.value[accountIndex] = newAccount;
        // recalculateBalances();
        return response;
      }
    }

    function removeAccount(i: string) {
      const id = z.string().parse(i);

      accounts.value = accounts.value.filter((a) => a.id !== id);
      transactions.value = transactions.value.filter((t) => t.from !== id && t.to !== id);

      return true;
    }

    function addBudget(budget: Z_Budget) {
      if (z_budget.safeParse(budget).success) {
        const b = z_budget.parse(budget);

        budgets.value = [...budgets.value, b];

        sortBudgets();

        return true;
      }
    }

    function editBudget(budget: Z_Budget) {
      if (z_budget.safeParse(budget).success) {
        const newBudget = z_budget.parse(budget);

        const budgetIndex = budgets.value.findIndex((c) => c.id === budget.id);
        if (budgetIndex < 0) {
          return false;
        }

        budgets.value[budgetIndex] = newBudget;

        sortBudgets();

        return true;
      } else {
        z_budget.parse(budget);
      }
    }

    function getBudget(i: string): Z_Budget | undefined {
      const id = z.string().parse(i);

      return budgets.value.find((b) => b.id === id);
    }

    function removeBudget(i: string) {
      const id = z.string().parse(i);

      budgets.value = budgets.value.filter((b) => b.id !== id);
      transactions.value = transactions.value.filter((t) => t.desc !== id);

      sortBudgets();

      return true;
    }

    function addCategory(category: Z_Category) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_category.safeParse(category).success) {
        const cat = z_category.parse(category);

        const exist = categories.value.find((c) => c.name === cat.name);
        if (exist) {
          response.success = false;
          response.errors.push('category.error.already_exist');
          return response;
        }

        categories.value = [...categories.value, cat];

        sortCategories();

        return response;
      }
    }

    function editCategory(category: Z_Category) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_category.safeParse(category).success) {
        const newCategory = z_category.parse(category);

        const categoryIndex = categories.value.findIndex((c) => c.id === category.id);
        if (categoryIndex < 0) {
          response.success = false;
          response.errors.push('category.error.not_found');
          return response;
        }

        categories.value[categoryIndex] = newCategory;

        sortCategories();

        return response;
      }
    }

    function getCategory(i: string): Z_Category | undefined {
      const id = z.string().parse(i);

      return categories.value.find((c) => c.id === id);
    }

    function removeCategory(i: string) {
      const id = z.string().parse(i);

      const category = getCategory(id);

      if (category) {
        let childs: any[] = categories.value.filter((c) => c.parent === category.id);

        childs = childs.map((c) => c.id);

        childs.push(id);

        categories.value = categories.value.filter((c) => !childs.includes(c.id));
        transactions.value = transactions.value.filter((t) => !childs.includes(t.category));

        sortCategories();

        return true;
      }
      return false;
    }

    function addTransaction(transaction: Z_Transaction, batch: boolean = false) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_transaction.safeParse(transaction).success) {
        const tr = z_transaction.parse(transaction);

        const exist = transactions.value.find((d) => d.id === tr.id);
        if (exist) {
          response.success = false;
          response.errors.push('transaction.error.already_exist');
          return response;
        }

        tr.amount = z.coerce.number().parse(tr.amount.toFixed(2));
        tr.when = moment(tr.when).format('YYYY-MM-DD') as unknown as Date;

        transactions.value = [...transactions.value, tr];

        if (!batch) {
          sortTransactions();

          recalculateBalanceForTransaction(tr);
        }

        return response;
      }
    }

    function editTransaction(transaction: Z_Transaction) {
      const response: Z_ApiResponse = { success: true, errors: [] };

      if (z_transaction.safeParse(transaction).success) {
        const newtransaction = z_transaction.parse(transaction);

        const transactionIndex = transactions.value.findIndex((t) => t.id === transaction.id);
        if (transactionIndex < 0) {
          response.success = false;
          response.errors.push('transaction.error.not_found');
          return response;
        }

        transactions.value[transactionIndex] = newtransaction;

        sortTransactions();

        recalculateBalances();

        return response;
      }
    }

    function removeTransaction(i: string) {
      const id = z.string().parse(i);

      transactions.value = transactions.value.filter((c) => c.id !== id);

      recalculateBalances();

      return true;
    }

    function budgetSpendingForAccountInMonth(accountId: string, when: string) {
      const account = accounts.value.find((a) => a.id === accountId);
      if (account) {
        const aplicableBudgets = budgets.value.filter((b) => b.when === when && b.account === account.id);

        let accountBudgetSpending: number = 0;
        let accountBudgetSum: number = 0;

        aplicableBudgets.forEach((b) => {
          accountBudgetSum = accountBudgetSum + b.amount;

          const categoryIds = categories.value.filter((c) => c.id === b.category || c.parent === b.category).map((c) => c.id);

          const transactionsInRange = transactions.value.filter(
            (t) =>
              moment(t.when).isSame(moment(when), 'month') &&
              t.status === z_transactionStatus.enum.Paid &&
              t.category &&
              categoryIds.includes(t.category)
          );

          accountBudgetSpending =
            accountBudgetSpending +
            transactionsInRange.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);
        });

        return accountBudgetSum - accountBudgetSpending;
      }

      console.error('Account ID not exist in accounts!');
      return 0;
    }

    function calculatePaidTopLevelCategoryInMonth(id: string, month: string) {
      const categoryIds = categories.value.filter((c) => c.id === id || c.parent === id).map((c) => c.id);

      const transactionsInRange = transactions.value.filter(
        (t) =>
          moment(t.when).isSame(moment(month), 'month') &&
          t.status === z_transactionStatus.enum.Paid &&
          t.category &&
          categoryIds.includes(t.category)
      );

      return transactionsInRange.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);
    }

    return {
      loading,

      accounts,
      budgets,
      categories,
      transactions,

      paginatedTransactions,

      accountSelectList,
      budgetSelectList,
      categorySelectList,
      categoryTopLevelSelectList,
      getPaginatedBudgets,

      fetchTransactions,

      addAccount,
      editAccount,
      removeAccount,

      addBudget,
      editBudget,
      getBudget,
      removeBudget,

      addCategory,
      editCategory,
      getCategory,
      removeCategory,

      addTransaction,
      editTransaction,
      removeTransaction,

      accountFromId,
      categoryFromId,
      transactionFromId,

      sortBudgets,
      sortCategories,
      sortTransactions,
      recalculateBalances,
      recalculateBalanceForTransaction,
      accountBalanceAt,
      calculatePaidTopLevelCategoryInMonth,
      budgetSpendingForAccountInMonth
    };
  },
  {
    persist: {
      key: '__debt_controller-'
    }
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
