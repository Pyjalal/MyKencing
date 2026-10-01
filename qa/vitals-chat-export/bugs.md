# MyKencing QA — vitals-chat-export

Exploration run on `emulator-5558` with fake profile data. Findings below are reproduced in the installed release build.

### VIT-01: Profile name, age, and gender disappear when settings reload
- Severity: Medium
- Screen: Settings, Health Profile, Risk Assessment
- Steps to reproduce: 1. Complete onboarding with name “Test User,” age 45, and male gender. 2. Open Settings, save the name, leave Settings, then reopen it. 3. Open Health Profile and Risk Assessment; save age 45 from the age editor and return to the assessment.
- Expected: Saved profile fields remain available and the profile and risk screens show consistent name, age, and gender values.
- Actual: The reopened Settings name is blank. Health Profile shows age as “Not recorded” and gender as “Gender not set”; after saving age 45 in the editor, Risk Assessment still says “Age not set.”
- Evidence: shots/42-settings-name-reopened.png, shots/34-health-profile-completed.png, shots/38-risk-age-saved.png
- Suspected source: `src/stores/settingsStore.ts:39-52,84-86` — defaults omit these optional fields, and `loadSettings` ignores database keys absent from the defaults.

### VIT-02: Analytics omits glucose and weight from the vitals count
- Severity: Medium
- Screen: Analytics Dashboard
- Steps to reproduce: 1. Save blood pressure, glucose, weight, total cholesterol, and HDL cholesterol in Daily Vitals Log. 2. Generate three reports. 3. Open Analytics for 30 days.
- Expected: “Vitals Logged” counts all five saved readings; “Total Events” includes those five vital events plus three reports and one app open.
- Actual: Dashboard shows 3 vitals and 7 total events. The BP and cholesterol entries are counted, while glucose and weight are absent from the event count.
- Evidence: shots/23-vitals-dashboard-top.png, shots/24-vitals-dashboard-scroll1.png, shots/48-export-print-preview.png, shots/50-analytics-dashboard-en.png
- Suspected source: `src/stores/vitalsStore.ts:154-195` — `addGlucose` and `addWeight` reload vitals but do not call `logEvent`, unlike the BP and cholesterol actions.

### VIT-03: Malay export leaves the blood pressure heading in English
- Severity: Low
- Screen: Export Report
- Steps to reproduce: 1. Switch the app to Bahasa Melayu. 2. Generate a report and open its print preview. 3. Inspect the vital headings.
- Expected: All report headings use Bahasa Melayu.
- Actual: “Blood Pressure Readings” remains English while the surrounding headings and report labels are Malay.
- Evidence: shots/48-export-print-preview.png
- Suspected source: `src/services/export.ts:264-269` — this section heading is hardcoded; the translation key already exists in `src/i18n/ms.json:653`.

### VIT-04: Chat context toggles remain English in Bahasa Melayu
- Severity: Low
- Screen: ChatBot
- Steps to reproduce: 1. Set language to Bahasa Melayu in Settings. 2. Open ChatBot and inspect the context pills.
- Expected: Vitals and medication context labels are translated with the rest of the ChatBot controls.
- Actual: The “Vitals” and “Meds” pills remain English; greeting, prompt, and Send button are Malay.
- Evidence: shots/54-chatbot-bahasa-initial.png, shots/55-chatbot-bahasa-context-on.png
- Suspected source: `src/screens/ChatBotScreen.tsx:216-239` — both pill labels are hardcoded.

### VIT-05: Chat request failure silently discards the submitted message
- Severity: Medium
- Screen: ChatBot
- Steps to reproduce: 1. Open ChatBot with the emulator offline. 2. Enter “What is a normal blood pressure” and send it. 3. Wait for the request to finish.
- Expected: Show the localized chat failure message and retain the prompt so it can be retried.
- Actual: The composer clears, the submitted message disappears from the thread, and no error bubble or retry option appears. Logcat reports an Axios network error. The emulator had no network connection during this request, so the backend response itself was not verified.
- Evidence: shots/61-chatbot-draft-normal.png, shots/62-chatbot-response.png, `chat-send-logcat.txt` (`AxiosError: Network Error`)
- Suspected source: `src/screens/ChatBotScreen.tsx:125-133` — an error message is constructed but never appended; the catch block removes the last message.

