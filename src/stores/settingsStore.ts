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
  userName: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      type SettingsRow = { key: string; value: string };
      const rows = (await db.getAllAsync(
        'SELECT key, value FROM settings'
      )) as SettingsRow[];

      const loadedSettings: AppSettings = { ...DEFAULT_SETTINGS };
      const mutableSettings = loadedSettings as AppSettings & Record<string, unknown>;

      rows.forEach(({ key, value }) => {
        let parsed: unknown = value;
        try {
          parsed = JSON.parse(value);
        } catch {
          parsed = value;
        }

        if (Object.prototype.hasOwnProperty.call(loadedSettings, key)) {
          mutableSettings[key] = parsed;
        }
      });

      set({ settings: loadedSettings, isLoading: false });
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
