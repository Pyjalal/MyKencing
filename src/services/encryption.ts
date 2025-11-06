/**
 * Encryption Service
 *
 * Uses Expo SecureStore for secure key-value storage (credentials, tokens, sensitive settings)
 * Database-level encryption for SQLite is handled via SQLCipher (future enhancement)
 *
 * PDPA Compliance:
 * - All PHI (Personal Health Information) stored locally only
 * - Encryption at rest using device's secure enclave
 * - No PHI sent to servers
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const inMemoryStore: Record<string, string> = {};

function isSecureStoreAvailableForPlatform(): boolean {
  // Expo SecureStore is unsupported on web; guard at runtime.
  if (Platform.OS === 'web') {
    return false;
  }

  return typeof SecureStore?.setItemAsync === 'function' && typeof SecureStore?.getItemAsync === 'function';
}

function isDevelopmentBuild(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }

  if (typeof process !== 'undefined' && process.env) {
    const env = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV;
    if (env && env.toLowerCase() === 'development') {
      return true;
    }
  }

  return false;
}

function getDevPassphrase(): string {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_ENCRYPTION_KEY) {
    return process.env.EXPO_PUBLIC_WEB_ENCRYPTION_KEY;
  }
  // SECURITY: Never use hardcoded passphrases in production
  // This fallback is only for development to prevent blocking the app
  console.warn('Using fallback encryption key for web development. Set EXPO_PUBLIC_WEB_ENCRYPTION_KEY in .env for security.');
  return 'mykencing-dev-key-2024-secure'; // Fallback for development only
}

const NAMESPACE = 'mykencing';

async function deriveKeyFromPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(passphrase));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function promptForPassphrase(): string {
  if (typeof window === 'undefined') {
    throw new Error('Secure encryption requires a browser environment.');
  }

  const message = 'Enter your MyKencing encryption passphrase (minimum 8 characters):';
  const passphrase = window.prompt(message) || '';

  if (passphrase.length < 8) {
    throw new Error('Encryption passphrase must be at least 8 characters.');
  }

  return passphrase;
}

/**
 * Securely store a key-value pair
 */
export async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (isSecureStoreAvailableForPlatform()) {
      await SecureStore.setItemAsync(`${NAMESPACE}.${key}`, value);
    } else {
      inMemoryStore[`${NAMESPACE}.${key}`] = value;
    }
  } catch (error) {
    console.error(`Error storing secure item ${key}:`, error);
    throw new Error(`Failed to securely store ${key}`);
  }
}

/**
 * Retrieve a securely stored value
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    if (isSecureStoreAvailableForPlatform()) {
      return await SecureStore.getItemAsync(`${NAMESPACE}.${key}`);
    }
    return inMemoryStore[`${NAMESPACE}.${key}`] ?? null;
  } catch (error) {
    console.error(`Error retrieving secure item ${key}:`, error);
    return null;
  }
}

/**
 * Delete a securely stored value
 */
export async function secureDelete(key: string): Promise<void> {
  try {
    if (isSecureStoreAvailableForPlatform()) {
      await SecureStore.deleteItemAsync(`${NAMESPACE}.${key}`);
    }
    delete inMemoryStore[`${NAMESPACE}.${key}`];
  } catch (error) {
    console.error(`Error deleting secure item ${key}:`, error);
    throw new Error(`Failed to delete ${key}`);
  }
}

/**
 * Store user authentication token (if using backend auth)
 */
export async function storeAuthToken(token: string): Promise<void> {
  await secureSet('auth_token', token);
}

/**
 * Retrieve user authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  return await secureGet('auth_token');
}

/**
 * Clear user authentication token (logout)
 */
export async function clearAuthToken(): Promise<void> {
  await secureDelete('auth_token');
}

/**
 * Store encryption key for database (future: SQLCipher)
 */
export async function storeDatabaseKey(key: string): Promise<void> {
  await secureSet('db_encryption_key', key);
}

/**
 * Retrieve database encryption key
 */
export async function getDatabaseKey(): Promise<string | null> {
  return await secureGet('db_encryption_key');
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let key = '';

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}

/**
 * Initialize encryption on first launch
 * Generate and store database encryption key
 */
export async function initializeEncryption(): Promise<void> {
  try {
    // Check if key already exists
    const existingKey = await getDatabaseKey();

    if (!existingKey) {
      if (Platform.OS === 'web') {
        if (typeof crypto === 'undefined' || !crypto.subtle) {
          throw new Error('WebCrypto is required for secure web encryption.');
        }

        const useDevFlow = isDevelopmentBuild();
        const passphrase = useDevFlow ? getDevPassphrase() : promptForPassphrase();
        const derivedKey = await deriveKeyFromPassphrase(passphrase);
        await storeDatabaseKey(derivedKey);
        console.log(
          useDevFlow
            ? 'Using development web encryption key'
            : 'Derived web database encryption key from passphrase'
        );
      } else {
        // Generate new key on first launch (native platforms)
        const newKey = generateEncryptionKey();
        await storeDatabaseKey(newKey);
        console.log('Generated new database encryption key');
      }
    }
  } catch (error) {
    console.error('Error initializing encryption:', error);
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Clear all secure storage (for complete data wipe)
 */
export async function clearAllSecureData(): Promise<void> {
  try {
    await clearAuthToken();
    await secureDelete('db_encryption_key');
    // Add other secure keys as needed
    console.log('All secure data cleared');
  } catch (error) {
    console.error('Error clearing secure data:', error);
    throw new Error('Failed to clear secure data');
  }
}

/**
 * DEPRECATED: XOR-based encryption is not cryptographically secure.
 *
 * These functions have been removed for security reasons.
 *
 * For proper encryption, use:
 * - Web: crypto.subtle.encrypt with AES-GCM
 * - Native: expo-crypto or react-native-aes-crypto
 * - Database: SQLCipher for database-level encryption
 *
 * If you need these functions for legacy data migration, please implement
 * proper AES-256 encryption instead.
 */

// Removed simpleEncrypt() and simpleDecrypt() - use proper crypto libraries
