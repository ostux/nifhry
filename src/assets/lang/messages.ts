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
        edit: {
          accountType: 'Account type',
          name: 'Name',
          startingBalance: 'Starting balance',
          title: 'Edit Account'
        },
        delete: {
          title: 'Delete account',
          warning: 'Account will be deleted permanently with every associated data. (example: transactions)',
          info: 'Account "{name}" deleted!'
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
        edit: {
          name: 'Name',
          description: 'Description',
          parent: 'Parent',
          title: 'Edit Category'
        },
        delete: {
          title: 'Delete category',
          warning: 'Category will be deleted permanently with every associated data.',
          info: 'Category "{name}" deleted!'
        },
        saved: 'Category saved.',
        saveFailed: 'Saving the category failed 🧐',
        updated: 'Category updated'
      }
    },
    transaction: {
      tab: {
        all: {
          title: 'All'
        },
        byMonth: {
          title: 'By month'
        }
      }
    },
    button: {
      cancel: 'Cancel',
      choose: 'Choose file',
      confirm: 'Ok',
      edit: 'Edit',
      import: 'Import',
      save: 'Save'
    },
    menu: {
      account: {
        new: 'Create a new account'
      },
      archive: 'Archive',
      delete: 'Delete',
      edit: 'Edit'
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
      }
    }
  }
};
