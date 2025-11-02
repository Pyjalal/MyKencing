import { create } from 'zustand';
import { AppSettings } from '../types';
import { getDatabase } from '../services/database';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  reminderEnabled: true,
  reminderSound: true,
  reminderVibrate: true,
  consentGiven: false,
  themeMode: 'light',
  glucoseUnit: 'mmol/L',
  weightUnit: 'kg',
  onboardingCompleted: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings'
      );

      const settings = { ...DEFAULT_SETTINGS };

      rows.forEach((row) => {
        const key = row.key as keyof AppSettings;
        let value: any = row.value;

        // Parse JSON values
        try {
          value = JSON.parse(row.value);
        } catch {
          // Keep as string if not JSON
        }

        settings[key] = value;
      });

      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      // Update each setting
      for (const [key, value] of Object.entries(updates)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        await db.runAsync(
          `INSERT OR REPLACE INTO settings (key, value, updated_at)
           VALUES (?, ?, ?)`,
          [key, stringValue, now]
        );
      }

      // Reload settings
      await get().loadSettings();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating settings:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM settings');

      set({ settings: DEFAULT_SETTINGS, isLoading: false });
    } catch (error) {
      console.error('Error resetting settings:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
