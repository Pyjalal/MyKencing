import { Platform } from 'react-native';

// Platform-specific database implementations
let databaseModule: typeof import('./database.native') | typeof import('./database.web');

if (Platform.OS === 'web') {
  databaseModule = require('./database.web');
} else {
  databaseModule = require('./database.native');
}

/**
 * Initialize the database and run migrations
 */
export async function initDatabase(): Promise<any> {
  return databaseModule.initDatabase();
}

/**
 * Get the database instance
 */
export function getDatabase(): any {
  return databaseModule.getDatabase();
}

/**
 * Clear all data (for testing or user data deletion)
 */
export async function clearAllData(): Promise<void> {
  return databaseModule.clearAllData();
}

/**
 * Force database reset (for migration issues)
 */
export async function forceDatabaseReset(): Promise<void> {
  return databaseModule.forceDatabaseReset();
}

/**
 * Check if database needs migration 3
 */
export async function needsMigration3(): Promise<boolean> {
  return databaseModule.needsMigration3();
}

/**
 * Export database for debugging
 */
export async function exportDatabaseStats(): Promise<any> {
  return databaseModule.exportDatabaseStats();
}

/**
 * Clean up medications with invalid registration numbers
 */
export async function cleanupInvalidMedications(): Promise<number> {
  if (Platform.OS === 'web') {
    // Web doesn't need this cleanup
    return 0;
  }
  return databaseModule.cleanupInvalidMedications();
}
