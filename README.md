# MyKencing

Personal medication and health tracking companion for Malaysia.

## Overview

MyKencing is a mobile application designed to help Malaysians manage their medications and health vitals with ease. The app focuses on privacy, clinical accuracy, and user-friendly design.

### Key Features

- **Scan & Understand**: Scan prescriptions and get plain-language medicine guidance backed by MIMS
- **Never Miss a Dose**: Set reminders and track medication adherence
- **Monitor Health**: Log vitals (BP, glucose, weight) and track trends
- **Privacy First**: All health data stays encrypted on your device
- **Export for Doctors**: Generate PDF reports of medications and adherence

## Tech Stack

### Mobile App
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **State Management**: Zustand
- **Database**: SQLite (Expo SQLite)
- **Security**: Expo SecureStore
- **Navigation**: React Navigation
- **Charts**: Victory Native
- **Forms**: React Hook Form + Zod

### Backend (Future)
- **API**: FastAPI or Cloudflare Workers
- **RAG Service**: PostgreSQL + pgvector
- **Auth**: Supabase or Clerk

## Project Structure

```
MyKencing/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # Business logic (database, encryption, etc.)
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants (colors, clinical thresholds)
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom React hooks
│   └── assets/           # Images, fonts, etc.
├── App.tsx              # Root component
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
   ```bash
   cd MyKencing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - Press `a` for Android
   - Press `i` for iOS (Mac only)
   - Scan QR code with Expo Go app

## Development

### Database Schema

The app uses SQLite with the following main tables:

- `mims_cache` - MIMS medicine data (cached locally)
- `medications` - User's active prescriptions
- `doses` - Adherence tracking
- `vitals` - Health metrics (BP, glucose, weight)
- `settings` - User preferences

### State Management

Zustand stores are organized by domain:

- `medicationStore` - Medications and doses
- `vitalsStore` - Health vitals
- `settingsStore` - App settings

### Clinical Data

All clinical thresholds are based on:
- Malaysian Clinical Practice Guidelines
- WHO Guidelines for Asian populations
- MIMS Malaysia

See `src/constants/clinical.ts` for details.

## Privacy & Security

- **Local-only storage**: All PHI stays on device
- **Encryption at rest**: Expo SecureStore + SQLite
- **No tracking**: No analytics on PHI
- **PDPA compliant**: Malaysian data protection standards

## Clinical Disclaimer

MyKencing is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor or pharmacist for medical guidance.

## Roadmap

### MVP (4 weeks)
- [x] Project setup
- [x] Database schema
- [x] Basic navigation
- [x] Placeholder screens
- [ ] OCR prescription scanning
- [ ] MIMS integration
- [ ] Medication reminders
- [ ] Vitals logging & charts
- [ ] PDF export

### Post-MVP
- [ ] Multilingual support (Malay, Chinese)
- [ ] Risk assessment tool
- [ ] Drug interaction checker
- [ ] Pharmacy integration
- [ ] Backend API
- [ ] User authentication

## Contributing

This is currently a private MVP project. Contributions will be welcome once we open-source.

## License

Proprietary - All rights reserved

## Contact

For questions or feedback, please contact the MyKencing team.

---

Built with ❤️ for Malaysian healthcare
