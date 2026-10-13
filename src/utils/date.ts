import moment from 'moment';

/**
 * Get the start of a specific month relative to current month
 * @param monthsBack - Number of months to go back (0 = current month)
 */
export function getMonthStart(monthsBack: number = 0): Date {
  return moment().subtract(monthsBack, 'months').startOf('month').toDate();
}

/**
 * Get the end of a specific month relative to current month
 * @param monthsBack - Number of months to go back (0 = current month)
 */
export function getMonthEnd(monthsBack: number = 0): Date {
  return moment().subtract(monthsBack, 'months').endOf('month').toDate();
}

/**
 * Get month label for display (e.g., "Jan 2024")
 */
export function getMonthLabel(monthsBack: number = 0): string {
  return moment().subtract(monthsBack, 'months').format('MMM YYYY');
}

/**
 * Get short month label (e.g., "Jan")
 */
export function getShortMonthLabel(monthsBack: number = 0): string {
  const m = moment().subtract(monthsBack, 'months');
  return m.format(monthsBack === 0 ? 'MMM' : 'MMM YYYY');
}

/**
 * Get date range for last N complete months plus current month
 */
export function getLastMonthsRange(monthsBack: number): { start: Date; end: Date } {
  return {
    start: getMonthStart(monthsBack),
    end: getMonthEnd(0),
  };
}
