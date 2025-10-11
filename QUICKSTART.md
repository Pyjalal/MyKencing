# MyKencing - Quick Start Guide

## Initial Setup Complete ✅

The MyKencing MVP project has been successfully initialized with the following structure:

### What's Been Set Up

#### 1. Core Infrastructure
- ✅ Expo TypeScript project
- ✅ All dependencies installed (Zustand, SQLite, React Navigation, etc.)
- ✅ ESLint & Prettier configuration
- ✅ TypeScript types and domain models

#### 2. Database Layer
- ✅ SQLite database schema with migrations
- ✅ Tables: `mims_cache`, `medications`, `doses`, `vitals`, `settings`
- ✅ Database service with init and query functions
- ✅ Encryption service using Expo SecureStore

#### 3. State Management
- ✅ Zustand stores:
  - `medicationStore` - Medications and doses
  - `vitalsStore` - Health vitals
  - `settingsStore` - User preferences

#### 4. UI & Navigation
- ✅ React Navigation setup (stack + bottom tabs)
- ✅ Placeholder screens:
  - Onboarding
  - Home (Today's medications)
  - Add Medicine
  - Medicine Detail
  - Vitals
  - Settings

#### 5. Design System
- ✅ Color palette (calm, accessible)
- ✅ Typography system
- ✅ Spacing & layout constants
- ✅ Clinical thresholds (BP, glucose, BMI, etc.)

#### 6. Configuration
- ✅ `app.json` with permissions (camera, notifications, storage)
- ✅ App initialization with database & encryption setup

## Running the App

```bash
cd MyKencing
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS (Mac only)
- Press `w` for web

## Next Steps (MVP Completion)

### High Priority

1. **MIMS Integration**
   - Create service to fetch/cache MIMS data
   - Add sample MIMS records for testing
   - Location: `src/services/mims.ts`

2. **OCR & Prescription Scanning**
   - Integrate react-native-vision-camera
   - Add ML Kit text recognition
   - Create NER for medicine extraction
   - Location: `src/services/ocr.ts`

3. **Medication Reminders**
   - Set up Expo Notifications
   - Create scheduling service
   - Handle notification actions
   - Location: `src/services/notifications.ts`

4. **Vitals Logging & Charts**
   - Build vitals input forms
   - Integrate Victory charts
   - Add threshold alerts
   - Location: `src/screens/AddVitalScreen.tsx`

5. **PDF Export**
   - Create PDF generation service
   - Design export template
   - Add sharing functionality
   - Location: `src/services/export.ts`

### Medium Priority

6. **Complete Medicine Detail Screen**
   - Display MIMS guidance with citations
   - Show adherence history
   - Edit/delete functionality

7. **Improve Home Screen**
   - Show upcoming doses with actions
   - Add adherence streak
   - Quick vitals summary

8. **Risk Assessment Tool**
   - Create input form
   - Implement scoring algorithm
   - Display recommendations

### Low Priority

9. **Multilingual Support**
   - Add i18n setup
   - Translate UI strings
   - Add language switcher

10. **Testing**
    - Unit tests for stores
    - Integration tests for database
    - E2E tests with Detox

## File Structure Reference

```
src/
├── components/          # Reusable UI components (TODO)
├── constants/
│   ├── theme.ts        # Colors, typography, spacing
│   └── clinical.ts     # Medical thresholds & disclaimers
├── hooks/              # Custom React hooks (TODO)
├── navigation/
│   └── AppNavigator.tsx # Navigation setup
├── screens/
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── AddMedicineScreen.tsx
│   ├── MedicineDetailScreen.tsx
│   ├── VitalsScreen.tsx
│   └── SettingsScreen.tsx
├── services/
│   ├── database.ts     # SQLite operations
│   └── encryption.ts   # SecureStore wrapper
├── stores/
│   ├── medicationStore.ts
│   ├── vitalsStore.ts
│   └── settingsStore.ts
├── types/
│   └── index.ts        # All TypeScript types
└── utils/              # Helper functions (TODO)
```

## Common Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Lint code
npm run lint

# Type check
npm run tsc

# Clear cache (if issues)
npm start -- --clear
```

## Key Design Principles

1. **Safety First**: All medicine data from MIMS, no LLM generation
2. **Privacy by Design**: Local-only PHI, encrypted storage
3. **Calm UX**: Gentle colors, minimal alerts, large touch targets
4. **Clinical Accuracy**: Malaysian CPG + WHO guidelines
5. **Offline-First**: Works without internet after initial setup

## Known Limitations (MVP)

- No actual MIMS data yet (placeholder structure only)
- OCR not implemented
- Notifications not set up
- Charts not implemented
- PDF export not implemented
- No multilingual support yet
- No backend/sync

## Need Help?

- Check the main [README.md](./README.md) for architecture details
- Review the specification in the project brief
- All constants are in `src/constants/`
- All types are in `src/types/index.ts`

---

**Status**: ✅ Foundation complete, ready for feature development
**Next milestone**: OCR + MIMS integration
**Target**: 4-week MVP delivery
