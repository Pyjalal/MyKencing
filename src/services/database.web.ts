import initSqlJs, { Database } from 'sql.js';
import { getDatabaseKey } from './encryption';

const DB_VERSION = 3;
const DB_NAME = 'mykencing_web';
const INDEXED_DB_KEY = 'mykencing_encrypted_db';

let db: Database | null = null;
let SQL: any = null;
let persistIntervalId: NodeJS.Timeout | null = null;

// IndexedDB helpers for persistent storage
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('database')) {
        db.createObjectStore('database');
      }
    };
  });
}

async function loadEncryptedDatabase(): Promise<Uint8Array | null> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(['database'], 'readonly');
    const store = transaction.objectStore('database');
    const request = store.get(INDEXED_DB_KEY);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function saveEncryptedDatabase(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(['database'], 'readwrite');
    const store = transaction.objectStore('database');
    const request = store.put(data, INDEXED_DB_KEY);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Encryption helpers using WebCrypto
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data as BufferSource
  );

  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return result;
}

async function decryptData(encryptedData: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const data = encryptedData.slice(28);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new Uint8Array(decrypted);
}

async function persistDatabase(): Promise<void> {
  if (!db) return;
  
  const key = await getDatabaseKey();
  if (!key) {
    console.warn('[database.web] No encryption key available, skipping persist');
    return;
  }

  try {
    const dbData = db.export();
    const encrypted = await encryptData(dbData, key);
    await saveEncryptedDatabase(encrypted);
    console.log('[database.web] Database persisted and encrypted');
  } catch (error) {
    console.error('[database.web] Error persisting database:', error);
  }
}

/**
 * Initialize the web database using sql.js with encryption
 */
export async function initDatabase(): Promise<any> {
  if (db) return db;

  console.log('[database.web] Initializing sql.js database with encryption');

  // Load sql.js library
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }

  // Try to load existing encrypted database
  const key = await getDatabaseKey();
  const encryptedData = await loadEncryptedDatabase();

  if (encryptedData && key) {
    try {
      const decrypted = await decryptData(encryptedData, key);
      db = new SQL.Database(decrypted);
      console.log('[database.web] Loaded existing encrypted database');
    } catch (error) {
      console.error('[database.web] Failed to decrypt database, creating new one:', error);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('[database.web] Created new database');
  }

  // Run migrations (db is guaranteed non-null at this point)
  await runMigrations(db!);

  // Auto-persist on changes (clear previous interval if exists)
  if (persistIntervalId) {
    clearInterval(persistIntervalId);
  }
  persistIntervalId = setInterval(() => persistDatabase(), 5000); // Persist every 5 seconds

  return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): any {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return {
    runAsync: async (sql: string, params?: any[]) => {
      db!.run(sql, params);
      await persistDatabase();
      return { changes: { affectedRows: db!.getRowsModified(), insertId: null } };
    },
    getAllAsync: async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
      const stmt = db!.prepare(sql);
      if (params) stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    },
    getFirstAsync: async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
      const stmt = db!.prepare(sql);
      if (params) stmt.bind(params);
      let result: T | null = null;
      if (stmt.step()) {
        result = stmt.getAsObject() as T;
      }
      stmt.free();
      return result;
    },
    execAsync: async (sql: string) => {
      db!.exec(sql);
      await persistDatabase();
    },
  };
}

/**
 * Run database migrations
 */
async function runMigrations(database: Database): Promise<void> {
  // Create migrations table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const stmt = database.prepare('SELECT MAX(version) as version FROM migrations');
  stmt.step();
  const result = stmt.getAsObject() as { version: number | null };
  const currentVersion = result?.version || 0;
  stmt.free();

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

  await persistDatabase();
}

/**
 * Migration 1: Initial schema
 */
async function applyMigration1(database: Database): Promise<void> {
  database.exec(`
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
      times TEXT NOT NULL,
      with_food INTEGER NOT NULL DEFAULT 0,
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
      systolic INTEGER,
      diastolic INTEGER,
      value REAL,
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

  database.run(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [1, new Date().toISOString()]
  );

  console.log('[database.web] Migration 1 applied successfully');
}

/**
 * Migration 2: Analytics events table
 */
async function applyMigration2(database: Database): Promise<void> {
  database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      properties TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  `);

  database.run(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [2, new Date().toISOString()]
  );

  console.log('[database.web] Migration 2 applied successfully');
}

