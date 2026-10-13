/**
 * Forecasting utilities for time series prediction
 * Uses simple linear regression to predict future trends
 */

import moment from 'moment';
import type { BudgetDoc } from '@/types';
import {
  DEFAULT_SMOOTHING_WINDOW,
  INFLATION_COMPARISON_MONTHS,
  DEFAULT_INFLATION_RATE,
  MAX_INFLATION_RATE,
  MIN_MONTHS_FOR_SEASONALITY,
  YEAR_LOOKBACK_MONTHS,
  EXPENSE_SMOOTHING_WINDOW,
} from '@/constants/forecasting';


/**
 * Round down to nearest 250
 */
function roundDownToNearest250(value: number): number {
  return Math.floor(value / 250) * 250;
}

/**
 * Calculate linear regression coefficients (slope and intercept)
 * Using least squares method: y = mx + b
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: data[0] || 0 };

  // x values are just indices: 0, 1, 2, 3, ...
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i] || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  // Calculate slope (m) and intercept (b)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Predict future values using linear regression
 */
function predictValues(
  historicalData: number[],
  futurePoints: number,
  constraint?: (value: number) => number
): number[] {
  const { slope, intercept } = linearRegression(historicalData);
  const predictions: number[] = [];

  for (let i = 0; i < futurePoints; i++) {
    const x = historicalData.length + i;
    let predicted = slope * x + intercept;

    // Apply constraint if provided
    if (constraint) {
      predicted = constraint(predicted);
    }

    predictions.push(predicted);
  }

  return predictions;
}

/**
 * Generate future month labels
 */
function generateFutureLabels(lastLabel: string, count: number): string[] {
  const labels: string[] = [];

  // Try to parse the last label as a date format
  // Common formats: "Jan 2024", "2024-01", "Jan", etc.
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Simple approach: if last label contains a month name, continue the sequence
  const monthMatch = monthNames.findIndex(m => lastLabel.includes(m));

  if (monthMatch !== -1) {
    // Extract year if present
    const yearMatch = lastLabel.match(/\d{4}/);
    let currentYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    let currentMonth = monthMatch;

    for (let i = 0; i < count; i++) {
      currentMonth++;
      if (currentMonth >= 12) {
        currentMonth = 0;
        currentYear++;
      }

      labels.push(`${monthNames[currentMonth]} ${currentYear}`);
    }
  } else {
    // Fallback: just number them
    for (let i = 1; i <= count; i++) {
      labels.push(`+${i}m`);
    }
  }

  return labels;
}

/**
 * Predict income or expenses from budget data
 * Returns array with budget values where available, null where missing
 * This allows mixing budget data with fallback predictions
 */
function predictFromBudgets(
  budgets: Map<string, BudgetDoc>,
  startPeriod: string,
  futureMonths: number,
  type: 'income' | 'expense'
): (number | null)[] | null {
  const predictions: (number | null)[] = [];

  // Parse the start period to get starting month
  const startMoment = moment(startPeriod, 'YYYY-MM');
  if (!startMoment.isValid()) {
    return null; // Invalid start period
  }

  // Iterate through future months
  for (let i = 0; i < futureMonths; i++) {
    const period = startMoment.clone().add(i, 'months').format('YYYY-MM');
    const budgetDoc = budgets.get(period);

    // If no budget for this month OR budget is empty, add null (will be filled by fallback)
    if (!budgetDoc || Object.keys(budgetDoc).length === 0) {
      predictions.push(null);
      continue;
    }

    // Sum all category budgets of the specified type
    let totalBudget = 0;
    Object.values(budgetDoc).forEach((categoryBudget) => {
      if (categoryBudget.type === type) {
        totalBudget += categoryBudget.amount;
      }
    });

    predictions.push(totalBudget);
  }

  return predictions;
}

/**
 * Extract liability payment amounts from budget data
 * Returns array with budget values where available, null where missing
 * This allows mixing budget data with fallback predictions
 */