### VIT-06: Reminder shows success when permission is denied or scheduling fails
- Severity: Medium
- Screen: Home — Daily Vitals Reminder
- Steps to reproduce: 1. Deny the Android notification prompt, then open Home and scroll to Daily Vitals Reminder. 2. Tap the reminder switch. 3. Separately, grant permission and tap the switch to enable the reminder.
- Expected: Keep the switch off and explain when permission is denied or scheduling fails; show success only after a reminder is scheduled.
- Actual: After denial, the switch turns on and a “Reminder enabled” alert appears. With permission granted, the same alert appears even though logcat reports `ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE` (`Failed to schedule the notification. org.json.JSONObject`).
- Evidence: shots/64-home-notification-toggle.png, shots/67-notification-denied-toggle.png, shots/75-notification-allowed-result.png, `notification-allowed-logcat.txt`
- Suspected source: `src/screens/HomeScreen.tsx:519-527` ignores the result from notification initialization and scheduling. `src/services/notifications.ts:63-65,455-458,461-473` returns `false` or `null` on those failures.

### VIT-07: Daily reminder switch has no disable action
- Severity: Medium
- Screen: Home — Daily Vitals Reminder
- Steps to reproduce: 1. With notification permission granted, tap the reminder switch. 2. Dismiss the success alert and tap the switch again.
- Expected: The second tap disables the reminder and moves the switch off.
- Actual: The switch stays on and the app repeats the “Reminder enabled” alert. Each tap runs the enable path; there is no off path.
- Evidence: shots/71-notification-enabled-allow.png, shots/74-notification-allowed-second-tap.png
- Suspected source: `src/screens/HomeScreen.tsx:519-527` — the handler always initializes and schedules instead of toggling based on current state.

### VIT-08: Standalone AddVital screen has no reachable in-app entry point
- Severity: Low
- Screen: Vitals Dashboard / AddVital
- Steps to reproduce: 1. Open the Vitals tab and scroll through its cards. 2. Check the Home vitals action and other visible Vitals actions for an AddVital route. 3. Use “Update today’s vitals” from Home; it opens Daily Vitals Log instead.
- Expected: An add-vital action provides access to the standalone BP, glucose, and weight forms.
- Actual: AddVital is registered as a stack screen but no visible control navigates to it. The standalone form and its own edge-value validation cannot be reached through the release UI; Daily Vitals Log remains available as a separate entry flow.
- Evidence: shots/23-vitals-dashboard-top.png, shots/25-vitals-dashboard-scroll2.png
- Suspected source: `src/navigation/AppNavigator.tsx:334-336` registers the route; `src/screens/VitalsScreen.tsx:419-426` builds quick-add options that are not rendered or used for navigation.

## Coverage

- Onboarding: completed with fake profile data (Test User, age 45, male, 78 kg, Be healthy); accepted privacy consent. Notification permission was allowed during onboarding, then denied and re-granted during reminder testing.
- Daily Vitals Log: opened from Home; tested empty BP, invalid BP 70/80, systolic/diastolic ordering 80/90, and saved 120/80; tested weight 29 kg rejection and saved 78 kg with 175 cm height; tested empty glucose, 2.9 mmol/L rejection, and saved 5.5; tested empty cholesterol, total 13 rejection, HDL 4.1 rejection, and saved total 5.0 / HDL 1.4. Confirmed saved values on Home and Vitals Dashboard.
- AddVital: route is registered but has no reachable visible entry point; standalone BP/glucose/weight forms and their edge-value checks could not be exercised.
- Vitals Dashboard: inspected top and scrolled vital cards, profile/risk links, risk questionnaire/profile flow, risk assessment age editor, and empty-record behavior was not reached because readings were entered before opening the dashboard.
- Analytics: opened from Settings; tested 7-, 30-, and 90-day ranges and Clear Data. Counts went to zero after clearing analytics events. Reproduced the mismatch between five stored vitals and three logged vital events.
- Export Report: generated 7-, 30-, and 90-day reports; tested share sheet, return navigation, and print preview. Reviewed Malay report labels and the two-page preview.
- ChatBot: tested Bahasa Melayu greeting/prompt, Vitals and Meds context pills off/on, empty-send disabled state, text entry, and send failure. Gboard initially opened its stylus tutorial; selecting “Show on-screen keyboard” allowed normal text entry. The offline error state was reproduced; online response behavior was not verified because the emulator reported no network connection.
- Language and persistence: switched English ↔ Bahasa Melayu; language and vital readings persisted after force-stop/relaunch. Profile name/age/gender persistence failures are recorded in VIT-01. Reminder switch behavior is recorded in VIT-06 and VIT-07.
- Permissions: notification Allow and Deny paths tested. Camera permission was not reached because prescription scanning is outside this surface pass.
- Not exercised: medicine search and warfarin + aspirin interaction flows are outside the assigned vitals/chat/export surfaces; backend-dependent ChatBot responses could not be validated while the emulator was offline.
- Runtime: no app crash was observed. The captured ReactNativeJS errors were the ChatBot Axios network failure and notification scheduling failures referenced above.
