/**
 * Forecasting & Prediction Constants
 *
 * These constants control the behavior of cash flow forecasting and prediction algorithms
 */

/**
 * Default window size for moving average smoothing
 * @default 3
 */
export const DEFAULT_SMOOTHING_WINDOW = 3;

/**
 * Number of months to compare when calculating inflation rate
 * @default 6
 */
export const INFLATION_COMPARISON_MONTHS = 6;

/**
 * Default inflation rate to use when insufficient historical data is available
 * @default 0.05 (5%)
 */
export const DEFAULT_INFLATION_RATE = 0.05;

/**
 * Maximum allowed inflation rate (cap to prevent unrealistic predictions)
 * @default 0.15 (15%)
 */
export const MAX_INFLATION_RATE = 0.15;

/**
 * Minimum number of months of historical data required for seasonality prediction
 * Set to 11 to allow seasonality even when current month is excluded
 * @default 11
 */
export const MIN_MONTHS_FOR_SEASONALITY = 11;

/**
 * Number of months to look back for year-over-year comparison in seasonality analysis
 * @default 12
 */
export const YEAR_LOOKBACK_MONTHS = 12;

/**
 * Window size for smoothing expense predictions
 * Larger values reduce impact of one-time large expenses (like loan payoffs)
 * @default 5
 */
export const EXPENSE_SMOOTHING_WINDOW = 3;
