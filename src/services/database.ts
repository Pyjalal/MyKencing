import * as SQLite from 'expo-sqlite';

// Database version for migrations
const DB_VERSION = 1;
const DB_NAME = 'mykencing.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

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
 * Clear all data (for testing or user data deletion)
 */
export async function clearAllData(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM doses;
    DELETE FROM medications;
    DELETE FROM vitals;
    DELETE FROM settings;
    DELETE FROM mims_cache;
  `);
  console.log('All data cleared');
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