function predictLiabilityPayments(
  budgets: Map<string, BudgetDoc>,
  startPeriod: string,
  futureMonths: number,
  liabilityPaymentCategories: string[]
): (number | null)[] | null {
  const predictions: (number | null)[] = [];

  // Parse the start period to get starting month
  const startMoment = moment(startPeriod, 'YYYY-MM');
  if (!startMoment.isValid()) {
    return null; // Invalid start period
  }

  // Iterate through future months
  for (let i = 0; i < futureMonths; i++) {
    const period = startMoment.clone().add(i, 'months').format('YYYY-MM');
    const budgetDoc = budgets.get(period);

    // If no budget for this month OR budget is empty, add null (will be filled by fallback)
    if (!budgetDoc || Object.keys(budgetDoc).length === 0) {
      predictions.push(null);
      continue;
    }

    // Sum budgets for liability payment categories (expense type only)
    let totalPayment = 0;
    Object.entries(budgetDoc).forEach(([categoryId, categoryBudget]) => {
      if (
        categoryBudget.type === 'expense' &&
        liabilityPaymentCategories.includes(categoryId)
      ) {
        totalPayment += categoryBudget.amount;
      }
    });

    predictions.push(totalPayment);
  }

  return predictions;
}

/**
 * Detect and cap outliers in expense data
 * Outliers are values that exceed 2.5 standard deviations from the median
 * This helps handle one-time large expenses (like loan payoffs) that shouldn't affect seasonal patterns
 */
function capOutliers(data: number[]): number[] {
  if (data.length < 3) return [...data]; // Need at least 3 points

  // Calculate median (more robust than mean for outlier detection)
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;

  // Calculate MAD (Median Absolute Deviation) - robust measure of spread
  const deviations = data.map(val => Math.abs(val - median));
  const sortedDeviations = [...deviations].sort((a, b) => a - b);
  const madMid = Math.floor(sortedDeviations.length / 2);
  const mad = sortedDeviations.length % 2 === 0
    ? (sortedDeviations[madMid - 1]! + sortedDeviations[madMid]!) / 2
    : sortedDeviations[madMid]!;

  // Modified Z-score threshold (2.5 is a common threshold for outliers)
  // Using MAD makes this more robust to extreme values than standard deviation
  const threshold = 2.5;
  const madScaleFactor = 1.4826; // Makes MAD comparable to standard deviation

  return data.map(val => {
    const modifiedZScore = Math.abs(val - median) / (mad * madScaleFactor);
    if (modifiedZScore > threshold) {
      // Cap outlier at threshold distance from median
      return median + (val > median ? 1 : -1) * threshold * mad * madScaleFactor;
    }
    return val;
  });
}

/**
 * Apply moving average smoothing to reduce impact of volatile data points
 * Uses a sliding window to average neighboring values
 */
function applyMovingAverage(data: number[], windowSize: number = DEFAULT_SMOOTHING_WINDOW): number[] {
  if (data.length === 0) return [];
  if (windowSize <= 1) return [...data]; // No smoothing needed

  const smoothed: number[] = [];

  for (let i = 0; i < data.length; i++) {
    // Determine window bounds (handle edges)
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));

    // Calculate average of values in window
    const window = data.slice(start, end);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;

    smoothed.push(avg);
  }

  return smoothed;
}

/**
 * Calculate inflation rate from historical data
 * Compares recent months to earlier months to detect price increases
 */
