/**
 * Dashboard Display Constants
 *
 * These constants control the display and data range for dashboard components
 */

/**
 * Number of months to display in the cash flow chart (including current month)
 * @default 12
 */
export const CASH_FLOW_MONTHS = 7;

/**
 * Number of months to analyze for category expense statistics
 * @default 3
 */
export const CATEGORY_STAT_MONTHS = 5;

/**
 * Number of months visible at once in the monthly summary cards
 * @default 4
 */
export const NUM_VISIBLE_MONTHS = 4;

/**
 * Number of budget months to display at once in the budget summary section
 * @default 2
 */
export const NUM_VISIBLE_BUDGET_MONTHS = 1;

/**
 * Number of months ahead to show cash flow predictions in the chart
 * @default 12
 */
export const CHART_PREDICTION_MONTHS = 6;

/**
 * Number of months ahead to show cash flow predictions in the table
 * @default 6
 */
export const TABLE_PREDICTION_MONTHS = 6;

/**
 * Number of recent months to display in the cash flow table
 * @default 3
 */
export const RECENT_CASH_FLOW_MONTHS = 3;

/**
 * Financial Health Thresholds for Cash Flow Table
 * These thresholds determine the color indicators in the cash flow table
 */
export const FINANCIAL_THRESHOLDS = {
  /**
   * Red indicator if accessible amount < (income × this threshold)
   * @default 0.5
   */
  ACCESSIBLE_LOW: 0.5,

  /**
   * Green indicator if accessible amount >= (income × this threshold)
   * @default 1.5
   */
  ACCESSIBLE_HIGH: 1.5,

  /**
   * Green indicator if expenses < (income × this threshold)
   * @default 0.5
   */
  EXPENSE_LOW: 0.5,

  /**
   * Red indicator if expenses >= (income × this threshold)
   * @default 0.9
   */
  EXPENSE_HIGH: 0.9,

  /**
   * Blue indicator if accessible savings >= (income × this threshold)
   * @default 2.0
   */
  ACCESSIBLE_SAVINGS: 2.0,
} as const;
