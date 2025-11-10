// Re-export all functions from the native database implementation
export {
  initDatabase,
  getDatabase,
  clearAllData,
  forceDatabaseReset,
  needsMigration3,
  exportDatabaseStats,
  cleanupInvalidMedications,
} from './database.native';
