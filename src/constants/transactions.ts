/**
 * Transaction Management Constants
 *
 * These constants control transaction queries, batch operations, and matching logic
 */

/**
 * Maximum number of transactions to fetch in a single query
 * @default 100
 */
export const TRANSACTION_QUERY_LIMIT = 100;

/**
 * Number of operations allowed per Firestore batch write
 * Firestore has a hard limit of 500 operations per batch
 * @default 500
 */
export const FIRESTORE_BATCH_SIZE = 500;

/**
 * Number of days tolerance when matching opposite transactions during import
 * Transactions within ±N days with reversed amounts may be automatically linked
 * @default 5
 */
export const OPPOSITE_TRANSACTION_DATE_TOLERANCE_DAYS = 5;