function calculateInflationRate(
  historicalData: number[],
  monthsToCompare: number = INFLATION_COMPARISON_MONTHS
): number {
  // Need at least 12 months to compare N recent vs N older
  if (historicalData.length < monthsToCompare * 2) {
    return DEFAULT_INFLATION_RATE;
  }

  // Calculate average of last N months
  const recentMonths = historicalData.slice(-monthsToCompare);
  const recentAvg = recentMonths.reduce((sum, val) => sum + val, 0) / monthsToCompare;

  // Calculate average of N months before that
  const olderMonths = historicalData.slice(-monthsToCompare * 2, -monthsToCompare);
  const olderAvg = olderMonths.reduce((sum, val) => sum + val, 0) / monthsToCompare;

  // Avoid division by zero
  if (olderAvg === 0) {
    return DEFAULT_INFLATION_RATE;
  }

  // Calculate percentage change
  const inflationRate = (recentAvg - olderAvg) / olderAvg;

  // Clamp to reasonable range (0% to MAX_INFLATION_RATE)
  // Negative inflation (deflation) defaults to 0%
  // Above MAX_INFLATION_RATE is likely data anomaly, cap it
  return Math.max(0, Math.min(MAX_INFLATION_RATE, inflationRate));
}

/**
 * Predict expenses using last year's seasonal pattern with inflation adjustment
 */
function predictExpensesWithSeasonality(
  historicalExpenses: number[],
  futureMonths: number,
  inflationRate = DEFAULT_INFLATION_RATE
): number[] {
  const predictions: number[] = [];

  // If we have less than a year of data, fall back to using average
  if (historicalExpenses.length < MIN_MONTHS_FOR_SEASONALITY) {
    const avgExpense = historicalExpenses.reduce((sum, val) => sum + val, 0) / historicalExpenses.length;
    const adjustedAvg = avgExpense * (1 + inflationRate);
    return Array(futureMonths).fill(adjustedAvg);
  }

  // Cap outliers first (handles one-time large expenses like loan payoffs)
  const cappedExpenses = capOutliers(historicalExpenses);

  // Apply moving average to smooth volatile data (reduces impact of one-off large expenses)
  const smoothedExpenses = applyMovingAverage(cappedExpenses, EXPENSE_SMOOTHING_WINDOW);

  // Use last year's pattern with inflation adjustment
  for (let i = 0; i < futureMonths; i++) {
    // Calculate which month of the year we're predicting (0-11)
    // We look at the pattern from the same month last year
    const monthInCycle = i % YEAR_LOOKBACK_MONTHS;

    // Calculate the index in historical data
    // We want to look back exactly 12 months, but if we don't have 12 months,
    // we use the corresponding month from what we have
    let historicalIndex: number;

    if (smoothedExpenses.length >= YEAR_LOOKBACK_MONTHS) {
      // We have a full year or more: use the month from 12 months ago
      historicalIndex = smoothedExpenses.length - YEAR_LOOKBACK_MONTHS + monthInCycle;
    } else {
      // We have less than a year: use the corresponding month from what we have
      // This wraps around if necessary
      historicalIndex = monthInCycle % smoothedExpenses.length;
    }

    if (historicalIndex >= 0 && historicalIndex < smoothedExpenses.length) {
      // Apply inflation to last year's expense for this month
      const lastYearExpense = smoothedExpenses[historicalIndex] || 0;
      const predicted = lastYearExpense * (1 + inflationRate);
      predictions.push(predicted);
    } else {
      // Fallback: use average if we don't have data for this month
      const avgExpense = smoothedExpenses.reduce((sum, val) => sum + val, 0) / smoothedExpenses.length;
      const predicted = avgExpense * (1 + inflationRate);
      predictions.push(predicted);
    }
  }

  return predictions;
}

/**
 * Forecast cash flow data using seasonal patterns and inflation
 */
export interface ForecastResult {
  labels: string[];
  income: number[];
  expenses: number[];
  accessible?: number[];
  liabilities?: number[];
  netWorth?: number[];
  accessibleSavings?: number[];
}

