# MyKencing QA — onboarding-settings

## Reproduced bugs

### ONB-01: Onboarding accepts age and weight below the stated minimums
- Severity: Medium
- Screen: Onboarding — Personal Info
- Steps to reproduce: 1. Start onboarding. 2. Enter age `1`, select a gender, and enter weight `1 kg`. 3. Tap Next.
- Expected: Reject values below the stated minimums (age 8 and weight 25 kg) and keep the user on Personal Info.
- Actual: Both values are accepted and onboarding advances to goal selection. The separate invalid-age and invalid-weight alerts state the limits are age 8–120 and weight 25–220 kg.
- Evidence: `shots/onboarding-age-1-goal.png`, `shots/onboarding-weight-1-goal.png`, `shots/onboarding-age-alert.png`, `shots/onboarding-weight-alert.png`
- Suspected source: `src/screens/OnboardingPersonalInfoScreen.tsx:35` and `:52`

### ONB-02: Saved profile fields disappear when Settings reloads them
- Severity: High
- Screen: Settings, Health Profile, Risk Assessment
- Steps to reproduce: 1. Complete onboarding with age 45, gender, and weight. 2. In Settings, enter `Test User` and save. 3. Reopen Settings or visit Health Profile after completing the risk questionnaire. 4. Force-stop and relaunch the app.
- Expected: Saved profile fields remain visible and available to the risk score after navigating or restarting.
- Actual: The name returns to blank/“Friend”; Health Profile reports age and gender as not recorded, and Risk Assessment reports age as not set. Saving age again in Risk Assessment did not resolve the missing profile display. Other saved data, including Malay language and vitals, persisted across the same restart.
- Evidence: `shots/settings-saved.png`, `shots/settings-name-persist.png`, `shots/home-after-settings.png`, `shots/health-profile-after-risk.png`, `shots/risk-age-save-still-missing.png`, `shots/restart-language-persist.png`
- Suspected source: `src/stores/settingsStore.ts:84` (hydration only copies keys present in `DEFAULT_SETTINGS`)

### ONB-03: Ramadan accepts impossible times and dates
- Severity: Medium
- Screen: Ramadan Mode
- Steps to reproduce: 1. Open Ramadan Mode. 2. Enter `99:99` for Sahur and Iftar and `2026-13-45` as the start date. 3. Tap Apply.
- Expected: Validate time and date values and explain invalid entries without applying them.
- Actual: The app accepts the values and reports “Medication schedules adjusted for Ramadan.”
- Evidence: `shots/ramadan-invalid-applied.png`
- Suspected source: `src/screens/RamadanModeScreen.tsx:47` and `:114`

### ONB-04: Ramadan Auto-set Dates fills dates from the past
- Severity: Low
- Screen: Ramadan Mode
- Steps to reproduce: 1. On 2026-10-01, open Ramadan Mode. 2. Tap Auto-set Dates.
- Expected: Fill the next upcoming Ramadan period, or otherwise make clear the dates are historical.
- Actual: Start and end dates are set to February 19 and March 20, 2026, both in the past on the test date.
- Evidence: `shots/ramadan-auto-dates.png`
- Suspected source: `src/screens/RamadanModeScreen.tsx:40` and `src/utils/ramadanAdjustments.ts:58`

### ONB-05: Risk calculator cards render untranslated label keys
- Severity: Medium
- Screen: Risk Calculators
- Steps to reproduce: 1. Enable FINDRISC and Framingham in Risk Calculators. 2. Return to the results cards.
- Expected: Show readable localized names for both calculators.
- Actual: Cards display raw keys such as `RISK_CALCULATORS.FINDRISC_LABEL` and `RISK_CALCULATORS.FRAMINGHAM_LABEL`, wrapped across lines.
- Evidence: `shots/risk-calculators-results.png`
- Suspected source: `src/utils/riskScores.ts:113`, `src/components/RiskScoreCircle.tsx:23`

### ONB-06: Home risk trend disagrees with the current FINDRISC result
- Severity: Medium
- Screen: Home, Risk Calculators
- Steps to reproduce: 1. Complete the risk questionnaire with age 45 and waist circumference 92 cm, plus the same answers in both screens. 2. Open Risk Calculators and note the latest FINDRISC result. 3. Return to Home and compare the latest point in the FINDRISC trend.
- Expected: The latest Home trend value matches the calculator result for the same saved profile and risk answers.
- Actual: Risk Calculators shows FINDRISC 5/26 while Home’s latest 14-day trend point shows 1/26. The Home trend calculation omits the saved questionnaire waist circumference when it has no daily waist measurement.
- Evidence: `shots/risk-calculators-results.png`, `shots/home-tab-bottom.png`
- Suspected source: `src/screens/HomeScreen.tsx:424` (trend calculation); calculator fallback is in `src/screens/RiskCalculatorScreen.tsx`

