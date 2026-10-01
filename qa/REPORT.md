# MyKencing QA Report — 2026-10-01

**Method:** 3 × `gpt-6-luna` agents explored every surface on 3 Android 15 emulators (release build, live API), then 3 × `gpt-6.1-sol` agents independently re-ran every report on-device, traced root causes in source, and filled coverage gaps.

**Result:** 35 bugs confirmed (24 from Luna, all reproduced + 11 new from Sol), 0 not reproduced, 1 environment issue. After merging duplicates that share a root cause: **30 distinct issues**.

Full per-bug details (steps, root cause, fix, screenshots): `qa/<area>/verified.md` and `qa/<area>/verify-shots/`.

---

## Fix first (High)

| ID | Issue | Root cause |
|---|---|---|
| MED-S01 | Interaction checks always fail: app calls `/api/safety/label-check`, which the API doesn't have | `src/services/api-client.ts:261` — **introduced by uncommitted local change**; committed version uses `/api/interactions/check` |
| MED-02 | A failed interaction check is shown as "no interactions" | `src/screens/MedicineDetailScreen.tsx:59,74` drops status/error |
| MED-S05 | "Aspirin Legs 600mg" parsed as **600 G** and prefilled in the form | `api/src/services/ingredient-mapper.ts:30` matches the `g` in "Legs" |
| MED-01 | Medication reminders silently fail to schedule in release builds | `src/services/notifications.ts:250,269,308` |
| ONB-02 / VIT-01 / MED-07 | Optional settings (name, age, gender, weight, goal, consent date, Ramadan) vanish on reload | `src/stores/settingsStore.ts:84` only hydrates keys present in defaults |

## Medium

| ID | Issue | Root cause |
|---|---|---|
| ONB-08 / VIT-06 | Reminder shows success when permission is denied or scheduling fails | `src/screens/HomeScreen.tsx:521` |
| VIT-07 / ONB-09 | Daily reminder switch can't be turned off | `src/screens/HomeScreen.tsx:519,829` |
| ONB-01 | Onboarding accepts age/weight below stated minimums | `src/screens/OnboardingPersonalInfoScreen.tsx:39` |
| ONB-03 | Ramadan mode accepts impossible times and dates | `src/screens/RamadanModeScreen.tsx:47` |
| ONB-05 | Risk calculator cards show raw i18n keys | `src/utils/riskScores.ts:113` |
| ONB-06 | Home FINDRISC trend disagrees with calculator | `src/screens/HomeScreen.tsx:435` |
| ONB-S01 | Health Profile FINDRISC ignores questionnaire waist | `src/screens/HealthProfileScreen.tsx:87` |
| ONB-S03 | Risk screens use an outdated profile weight | `src/screens/RiskCalculatorScreen.tsx:69` |
| MED-03 | Manual Entry can't save a typed custom medicine name | `src/screens/AddMedicineScreen.tsx:375` |
| MED-04 | Medicine search errors show no message or retry | `src/screens/AddMedicineScreen.tsx:93` |
| MED-05 | "Reschedule today only" deletes a past dose and reports success | `src/stores/medicationStore.ts:956` |
| MED-06 | Future doses can be marked taken/skipped early | `src/screens/MedicationsScreen.tsx:180` |
| MED-S02 | Zero/negative dosages accepted | `src/screens/AddMedicineScreen.tsx:225` |
| MED-S03 | End date before start date accepted | `src/screens/AddMedicineScreen.tsx:312` |
| MED-S04 | Denying camera permission blocks the Manual Entry route | `src/screens/ScanPrescriptionScreen.tsx:110` |
| VIT-02 | Analytics vitals count excludes glucose and weight | `src/stores/vitalsStore.ts:168` |
| VIT-05 | Failed chat request silently discards the user's message | `src/screens/ChatBotScreen.tsx:125` |
| VIT-S01 | Exported report omits weight readings | `src/services/export.ts:17` |
| VIT-S02 | Vitals tab omits blood pressure and its empty state | `src/screens/VitalsScreen.tsx:703` |
| VIT-S03 | HDL greater than total cholesterol accepted | `src/screens/DailyVitalsLogScreen.tsx:126` |

## Low

| ID | Issue | Root cause |
|---|---|---|
| ONB-04 | Ramadan "Auto-set dates" fills a past period | `src/screens/RamadanModeScreen.tsx:40` |
| ONB-07 | Privacy Policy row does nothing | `src/screens/SettingsScreen.tsx:176` |
| ONB-S02 | Home weekday labels stay English in Malay | `src/screens/HomeScreen.tsx:605` |
| VIT-03 | Malay export: BP heading/columns in English | `src/services/export.ts:268` |
| VIT-04 | Chat context toggles stay English in Malay | `src/screens/ChatBotScreen.tsx:222` |
| VIT-08 | AddVital screen unreachable from the UI | `src/navigation/AppNavigator.tsx:334` |

## Environment / infrastructure

- **VIT-S04 — Chatbot backend doesn't exist.** The app posts to `https://mymedix-chatbot.fly.dev/ask` (`src/services/chatclient.ts:142`); that hostname doesn't resolve and isn't on your Fly account. Online chat can't be tested until it's deployed.
- **Build config:** uncommitted `app.json` sets `newArchEnabled: false`, which breaks the Android build (Reanimated/Worklets require it). This test build overrode it to `true`.
