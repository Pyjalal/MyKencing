import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Database version for migrations
const DB_VERSION = 3;
const DB_NAME = 'mykencing.db';

let db: SQLite.SQLiteDatabase | null = null;

function createInMemoryDatabase(): SQLite.SQLiteDatabase {
  console.warn('[database] Using in-memory database stub on web. Data will not persist.');

  const noop = async () => {};
  const emptyArray = async <T>() => [] as T[];
  const nullValue = async <T>() => null as T | null;

  // The object only implements the methods we call in the app; casting to satisfy typings.
  return {
    execAsync: noop,
    runAsync: async () => ({ changes: { affectedRows: 0, insertId: null } }),
    getAllAsync: emptyArray,
    getFirstAsync: nullValue,
    closeAsync: noop,
  } as unknown as SQLite.SQLiteDatabase;
}

/**
 * Initialize the database and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  if (Platform.OS === 'web') {
    db = createInMemoryDatabase();
    return db;
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run migrations
  await runMigrations(db);

  return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Run database migrations
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations table if it doesn't exist
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM migrations'
  );
  const currentVersion = result?.version || 0;

  // Apply migrations
  if (currentVersion < 1) {
    await applyMigration1(database);
  }
  if (currentVersion < 2) {
    await applyMigration2(database);
  }
  if (currentVersion < 3) {
    await applyMigration3(database);
  }
}

/**
 * Migration 1: Initial schema
 */
async function applyMigration1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- MIMS cache table (local copy of medicine data from MIMS)
    CREATE TABLE IF NOT EXISTS mims_cache (
      id TEXT PRIMARY KEY,
      generic_name TEXT NOT NULL,
      brand_name TEXT,
      strength TEXT,
      dosage_form TEXT,
      instructions TEXT,
      timing TEXT,
      food_instructions TEXT,
      warnings TEXT,
      side_effects TEXT,
      contraindications TEXT,
      drug_interactions TEXT,
      food_interactions TEXT,
      source TEXT NOT NULL DEFAULT 'MIMS',
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Medications table (user's active prescriptions)
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      mims_id TEXT NOT NULL,
      user_dosage TEXT NOT NULL,
      frequency INTEGER NOT NULL,
      times TEXT NOT NULL, -- JSON array of time strings
      with_food INTEGER NOT NULL DEFAULT 0, -- 0=no, 1=yes, 2=after food
      start_date TEXT NOT NULL,
      end_date TEXT,
      refill_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mims_id) REFERENCES mims_cache(id) ON DELETE CASCADE
    );

    -- Doses table (adherence log)
    CREATE TABLE IF NOT EXISTS doses (
      id TEXT PRIMARY KEY,
      medication_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'taken', 'skipped', 'late', 'missed')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );

    -- Vitals table (BP, glucose, weight)
    CREATE TABLE IF NOT EXISTS vitals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('blood_pressure', 'glucose', 'weight')),
      systolic INTEGER, -- For blood pressure
      diastolic INTEGER, -- For blood pressure
      value REAL, -- For glucose and weight
      unit TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Settings table (app preferences and consent)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
    CREATE INDEX IF NOT EXISTS idx_medications_start_date ON medications(start_date);
    CREATE INDEX IF NOT EXISTS idx_doses_medication_id ON doses(medication_id);
    CREATE INDEX IF NOT EXISTS idx_doses_scheduled_time ON doses(scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_doses_status ON doses(status);
    CREATE INDEX IF NOT EXISTS idx_vitals_type ON vitals(type);
    CREATE INDEX IF NOT EXISTS idx_vitals_measured_at ON vitals(measured_at);
    CREATE INDEX IF NOT EXISTS idx_mims_generic_name ON mims_cache(generic_name);
    CREATE INDEX IF NOT EXISTS idx_mims_brand_name ON mims_cache(brand_name);
  `);

  // Insert migration record
  await database.runAsync(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [1, new Date().toISOString()]
  );

  console.log('Migration 1 applied successfully');
}

/**
 * Migration 2: Analytics events table
 */
async function applyMigration2(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Events table for privacy-safe analytics (no PHI)
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      properties TEXT,
      created_at TEXT NOT NULL
    );

    -- Indexes for query performance
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  `);

  await database.runAsync(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [2, new Date().toISOString()]
  );

  console.log('Migration 2 applied successfully');
}

/**
 * Migration 3: Change from mims_id to registration_no
 * Move from local MIMS cache to API-only medicine data
 */