export function forecastCashFlow(
  historicalData: {
    labels: string[];
    income: number[];
    expenses: number[];
    accessible?: number[];
    liabilities?: number[];
    netWorth?: number[];
    accessibleSavings?: number[];
  },
  futureMonths: number,
  excludeCurrentMonth = true,
  inflationRate?: number,
  budgetData?: Map<string, BudgetDoc>,
  liabilityPaymentCategories?: string[],
  currentSavingsBalance?: number
): ForecastResult {
  if (futureMonths <= 0 || historicalData.labels.length === 0) {
    return {
      labels: [],
      income: [],
      expenses: [],
    };
  }

  // Exclude current (incomplete) month from calculation if requested
  const dataLength = historicalData.labels.length;
  const regressionEndIndex = excludeCurrentMonth && dataLength > 1 ? dataLength - 1 : dataLength;

  const lastLabel = historicalData.labels[historicalData.labels.length - 1] || '';
  const futureLabels = generateFutureLabels(lastLabel, futureMonths);

  // Use only complete months for calculation
  const completeIncome = historicalData.income.slice(0, regressionEndIndex);
  const completeExpenses = historicalData.expenses.slice(0, regressionEndIndex);

  // Calculate the start period for predictions (next month after last historical data)
  const lastLabelMoment = moment(lastLabel, 'MMM YYYY');
  const predictionStartPeriod = lastLabelMoment.isValid()
    ? lastLabelMoment.add(1, 'month').format('YYYY-MM')
    : moment().add(1, 'month').format('YYYY-MM');

  // INCOME PREDICTION
  // Mix budget data with fallback (constant last month value)
  let predictedIncome: number[];
  const lastIncome = completeIncome[completeIncome.length - 1] || 0;

  if (budgetData) {
    const budgetBasedIncome = predictFromBudgets(budgetData, predictionStartPeriod, futureMonths, 'income');
    if (budgetBasedIncome !== null) {
      // Fill nulls with fallback (last month's income)
      predictedIncome = budgetBasedIncome.map(value => value !== null ? value : lastIncome);
    } else {
      // Fallback: constant at last full month's value
      predictedIncome = Array(futureMonths).fill(lastIncome);
    }
  } else {
    // No budget data: constant at last full month's value
    predictedIncome = Array(futureMonths).fill(lastIncome);
  }

  // EXPENSE PREDICTION
  // Mix budget data with fallback (seasonal pattern with inflation)
  let predictedExpenses: number[];
  const calculatedInflation = inflationRate ?? calculateInflationRate(completeExpenses);
  const seasonalFallback = predictExpensesWithSeasonality(completeExpenses, futureMonths, calculatedInflation);

  if (budgetData) {
    const budgetBasedExpenses = predictFromBudgets(budgetData, predictionStartPeriod, futureMonths, 'expense');
    if (budgetBasedExpenses !== null) {
      // Fill nulls with seasonal fallback
      predictedExpenses = budgetBasedExpenses.map((value, index) => {
        const result = value !== null ? value : seasonalFallback[index] || 0;

        return result;
      });
    } else {
      // Fallback: seasonal pattern with inflation
      predictedExpenses = seasonalFallback;
    }
  } else {
    // No budget data: seasonal pattern with inflation
    predictedExpenses = seasonalFallback;
  }

  const result: ForecastResult = {
    labels: futureLabels,
    income: predictedIncome,
    expenses: predictedExpenses,
  };

  // Predict accessible amount if provided
  if (historicalData.accessible) {
    const completeAccessible = historicalData.accessible.slice(0, regressionEndIndex);

    // Always use incremental calculation if we have income and expense predictions
    if (predictedIncome && predictedExpenses) {
      // Start from the actual last known accessible amount (not the last complete month)
      const startingAccessible = historicalData.accessible[historicalData.accessible.length - 1] || 0;
      const predictedAccessible: number[] = [];
      let currentAccessible = startingAccessible;

      // Each month: add income, subtract expenses (expenses already include liability payments)
      for (let i = 0; i < futureMonths; i++) {
        const income = predictedIncome[i] || 0;
        const expenses = predictedExpenses[i] || 0;
        currentAccessible = currentAccessible + income - expenses;
        predictedAccessible.push(currentAccessible);
      }

      result.accessible = predictedAccessible;
    } else {
      // No income/expense predictions: use linear regression
      result.accessible = predictValues(completeAccessible, futureMonths);
    }
  }

  // Predict liabilities if provided
  if (historicalData.liabilities) {
    const completeLiabilities = historicalData.liabilities.slice(0, regressionEndIndex);

    // Try to use budget-based liability payments if available
    if (budgetData && liabilityPaymentCategories && liabilityPaymentCategories.length > 0) {
      const liabilityPayments = predictLiabilityPayments(
        budgetData,
        predictionStartPeriod,
        futureMonths,
        liabilityPaymentCategories
      );

      if (liabilityPayments !== null) {
        // Calculate average monthly decrease from regression (to use as default payment)
        const { slope } = linearRegression(completeLiabilities);
        const defaultPayment = Math.max(0, -slope); // Negative slope means decrease

        // Start from the actual last known liability amount
        const startingLiability = historicalData.liabilities[historicalData.liabilities.length - 1] || 0;
        const predictedLiabilities: number[] = [];
        let currentLiability = startingLiability;

        // Subtract payments month by month, using budget where available or default payment
        for (let i = 0; i < futureMonths; i++) {
          const payment = liabilityPayments[i] !== null ? liabilityPayments[i]! : defaultPayment;
          currentLiability = Math.max(0, currentLiability - payment);
          predictedLiabilities.push(currentLiability);
        }

        result.liabilities = predictedLiabilities;
      } else {
        // Fallback to linear regression if no budget data structure
        result.liabilities = predictValues(
          completeLiabilities,
          futureMonths,
          (value) => Math.max(0, value) // Liabilities cannot be less than 0
        );
      }
    } else {
      // No budget data or liability payment categories: use linear regression
      result.liabilities = predictValues(
        completeLiabilities,
        futureMonths,
        (value) => Math.max(0, value) // Liabilities cannot be less than 0
      );
    }
  }

  // Predict net worth if provided
  if (historicalData.netWorth) {
    const completeNetWorth = historicalData.netWorth.slice(0, regressionEndIndex);

    // If we have both accessible and liabilities predictions, calculate net worth from them
    // Net Worth = Accessible - Liabilities
    if (result.accessible && result.liabilities) {
      const predictedNetWorth: number[] = [];
      for (let i = 0; i < futureMonths; i++) {
        const accessible = result.accessible[i] || 0;
        const liabilities = result.liabilities[i] || 0;
        predictedNetWorth.push(accessible - liabilities);
      }
      result.netWorth = predictedNetWorth;
    } else if (result.accessible && !result.liabilities) {
      // If we only have accessible (no liabilities tracked), net worth = accessible
      result.netWorth = [...result.accessible];
    } else if (predictedIncome && predictedExpenses) {
      // Calculate net worth from income/expense flow if accessible not available
      const startingNetWorth = historicalData.netWorth[historicalData.netWorth.length - 1] || 0;
      const predictedNetWorth: number[] = [];
      let currentNetWorth = startingNetWorth;

      // Each month: add surplus/deficit (income - expenses)
      for (let i = 0; i < futureMonths; i++) {
        const income = predictedIncome[i] || 0;
        const expenses = predictedExpenses[i] || 0;
        currentNetWorth = currentNetWorth + income - expenses;
        predictedNetWorth.push(currentNetWorth);
      }

      result.netWorth = predictedNetWorth;
    } else {
      // No income/expense predictions: use linear regression
      result.netWorth = predictValues(completeNetWorth, futureMonths);
    }
  }

  // Predict accessible savings if provided
  // Each month: previousSavings + roundDown250(income - expenses)
  if (historicalData.accessibleSavings) {
    const predictedAccessibleSavings: number[] = [];
    let currentSavings = currentSavingsBalance ?? 0;

    for (let i = 0; i < futureMonths; i++) {
      const income = predictedIncome[i] || 0;
      const expenses = predictedExpenses[i] || 0;
      currentSavings = currentSavings + roundDownToNearest250(income - expenses);
      predictedAccessibleSavings.push(currentSavings);
    }

    result.accessibleSavings = predictedAccessibleSavings;
  }

  return result;
}
