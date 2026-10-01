# MyKencing medication QA findings

### MED-01: Medication reminders fail to schedule after saving
- Severity: High
- Screen: Add Medicine / dose reminders
- Steps to reproduce: 1. Grant Android notification permission. 2. Leave Enable Reminders on. 3. Add APO-WARFARIN 5 mg with a daily 08:25 dose and save. 4. Inspect ReactNativeJS logcat.
- Expected: A reminder is scheduled for the next 08:25 occurrence, or the app shows an actionable error.
- Actual: The medication saves, but Expo notification scheduling fails with ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE. The UI gives no indication that the reminder was not created. POST_NOTIFICATIONS was granted on the emulator.
- Evidence: shots/30-warfarin-save-wait.png; logcat: “Error scheduling notification: … code: ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE” and “Failed to schedule the notification. org.json.JSONObject”. On restart, daily vitals reminder scheduling emitted the same exception.
- Suspected source: src/services/notifications.ts:215

### MED-02: Failed interaction checks look like a clean result
- Severity: High
- Screen: Medicine Details
- Steps to reproduce: 1. Open the saved API medicine APO-WARFARIN. 2. Wait for the interaction and food-interaction checks to finish or time out.
- Expected: Show an explicit unavailable/error state when the safety check cannot complete, so an empty section cannot be mistaken for “no interactions.”
- Actual: The space below Prescription remains blank. Logcat reports the interaction result as status unavailable with “Failed to check interactions. Please check your connection.” No unavailable state is rendered.
- Evidence: shots/31-warfarin-detail.png, shots/32-detail-lower.png, shots/80-detail-check-timeout.png; logcat: “Error checking interactions: [TypeError: Network request failed]”, followed by “Interaction result: { status: 'unavailable' … }”.
- Suspected source: src/screens/MedicineDetailScreen.tsx:51

### MED-03: Manual Entry cannot save a typed custom medicine name
- Severity: Medium
- Screen: Scan Prescription → Manual Entry → Add Medicine
- Steps to reproduce: 1. Scan a scene with no readable medicine text and choose Manual Entry. 2. Type “QA Test Aspirin” into the medicine-name search field without selecting a catalog result. 3. Tap Add Medication.
- Expected: The typed name is accepted as a custom medicine name, or the form offers a separate custom-name field/action.
- Actual: The query remains only a search query; Save shows “Please enter medication name.” There is no other name field, so an unlisted medicine cannot be entered manually.
- Evidence: shots/72-manual-entry.png, shots/75-custom-search-no-results.png, shots/76-manual-name-required.png.
- Suspected source: src/screens/AddMedicineScreen.tsx:374

### MED-04: Medicine search failures have no visible error or retry state
- Severity: Medium
- Screen: Add Medicine search
- Steps to reproduce: 1. Open Add Medicine. 2. Search for Aspirin, Cardiprin, or another catalog term. 3. Wait for requests to settle when the app cannot reach the API.
- Expected: Show a clear search error with a retry action, distinct from a successful search that returned no matches.
- Actual: The results area goes blank and the query remains in the field. Logcat shows repeated Network request failed and AbortError messages, but the screen gives no feedback. The handler calls the API on every text change and hides the results on error.
- Evidence: shots/39-search-aspirin.png, shots/45-search-cardiprin-slow.png, shots/75-custom-search-no-results.png; logcat: repeated “Error searching medicines: [TypeError: Network request failed]” / “[AbortError: Aborted]” and “Search error: Failed to search medicines. Please check your connection.”
- Suspected source: src/screens/AddMedicineScreen.tsx:81, src/screens/AddMedicineScreen.tsx:374, src/services/api-client.ts:13

### MED-05: Reschedule Today Only deletes a past dose and reports success
- Severity: Medium
- Screen: Medicine Details / medication calendar
- Steps to reproduce: 1. Add APO-WARFARIN with a daily 08:25 dose. 2. After 08:25, open Medicine Details and choose Reschedule → Today Only without moving the time. 3. Confirm. 4. Return to the calendar for the current date.
- Expected: Keep the existing dose as pending, or warn that the chosen time is in the past before changing anything.
- Actual: At 08:36 the app reported “Your medication times have been updated successfully,” while the saved time remained 08:25. The current day then showed no scheduled medication, while the next day still showed the recurring dose.
- Evidence: shots/37-reschedule-result-wait.png, shots/51-medications-ms.png, shots/52-next-day.png.
- Suspected source: src/stores/medicationStore.ts:946

