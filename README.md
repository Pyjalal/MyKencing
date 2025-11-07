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

#### For Both Mac and Windows:
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- A smartphone with **Expo Go** app installed:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Platform-Specific Prerequisites:

**Mac Only (for iOS development):**
- **Xcode 15+** - [Download from Mac App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** - Install via `sudo gem install cocoapods`

**Windows Only (for Android development):**
- **Android Studio** - [Download from developer.android.com](https://developer.android.com/studio)
- **Java Development Kit (JDK) 17+** - Included with Android Studio

### Installation

#### Step 1: Clone the Repository

**Mac/Linux:**
```bash
git clone https://github.com/yourusername/MyKencing.git
cd MyKencing
```

**Windows (Command Prompt or PowerShell):**
```cmd
git clone https://github.com/yourusername/MyKencing.git
cd MyKencing
```

#### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including React Native, Expo, and other dependencies.

#### Step 3: Start the Development Server

```bash
npm start
```

Or use the Expo CLI directly:
```bash
npx expo start
```

You should see a QR code and several options in your terminal.

### Running the App

#### Option 1: Run on Physical Device (Easiest - Recommended for Testing)

1. Ensure your smartphone is connected to the **same Wi-Fi network** as your computer
2. Open the **Expo Go** app on your phone
3. **iOS**: Scan the QR code from the terminal using your camera app
4. **Android**: Scan the QR code using the Expo Go app's built-in scanner
5. The app will load on your device

#### Option 2: Run on iOS Simulator (Mac Only)

1. Make sure Xcode is installed with iOS Simulator
2. Press `i` in the terminal after running `npm start`
3. Or run: `npm run ios`

**First-time iOS setup:**
```bash
# Install iOS pods
cd ios && pod install && cd ..
```

#### Option 3: Run on Android Emulator

**Setup Android Emulator (First Time):**

1. Open Android Studio
2. Go to **Tools → Device Manager** (or **AVD Manager**)
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Download a system image (recommended: **Android 13** or higher)
6. Finish setup and start the emulator

**Run the app:**
1. Start your Android emulator first
2. Press `a` in the terminal after running `npm start`
3. Or run: `npm run android`

**Windows-specific Android setup:**
```cmd
# Add Android SDK to PATH (add to System Environment Variables):
# ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
# Add to PATH: %ANDROID_HOME%\platform-tools
# Add to PATH: %ANDROID_HOME%\emulator
```

### Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator (Mac only)
npm run web        # Run in web browser (experimental)
```

### Troubleshooting

#### Common Issues on Windows:

**"Metro bundler not starting":**
```cmd
# Clear cache and restart
npx expo start --clear
```

**"Android emulator not detected":**
```cmd
# Check if emulator is running
adb devices

# Restart ADB server
adb kill-server
adb start-server
```

**"Port already in use":**
```cmd
# Kill process on port 8081
npx kill-port 8081
# Or specify a different port
npx expo start --port 8082
```

#### Common Issues on Mac:

**"iOS build fails" or "Pod install fails":**
```bash
# Update CocoaPods and reinstall
cd ios
pod deintegrate
pod install
cd ..
```

**"Command not found: npx":**
```bash
# Reinstall Node.js or use full path
./node_modules/.bin/expo start
```

#### General Issues:

**"Unable to connect to device":**
- Ensure device and computer are on the same Wi-Fi network
- Disable VPN if active
- Check firewall settings (allow Node.js and Expo)
- Try using tunnel mode: `npx expo start --tunnel`

**"Dependencies error" or "Module not found":**
```bash
# Clean install
rm -rf node_modules package-lock.json  # Mac/Linux
# or
rmdir /s node_modules && del package-lock.json  # Windows

npm install
npx expo start --clear
```

**"Memory or storage issues":**
```bash
# Clear watchman (Mac/Linux only)
watchman watch-del-all

# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force
```

### Development Environment Setup (Optional but Recommended)

**VSCode Extensions:**
- ESLint
- Prettier - Code formatter
- React Native Tools
- TypeScript and JavaScript Language Features

**Configure VSCode settings.json:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Development

### Database Schema

The app uses SQLite with the following main tables:

- `mims_cache` - MIMS medicine data (cached locally)
- `medications` - User's active prescriptions
- `doses` - Adherence tracking
- `vitals` - Health metrics (BP, glucose, weight)
- `settings` - User preferences

### Android Release Keystore

To build a release version of the Android app, you need to generate a signing keystore.

**1. Generate the Keystore:**

Run the following script from the `scripts` directory:

```bash
./generate-keystore.sh
```

This will create a `mykencing-release.keystore` file.

**2. Follow the script's instructions:**

The script will guide you on how to:
- Convert the keystore to a base64 string.
- Set up the necessary GitHub Secrets for the Android CI/CD workflow.

**IMPORTANT:**

The `generate-keystore.sh` script includes the `-J-Dkeystore.pkcs12.legacy=true` flag. This is crucial for compatibility with the Android Gradle Plugin and prevents build failures.

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

This is currently a private MVP project.

## License

Proprietary - All rights reserved

## Contact

For questions or feedback, please contact the MyKencing team.

---

Built with ❤️ By Notts Biohackers