/**
 * Migration 3: Change from mims_id to registration_no
 * Move from local MIMS cache to API-only medicine data
 */
function applyMigration3(database: Database): void {
  console.log('[database.web] Migration 3: Dropping FK constraint and adding registration_no');

  // First, check if we already migrated
  try {
    const result = database.exec("PRAGMA table_info(medications)");
    const columns = result[0]?.values || [];
    const hasRegistrationNo = columns.some((col: any[]) => col[1] === 'registration_no');

    if (hasRegistrationNo) {
      console.log('[database.web] Migration 3 already applied');
      return;
    }
  } catch (error) {
    console.warn('[database.web] Could not check table info:', error);
  }

  // Create new table without foreign key
  database.exec(`
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Copy all existing data, setting registration_no = mims_id for backward compatibility
  database.exec(`
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
  database.exec(`
    DROP TABLE medications;
    ALTER TABLE medications_new RENAME TO medications;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
    CREATE INDEX IF NOT EXISTS idx_medications_start_date ON medications(start_date);
    CREATE INDEX IF NOT EXISTS idx_medications_registration_no ON medications(registration_no);
  `);

  console.log('[database.web] Migration 3 completed successfully');

  database.run(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    [3, new Date().toISOString()]
  );

  console.log('[database.web] Migration 3 applied successfully');
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
  console.log('[database.web] All data cleared');
}

/**
 * Force database reset (for migration issues)
 * Call this if you need to run migrations on existing data
 */
export async function forceDatabaseReset(): Promise<void> {
  console.log('[database.web] Force resetting database...');

  // Clear IndexedDB
  try {
    const idb = await openIndexedDB();
    const transaction = idb.transaction(['database'], 'readwrite');
    const store = transaction.objectStore('database');
    await store.clear();
    console.log('[database.web] IndexedDB cleared');
  } catch (error) {
    console.warn('[database.web] Could not clear IndexedDB:', error);
  }

  // Force re-run migrations by clearing db instance
  db = null;

  // Reinitialize
  await initDatabase();
  console.log('[database.web] Database reset complete');
}

/**
 * Check if database needs migration 3
 * Returns true if migration 3 hasn't run yet
 */
export async function needsMigration3(): Promise<boolean> {
  try {
    const database = getDatabase();
    const result = database.exec("PRAGMA table_info(medications)");
    const columns = result[0]?.values || [];
    const hasRegistrationNo = columns.some((col: any[]) => col[1] === 'registration_no');
    return !hasRegistrationNo;
  } catch (error) {
    console.warn('[database.web] Could not check migration status:', error);
    return true; // Assume migration needed if we can't check
  }
}

/**
 * Export database for debugging
 */
export async function exportDatabaseStats(): Promise<any> {
  const database = getDatabase();

  const [meds, doses, vitals, mimsCount] = await Promise.all([
    database.getFirstAsync('SELECT COUNT(*) as count FROM medications'),
    database.getFirstAsync('SELECT COUNT(*) as count FROM doses'),
    database.getFirstAsync('SELECT COUNT(*) as count FROM vitals'),
    database.getFirstAsync('SELECT COUNT(*) as count FROM mims_cache'),
  ]);

  return {
    medications: meds?.count || 0,
    doses: doses?.count || 0,
    vitals: vitals?.count || 0,
    mimsCache: mimsCount?.count || 0,
  };
}

/**
 * Cleanup function to stop auto-persist interval
 * Call this when app is closing to prevent memory leaks
 */
export function cleanupDatabase(): void {
  if (persistIntervalId) {
    clearInterval(persistIntervalId);
    persistIntervalId = null;
    console.log('[database.web] Persist interval cleared');
  }

  // Final persist before cleanup
  if (db) {
    persistDatabase().catch((error) => {
      console.error('[database.web] Error in final persist:', error);
    });
  }
}