### MED-06: Future doses can be marked taken or skipped early
- Severity: Medium
- Screen: Medication calendar / dose adherence
- Steps to reproduce: 1. While the device date is Oct 1, select Oct 2 or Oct 3 in the medication calendar. 2. Tap Skip on the Oct 2 dose or Take on the Oct 3 dose. 3. Re-select the date or reload the screen.
- Expected: Prevent adherence actions before the scheduled date/time, or require an explicit early-dose confirmation.
- Actual: The future dose is immediately persisted as skipped/taken. The Oct 3 card showed “Diambil” after reload even though the device date was still Oct 1.
- Evidence: shots/53-skip-confirm.png, shots/54-skip-result.png, shots/55-day-after-skipped.png, shots/58-reload-taken-day3.png, shots/83-adherence-after-restart-day3.png, shots/84-adherence-after-restart-day2.png; logcat at 10-01 08:44:47: “Marking dose as taken” and database update result changes: 1.
- Suspected source: src/screens/MedicationsScreen.tsx:298

### MED-07: Profile name is discarded after Save
- Severity: Low
- Screen: Profile & Settings
- Steps to reproduce: 1. Enter “Test User” in Your name. 2. Tap Save. 3. Leave Settings and reopen it, or restart the app.
- Expected: Keep the saved profile name and use it in the home greeting.
- Actual: The field returns to its empty placeholder and the home greeting uses its fallback name. The settings loader drops userName because it only applies stored keys already present in the default settings object.
- Evidence: shots/64-profile-save-confirm.png, shots/67-profile-name-reopened-blank.png.
- Suspected source: src/stores/settingsStore.ts:67

## Coverage

- Onboarding: completed with fake test profile data (age 45, male, 75 kg, health goal); checked empty/extreme age input, minimum age behavior, back navigation, privacy consent toggle and confirmation. No name field was present in onboarding.
- Medications calendar: empty state, week dates, date selection, medication card, details navigation, Take and Skip actions, next-day schedule, future-date adherence, and persistence after force-stop/relaunch.
- Add Medicine: warfarin catalog search and selection, prefilled medicine details, dose/unit/form controls, start/end date pickers, time picker, adding/removing times, notes, empty-name and empty-time validation, save, and error behavior after failed searches.
- Manual Entry: reached from Scan Prescription; typed a custom name and reproduced the name-required rejection.
- Medicine Details: prescription details, interaction-check wait/error behavior, Today Only rescheduling and time picker, and Remove confirmation followed by Cancel (the QA medication was retained). The All Dates reschedule option was shown but not submitted.
- Scan Prescription: tested camera permission Deny and Allow, camera preview/capture, no-medicine OCR result, Cancel and Manual Entry actions. OCR found no medicines in the emulator scene.
- Settings: profile-name save/reopen, reminders master toggle, dependent Sound/Vibrate toggles, glucose/weight units, and English → Bahasa Melayu → English. Medication calendar and Settings labels translated; language choice survived app restart.
- Restart persistence: saved medication, taken/skipped dose statuses and language were present after force-stop/relaunch. Profile name did not persist.
- Notification permission: Allow was tested and POST_NOTIFICATIONS was granted. The Deny path was not tested after the initial prompt was accepted.
- SelectScannedMedicine was not reached because OCR returned zero medicines; the scan screen offered Manual Entry instead.
- MedicationManagement and MedicationInteractions were not reachable from visible app navigation. Their routes are registered, but no active UI navigation callsite was found; the only MedicationsScreen handler for MedicationInteractions is unused.
- Warfarin + aspirin interaction result was not tested: in-app aspirin/Cardiprin searches failed before a second medicine could be selected, and the interaction route had no visible entry point. The single-warfarin detail check itself timed out and was reported as unavailable in logcat.
- Week-swipe and pull-to-refresh were not separately exercised. Extreme/negative dosage validation was not completed because the catalog search did not supply a medicine selection and the manual-name path is blocked. Remove was opened and canceled to preserve QA data.
- No app crash or AndroidRuntime fatal error was observed. ReactNativeJS logged API and notification scheduling errors listed above.