### ONB-07: Privacy Policy row does not open anything
- Severity: Low
- Screen: Settings — Data & Privacy
- Steps to reproduce: 1. Open Settings. 2. Tap View Privacy Policy.
- Expected: Open the policy or provide an explanation that it is unavailable.
- Actual: No navigation or visible response occurs.
- Evidence: `shots/settings-privacy-policy-noop.png`
- Suspected source: `src/screens/SettingsScreen.tsx:176`

### ONB-08: Home reminder reports success when scheduling fails
- Severity: Medium
- Screen: Home — Daily Vitals Reminder
- Steps to reproduce: 1. Tap the Home daily reminder switch with notifications allowed. 2. Repeat after denying the Android notification permission.
- Expected: Enable the reminder only after scheduling succeeds; if permission or scheduling fails, show an actionable failure state and leave the control off.
- Actual: The app displays “Notifications enabled” and shows the switch on in both cases. Logcat records `ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE`; after permission denial it also logs “Notification permissions not granted.”
- Evidence: `shots/home-reminder-enabled.png`, `shots/home-denied-still-enabled.png`, `shots/notification-denied.png`; logcat: `Error scheduling daily vitals reminder: ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE` (allowed at 08:56:47; denied at 08:59:38, 2026-10-01)
- Suspected source: `src/screens/HomeScreen.tsx:519` and `src/services/notifications.ts:455`

### ONB-09: Home reminder switch cannot be turned off
- Severity: Low
- Screen: Home — Daily Vitals Reminder
- Steps to reproduce: 1. Tap the Home daily reminder switch once. 2. Dismiss the success alert and tap the switch again.
- Expected: The second tap disables the reminder and changes the switch to off.
- Actual: The switch stays on and the app repeats the enable-success alert. The control has no off path.
- Evidence: `shots/home-reminder-enabled.png`, `shots/home-reminder-second-tap.png`
- Suspected source: `src/screens/HomeScreen.tsx:519`

## Coverage

- Splash and fresh launch: opened the installed release build and used the provided `pm clear` fresh-install flow.
- Onboarding — Personal Info: empty form and disabled Next; age, weight, and gender entry; gender choices; age 121 and age 1; weight 501 and weight 1; back navigation; valid age 45 and weight 72.5; personal-info Skip.
- Onboarding — Goals: empty selection and disabled Next; Get fit, Be active, Be healthy, and Find balance selections; back navigation and persistence; goal Skip.
- Privacy & Consent: scrolled through all sections; toggled consent; tested Agree and Decline; both onboarding Skip paths reached consent.
- Home: Home tab, search route to Add Medicine, Today/vitals calendar, Risk Scores/manage inputs, empty Next Dose state and disabled Take/Skip actions, daily reminder switch, and Log Today’s Vitals entry.
- Daily Vitals flow: empty blood-pressure validation; blood pressure, weight/height, glucose, and cholesterol steps; completed a realistic sample entry and returned to Vitals.
- Health Profile: opened from Home and checked View Health Profile, Update Inputs, and Manage Inputs navigation.
- Risk Assessment: questionnaire steps and answers; empty and invalid age/waist cases; back and finish; age and BMI edit dialogs including empty/invalid inputs; gender, smoking, blood-pressure medication, glucose, activity, vegetables, and family-history controls.
- Risk Calculators: enabled and disabled FINDRISC and Framingham, checked results and both-off empty state, and navigated to the risk questionnaire.
- Settings: profile name editing/save/reopen; reminder, sound, and vibrate switches and dependencies; unit rows; English/Bahasa Melayu switching; force-stop/relaunch language persistence; Export Data period controls and generated share sheet; Analytics and Attributions period controls; Clear Analytics confirmation/action; Delete All Data confirmation and Cancel; View Privacy Policy.
- Ramadan Mode: auto dates, manual invalid time/date entry and Apply, and Restore Original.
- Restart persistence: checked Malay language, saved vitals, profile name, and risk calculator preferences across force-stop/relaunch. Name/profile hydration failed as described in ONB-02; language and vitals persisted.
- Notifications: exercised Android allow and deny paths. The notification prompt appeared after a fresh install and after permission revocation; Home reported success despite scheduling failure as described in ONB-08.
- Camera permission: not reached. No camera control was available within the tested onboarding, Home, Settings, Health Profile, Ramadan, or risk calculator surfaces.
- Medicine search and drug-interaction flows were not exercised; Home search only confirmed navigation to Add Medicine, which is outside this QA area.
- No crash was observed during these flows. The notification scheduling failures above were the reproduced logcat errors.
