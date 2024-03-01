export const messages = {
  en: {
    account: {
      card: {
        new: 'Create new account'
      },
      error: {
        already_exist: 'Account already exist.',
        not_found: 'Acount not found.'
      },
      form: {
        add: {
          title: 'Add Account'
        },
        delete: {
          info: 'Account "{name}" deleted!',
          title: 'Delete account',
          warning: 'Account will be deleted permanently with every associated data. (example: transactions)'
        },
        edit: {
          accountType: 'Account type',
          name: 'Name',
          startingBalance: 'Starting balance',
          title: 'Edit Account'
        },
        saved: 'Account saved.',
        saveFailed: 'Saving the account failed 🧐',
        updated: 'Account updated'
      },
      type: {
        credit: 'Credit',
        debit: 'Debit',
        loan: 'Loan',
        saving: 'Saving'
      }
    },
    button: {
      cancel: 'Cancel',
      choose: 'Choose file',
      confirm: 'Ok',
      edit: 'Edit',
      import: 'Import',
      save: 'Save',
      ok: 'Ok'
    },
    category: {
      card: {
        new: 'Create new category'
      },
      error: {
        already_exist: 'Category already exist.',
        not_found: 'Category not found.'
      },
      form: {
        add: {
          title: 'Add Category'
        },
        delete: {
          info: 'Category "{name}" deleted!',
          title: 'Delete category',
          warning: 'Category will be deleted permanently with every associated data.'
        },
        edit: {
          description: 'Description',
          name: 'Name',
          parent: 'Parent',
          title: 'Edit Category'
        },
        saved: 'Category saved.',
        saveFailed: 'Saving the category failed 🧐',
        updated: 'Category updated'
      }
    },
    data: {
      reset: {
        title: 'Are you sure?',
        warning: 'This will delete everything witouth asking again...'
      }
    },
    import_transactions: {
      title: 'Import transactions for account: "{accountName}"',
      step_one: 'Please select the appropriate columns from the bank provided CSV file.',
      select: {
        date: 'Transaction date',
        description: 'Description',
        category: 'Category',
        in: 'Credit / In',
        out: 'Debit / out'
      }
    },
    menu: {
      account: {
        new: 'Create a new account'
      },
      archive: 'Archive',
      delete: 'Delete',
      edit: 'Edit',
      duplicate: 'Duplicate',
      pending: 'Mark to pending',
      paid: 'Mark to paid',
      all: {
        delete: 'Delete all occurrence',
        edit: 'Edit all occurrence'
      }
    },
    nav: {
      about: 'About',
      account: 'Accounts',
      budget: 'Budgets',
      category: 'Categories',
      export: 'Export data',
      home: 'Home',
      import: 'Import data',
      open: 'Open menu',
      theme: 'Switch theme',
      todo: 'TODOs',
      transaction: 'Transactions'
    },
    notification: {
      error: 'Error',
      import: {
        notText: 'Selected file must be a JSON file.',
        notValid: 'Imput file content not valid.',
        somethingWrong: 'Something went wrong during import, The local data may messed up 😞',
        success: 'Import finished with success.',
        warningText: 'All existing data will be replaced with the new one if the import are valid!'
      },
      reset: { success: 'All data succesfuly erased.' }
    },
    table: {
      empty: 'No items found.'
    },
    transaction: {
      error: {
        already_exist: 'Transaction already exist.',
        not_found: 'Transaction not found.'
      },
      form: {
        add: {
          multi: {
            title: 'Add scheduled transaction',
            alert:
              "Amount, account from and account to of already paid transactions won't change! Starting date, frequency and the transaction count can't be changed."
          },
          single: {
            title: 'Add Transaction'
          }
        },
        delete: {
          info: 'Transaction "{name}" deleted!',
          title: 'Are you sure?',
          warning: 'Transaction will be deleted permanently with every associated data.',
          all: {
            warning:
              'Transactions will be deleted permanently with every associated data. Only pending transactions will be removed. Paid transactions need to be deleted one by one.'
          }
        },
        edit: {
          multi: {
            title: 'Edit scheduled transaction'
          },
          single: {
            title: 'Edit Transaction'
          },
          amount: 'Amount',
          category: 'Category',
          description: 'Description',
          frequency: 'Frequency',
          repeat: 'How many times will be repeaded?',
          from: 'From',
          start: 'Start',
          status: 'Status',
          to: 'To',
          when: 'When'
        },
        saved: 'Transaction saved.',
        saveFailed: 'Saving the transaction failed 🧐',
        updated: 'Transaction updated'
      },
      tab: {
        all: {
          title: 'All'
        },
        byMonth: {
          title: 'By month'
        }
      }
    }
  }
};