async function applyMigration3(database: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[database.native] Migration 3: Dropping FK constraint and adding registration_no');

  // First, check if we already migrated
  try {
    const result = await database.getAllAsync(`PRAGMA table_info(medications)`);
    const hasRegistrationNo = result.some((col: any) => col.name === 'registration_no');

    if (hasRegistrationNo) {
      console.log('[database.native] Migration 3 already applied');
      return;
    }
  } catch (error) {
    console.warn('[database.native] Could not check table info:', error);
  }

  try {
    await database.execAsync('BEGIN TRANSACTION;');
    // Disable foreign key checks temporarily
    await database.execAsync('PRAGMA foreign_keys = OFF;');

    // Create new table without foreign key
    await database.execAsync(`
      CREATE TABLE medications_new (
        id TEXT PRIMARY KEY,
        mims_id TEXT, -- Nullable, no FK constraint
        registration_no TEXT,
        user_dosage TEXT NOT NULL,
        frequency INTEGER NOT NULL,
        times TEXT NOT NULL,
        with_food INTEGER NOT NULL DEFAULT 0,
        start_date TEXT NOT NULL,
        end_date TEXT,
        refill_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Copy all existing data, setting registration_no = mims_id for backward compatibility
    await database.execAsync(`
      INSERT INTO medications_new (
        id, mims_id, registration_no, user_dosage, frequency, times, with_food,
        start_date, end_date, refill_date, is_active, notes, created_at, updated_at
      )
      SELECT
        id, mims_id, mims_id, user_dosage, frequency, times, with_food,
        start_date, end_date, refill_date, is_active, notes, created_at, updated_at
      FROM medications;
    `);

    // Drop old table and rename new one
    await database.execAsync(`
      DROP TABLE medications;
      ALTER TABLE medications_new RENAME TO medications;
    `);

    // Recreate indexes
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
      CREATE INDEX IF NOT EXISTS idx_medications_start_date ON medications(start_date);
      CREATE INDEX IF NOT EXISTS idx_medications_registration_no ON medications(registration_no);
    `);
    
    // Re-enable foreign key checks
    await database.execAsync('PRAGMA foreign_keys = ON;');

    await database.execAsync('COMMIT;');
    console.log('[database.native] Migration 3 completed successfully');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    console.error('[database.native] Migration 3 failed:', error);
    // Re-enable foreign key checks even if migration fails
    await database.execAsync('PRAGMA foreign_keys = ON;');
    throw error;
  }

  // Insert migration record
  await database.runAsync(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [3, new Date().toISOString()]
  );

  console.log('Migration 3 applied successfully');
}

/**
 * Clear all data (for testing or user data deletion)
 */
export async function clearAllData(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM doses;
    DELETE FROM medications;
    DELETE FROM vitals;
    DELETE FROM settings;
    DELETE FROM events;
  `);
  console.log('All data cleared');
}

/**
 * Force database reset (for migration issues)
 * Call this if you need to run migrations on existing data
 */
export async function forceDatabaseReset(): Promise<void> {
  console.log('[database.native] Force resetting database...');

  // Close current connection
  if (db) {
    await db.closeAsync();
    db = null;
  }

  // Delete database file (SQLite only)
  const dbPath = `mykencing.db`;
  try {
    await SQLite.deleteDatabaseAsync(dbPath);
    console.log('[database.native] Database file deleted');
  } catch (error) {
    console.warn('[database.native] Could not delete database file:', error);
  }

  // Reinitialize
  await initDatabase();
  console.log('[database.native] Database reset complete');
}

/**
 * Check if database needs migration 3
 * Returns true if migration 3 hasn't run yet
 */
export async function needsMigration3(): Promise<boolean> {
  try {
    const database = getDatabase();
    const result = await database.getAllAsync(`PRAGMA table_info(medications)`);
    const hasRegistrationNo = result.some((col: any) => col.name === 'registration_no');
    return !hasRegistrationNo;
  } catch (error) {
    console.warn('[database.native] Could not check migration status:', error);
    return true; // Assume migration needed if we can't check
  }
}

/**
 * Export database for debugging
 */
export async function exportDatabaseStats(): Promise<any> {
  const database = getDatabase();

  const [meds, doses, vitals, mimsCount] = await Promise.all([
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM medications'),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM doses'),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vitals'),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM mims_cache'),
  ]);

  return {
    medications: meds?.count || 0,
    doses: doses?.count || 0,
    vitals: vitals?.count || 0,
    mimsCache: mimsCount?.count || 0,
  };
}

/**
 * Clean up medications with invalid registration numbers
 * This removes test/mock data that causes API errors
 * @returns Number of medications deactivated
 */
export async function cleanupInvalidMedications(): Promise<number> {
  const database = getDatabase();

  try {
    // Deactivate (don't delete) medications with invalid registration numbers
    // This preserves historical data while preventing API errors
    const result = await database.runAsync(`
      UPDATE medications
      SET is_active = 0,
          notes = CASE
            WHEN notes IS NULL OR notes = '' THEN 'Auto-disabled: Invalid registration number'
            ELSE notes || ' [Auto-disabled: Invalid registration number]'
          END,
          updated_at = datetime('now')
      WHERE is_active = 1
        AND (
          registration_no LIKE 'mims-%'
          OR registration_no LIKE 'custom_%'
          OR registration_no LIKE 'med_%'
          OR registration_no LIKE '%sample%'
          OR registration_no LIKE '%test%'
          OR registration_no LIKE '%mock%'
          OR registration_no = 'Loading...'
          OR registration_no = 'Unknown'
          OR registration_no = ''
          OR registration_no IS NULL
          OR LENGTH(registration_no) < 6
        )
    `);

    const changedCount = result.changes;

    if (changedCount > 0) {
      console.log(`✓ Cleaned up ${changedCount} invalid medication(s)`);
    } else {
      console.log('✓ No invalid medications found');
    }

    return changedCount;
  } catch (error) {
    console.error('Error cleaning up invalid medications:', error);
    return 0;
  }
}
