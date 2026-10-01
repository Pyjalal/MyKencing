# MyKencing medication QA verification

Verified on 2026-10-01 using only `adb -s emulator-5556`, Android 15 / API 35, package `com.mykencing.app`, release version 1.0.0 (versionCode 1). All seven original reports were independently reproduced. Five additional findings are recorded as MED-S01 through MED-S05. Source references identify the inspected workspace files; no application source was changed or rebuilt.

The installed APK and the workspace release APK have the same SHA-256: `9ac6f76780b67f90c1aa125b5d45888ee17d3eb3d4a1d68066fb05c60a408fbc`. See [release identity](verify-logs/release-identity.txt). The emulator uses GMT; the reproduction times below are device times, not Malaysia local time. Verification ran approximately 09:39–10:09 GMT on October 1.

Initial emulator DNS resolution of `mymedix-api.fly.dev` failed, while the host could reach the same live backend. This is an **environment limitation**, not evidence that medicine search itself is broken. To exercise successful searches and the interaction pair, a temporary backend-only HTTP CONNECT tunnel relayed TLS unchanged to the live API through `adb reverse`. It did not mock responses or alter the app. Successful searches worked through this tunnel, but the safety endpoint still returned HTTP 404 on both device and host. The proxy setting, reverse mapping, camera fixtures and helper process were removed after testing. Camera and notification permissions were restored to granted; app language is English.

## Original reports

### MED-01: Medication reminders fail to schedule after saving

- Verdict: CONFIRMED
- Severity: High
- Steps to reproduce: Grant notification permission and enable reminders. From Meds → + → Manual Entry, search warfarin and select APO-WARFARIN 5 mg (`MAL20021396AZ`). Add a daily 08:25 dose starting October 1, then save. The medication appears in the calendar without a reminder error. Fresh logcat at 09:46:41 reports `ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE`; native logging reports `java.io.NotSerializableException: org.json.JSONObject`. Notification permission was granted during this save. The independent record was `med_1790847999379_1vtop2z2q`, with notes `Sol verify MED01`.
- Root cause: `src/services/notifications.ts:250` schedules notification content with a data object; `src/services/notifications.ts:269` catches scheduling failure and returns null. `src/services/notifications.ts:308` exposes a void wrapper that discards failed scheduling results, and `src/screens/AddMedicineScreen.tsx:256` saves the medication before calling that wrapper. The native failure occurs during serialization. A strong release-build diagnosis is removal of Expo's private serialization methods: `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/model/NotificationContent.java:205` defines `writeObject`, and line 221 serializes the JSON body as a string, but the matching release mapping retains the JSONObject field without `writeObject` or `readObject`. Release shrinking is configured at `android/app/build.gradle:118`, and `android/app/proguard-rules.pro:14` has no project serialization keep rule. The R8 explanation is an inference from the stack and mapping; a rebuilt fix was not tested.
- Suggested fix: Preserve the required Expo serialization members in the release configuration, or use a compatible notification implementation. Return scheduling outcomes to the caller and show an actionable reminder failure even when the medication record saved successfully. Verify scheduling and delivery on the corrected release build.
- Evidence: [verify-shots/01-time-selected.png](verify-shots/01-time-selected.png), [verify-shots/01-save-result.png](verify-shots/01-save-result.png), [fresh save log](verify-logs/01-reminder-save.log), [native exception](verify-logs/01-native-scheduling.log), [release mapping](verify-logs/notification-r8-mapping.txt).

### MED-02: Failed interaction checks look like a clean result

- Verdict: CONFIRMED
- Severity: High
- Steps to reproduce: Open a saved API warfarin medication and wait for drug and food checks to settle. Initially the requests failed with the emulator connection problem; the detail screen remained blank below Prescription. Repeat after restoring live API access through the tunnel: the safety requests return HTTP 404, and the detail screen still shows no unavailable state or retry action. Thus the missing feedback also reproduces independently of the initial DNS failure.
- Root cause: `src/screens/MedicineDetailScreen.tsx:59` and `src/screens/MedicineDetailScreen.tsx:74` read interaction results but only retain their interaction arrays at lines 61 and 76, discarding status and error. Rendering at lines 272 and 331 depends on nonempty interaction arrays, so an unavailable result becomes an empty screen section. MED-S01 identifies the separate endpoint failure that also triggers this defect.
- Suggested fix: Preserve and render loading, successful, partial and unavailable states for both drug and food checks. Show a retry action and distinguish an unavailable check from a completed check with no interactions.
- Evidence: [verify-shots/02-detail-unavailable.png](verify-shots/02-detail-unavailable.png), [verify-shots/02-detail-online-404.png](verify-shots/02-detail-online-404.png), [detail failure log](verify-logs/02-detail.log), [online pair log](verify-logs/s01-warfarin-aspirin.log).

### MED-03: Manual Entry cannot save a typed custom medicine name

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Capture the emulator scene, receive the no-medicine OCR alert and choose Manual Entry. Type `QA Test Aspirin` in Medicine Name without selecting a catalog result. Scroll to Add Medication and tap it. The app shows `Please enter medication name` even though the typed text is visible. The direct Manual Entry shortcut was also reached; neither path supplies a separate custom-name field.
- Root cause: `src/screens/AddMedicineScreen.tsx:375` updates only `searchQuery` and starts a search. `medicationName` is set by catalog prefilling at line 142, while save validates that separate value at line 221. The custom registration-number fallback at line 242 is therefore unreachable for an unlisted typed name through this form.
- Suggested fix: Provide an explicit custom-medicine action or name field that commits the entered name and supports the remaining form fields without a catalog match.
- Evidence: [verify-shots/03-scan-no-text.png](verify-shots/03-scan-no-text.png), [verify-shots/03-manual-typed.png](verify-shots/03-manual-typed.png), [verify-shots/03-name-required.png](verify-shots/03-name-required.png), [manual search log](verify-logs/03-manual-search.log).

### MED-04: Medicine search failures have no visible error or retry state

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: With the emulator unable to resolve the backend, open Add Medicine and search aspirin. Wait beyond the API timeout for the requests to settle. The query remains and the results area is blank, with no failure message or retry control. Logcat records failed/aborted requests. The same catalog query succeeds after the tunnel restores connectivity. The connectivity failure is environmental; the app's failure to explain it is the confirmed bug.
- Root cause: `src/screens/AddMedicineScreen.tsx:93` logs search errors, clears results and hides the results container without storing a UI error. Lines 375–377 also request on every text change without debounce or a latest-request guard. `src/services/api-client.ts:13` defines the request timeout, but timeout itself is not the missing-feedback defect.
- Suggested fix: Render distinct loading, no-matches and error states with Retry. Debounce input and reject stale responses so failed or older searches cannot overwrite newer results.
- Evidence: [verify-shots/04-aspirin-search-failure.png](verify-shots/04-aspirin-search-failure.png), [search failure log](verify-logs/04-aspirin-failure.log), [successful live search](verify-shots/s01-aspirin-results.png).

### MED-05: Reschedule Today Only deletes a past dose and reports success

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Independently add the warfarin record from MED-01 with a daily 08:25 dose. At approximately 09:47, verify its pending dose appears for October 1. Open details → Reschedule → Today Only; leave 08:25 unchanged and confirm. A success alert appears, but October 1 now has no medication scheduled. October 2 still contains the recurring 08:25 dose. This reproduction used a newly created dose that was visibly present before the action, rather than relying on the exploration agent's previously altered record.
- Root cause: `src/stores/medicationStore.ts:956` deletes today's pending/upcoming doses before validating replacement times. Line 967 inserts replacements only when their time is not in the past, leaving no replacement for 08:25. `src/screens/MedicineDetailScreen.tsx:183` treats this operation as successful and shows the success alert at line 188.
- Suggested fix: Validate replacement times before deleting any dose. Reject a past-time replacement with clear feedback, or preserve the existing pending dose. Apply the change atomically so a rejected or empty replacement cannot erase the schedule.
- Evidence: [verify-shots/05-dose-before.png](verify-shots/05-dose-before.png), [verify-shots/05-today-time-unchanged.png](verify-shots/05-today-time-unchanged.png), [verify-shots/05-reschedule-success.png](verify-shots/05-reschedule-success.png), [verify-shots/05-today-empty.png](verify-shots/05-today-empty.png), [verify-shots/05-tomorrow-retained.png](verify-shots/05-tomorrow-retained.png).

### MED-06: Future doses can be marked taken or skipped early

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: While the emulator is on October 1, select October 2 and tap Skip on the independently added warfarin dose; select October 3 and tap Take. Both actions immediately change the status without an early-dose confirmation. Force-stop and relaunch the app, then revisit both dates: October 2 remains skipped and October 3 remains taken. The fresh actions occurred at approximately 09:48 on October 1. A separate Skip confirmation was not observed in this release; the reproduction is refined accordingly.
- Root cause: `src/screens/MedicationsScreen.tsx:180` and line 194 call `markDose` without checking the scheduled date/time. The buttons at lines 309–321 are disabled only for unacknowledged interactions. `src/stores/medicationStore.ts:730` records the current time and updates the database by dose ID at lines 756–758 without a scheduled-time guard, including when that future dose is absent from today's in-memory list.
- Suggested fix: Enforce the intended timing policy in the shared dose mutation as well as the UI. Require an explicit early-recording decision if early adherence entry is supported, and avoid silently assigning today's timestamp to future doses.
- Evidence: [verify-shots/06-future-skipped.png](verify-shots/06-future-skipped.png), [verify-shots/06-future-taken.png](verify-shots/06-future-taken.png), [verify-shots/06-skipped-after-restart.png](verify-shots/06-skipped-after-restart.png), [verify-shots/06-taken-after-restart.png](verify-shots/06-taken-after-restart.png), [persisted action log](verify-logs/06-future-actions.log), [device date](verify-logs/future-action-device-date.txt).

### MED-07: Profile name is discarded after Save

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Open Profile & Settings from the Medications header. Enter `TestUser`, tap Save and wait. Leave Settings and reopen it: Your name is empty. Force-stop and relaunch: Home greets `Friend`. The current release did not show a save-confirmation dialog; the field retained its local text immediately after Save but lost it on reopening. This report is outside the medication area, but was included because every original report required verification.
- Root cause: `src/stores/settingsStore.ts:39` omits `userName` from default settings. The loader accepts only keys already present in the defaults at line 84. `src/screens/SettingsScreen.tsx:41` writes the name, then `src/stores/settingsStore.ts:129` reloads settings and drops that key from the application state. Reopening hydrates the empty fallback at `src/screens/SettingsScreen.tsx:24`.
- Suggested fix: Include `userName` in the persisted settings schema/defaults, or explicitly allow optional schema keys during loading, and verify save/reopen/restart persistence.
- Evidence: [verify-shots/07-name-before-save.png](verify-shots/07-name-before-save.png), [verify-shots/07-save-wait.png](verify-shots/07-save-wait.png), [verify-shots/07-name-reopened.png](verify-shots/07-name-reopened.png), [restart Home tree](verify-logs/restart-home.xml).

## Additional findings

### MED-S01: Released safety-check endpoint is absent from the live backend

- Verdict: CONFIRMED
- Severity: High
- Steps to reproduce: With live catalog search working, keep APO-WARFARIN (`MAL20021396AZ`) active and add MILLISPIRIN aspirin 300 mg (`MAL13115223XZ`) with a daily dose. Save and open its details. The app submits both registration numbers to `POST /api/safety/label-check` with `includeFoodAlcohol: false`; the live backend returns HTTP 404. The food check also returns 404. Save returns to the calendar without a safety-check warning, and details remain blank. A host request to the same endpoint independently returned 404, excluding emulator DNS as the cause. No successful warfarin + aspirin interaction result or acknowledgement flow was obtained.
- Root cause: `src/services/api-client.ts:261` calls `/api/safety/label-check` and line 286 expects a label-evidence response. The inspected backend mounts `/api/medicines` and `/api/interactions` at `api/src/index.ts:32`; its interaction handler is `/check` at `api/src/routes/interactions.ts:38` with a different request/response contract. `src/utils/interactionChecker.ts:56` additionally treats an unavailable result as `No interactions found` and allows navigation back. MED-02 covers the detail-screen error presentation separately.
- Suggested fix: Align the released frontend and deployed backend endpoint, payload and response schema together; changing the URL alone does not reconcile these contracts. Preserve unavailable status throughout save/detail flows and show actionable feedback when the safety check cannot complete.
- Evidence: [verify-shots/s01-aspirin-results.png](verify-shots/s01-aspirin-results.png), [verify-shots/s01-pair-no-warning.png](verify-shots/s01-pair-no-warning.png), [verify-shots/s01-pair-detail.png](verify-shots/s01-pair-detail.png), [device request/404 log](verify-logs/s01-warfarin-aspirin.log), [independent host 404](verify-logs/host-pair-label-check.txt).

### MED-S02: Zero and negative medication dosages are accepted

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Select APO-WARFARIN 5 mg from the catalog, replace dosage with `0`, keep mg and Tablet, add a time and save. The calendar and Medicine Details display `0 mg`. Independently repeat with `-2.5`; it saves and displays `-2.5 mg`. Both records had otherwise valid fields and distinct QA notes. As an additional boundary observation, `999999999 mg` also saved and appeared in details, then that disposable record was removed; no unspecified universal clinical maximum is used as the basis for this verdict.
- Root cause: `src/screens/AddMedicineScreen.tsx:225` checks only that dosage text is nonempty, then line 245 interpolates it into `userDosage`. `src/stores/medicationStore.ts:511` persists the value at line 521 without validating that its numeric amount is finite and positive.
- Suggested fix: Require a finite, positive numeric amount before saving, with field-level feedback and shared persistence validation. Apply medicine-specific bounds only where the product has a defined rule.
- Evidence: [verify-shots/s02-zero-form.png](verify-shots/s02-zero-form.png), [verify-shots/s02-zero-saved.png](verify-shots/s02-zero-saved.png), [verify-shots/s02-zero-detail.png](verify-shots/s02-zero-detail.png), [verify-shots/s02-negative-form.png](verify-shots/s02-negative-form.png), [verify-shots/s02-negative-saved.png](verify-shots/s02-negative-saved.png), [extreme boundary details](verify-shots/coverage-extreme-detail.png).

### MED-S03: End date before start date saves an active medication without doses

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Select APO-WARFARIN. Set End date to October 1 while Start date is October 1, then change Start date to October 2. The form retains End date October 1. Add a daily time and save. The app returns to the calendar without a date-validation error, and no dose is generated for that record. Fresh logs identify the accepted active medication as `med_1790848569965_v0huwgjpi`, with notes `Sol reversed dates`.
- Root cause: `src/screens/AddMedicineScreen.tsx:312` constrains the end-date picker only when it is open. Changing the start date at line 322 does not reconcile the existing end date, and save validation at line 219 has no date-order check. `src/stores/medicationStore.ts:521` inserts the record, while the generation loop at line 182 executes zero times for a start later than the end; the transaction still commits at line 548.
- Suggested fix: Clear or reconcile an invalid end date when start changes. Validate date order in both save and the store before committing, with a visible explanation rather than silently creating an empty schedule.
- Evidence: [verify-shots/s03-end-before-start.png](verify-shots/s03-end-before-start.png), [verify-shots/s03-ready-to-save.png](verify-shots/s03-ready-to-save.png), [verify-shots/s03-saved-without-validation.png](verify-shots/s03-saved-without-validation.png), [accepted record log](verify-logs/s03-reversed-dates.log).

### MED-S04: Denying camera permission removes access to Manual Entry

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Revoke camera permission and clear its prompt flags on the assigned emulator. Open Meds → +. The permission-required screen offers only Grant Permission. Tap it and choose Don't allow in the Android prompt. The same screen remains without Manual Entry, preventing entry of even a catalog medication unless camera permission is granted. Restore permission and reopen Scan Medication: Manual Entry is available again. Camera permission was restored after the test.
- Root cause: `src/screens/ScanPrescriptionScreen.tsx:110` returns a permission-only screen that excludes Manual Entry. The manual button exists only inside the granted-camera branch at line 168. The Medications + action at `src/navigation/AppNavigator.tsx:195` always opens ScanPrescription, so this visible entry path cannot reach AddMedicine when permission is denied.
- Suggested fix: Make Manual Entry available in the permission-required and denied states, or provide a direct Add Medicine action independent of camera access.
- Evidence: [verify-shots/s04-camera-required.png](verify-shots/s04-camera-required.png), [verify-shots/s04-camera-prompt.png](verify-shots/s04-camera-prompt.png), [verify-shots/s04-camera-denied-no-manual.png](verify-shots/s04-camera-denied-no-manual.png), [permission-restored scan screen](verify-shots/coverage-camera-allowed.png).

### MED-S05: Aspirin strength parser mistakes a brand-name letter for the dosage unit

- Verdict: CONFIRMED
- Severity: High
- Steps to reproduce: Search aspirin using the live catalog and select `Three Legs Medicinal Powder Aspirin/Sachet` (`MAL19930010XZ`). Add Medicine prefills dosage `600` and unit `g`. The live API's underlying product name is `Three Legs Medicinal Powder Aspirin 600mg/Sachet`, but its structured strength is `600 G`. The unit change represents a 1,000-fold amount difference. This incorrect prefill was observed without saving the powder medication.
- Root cause: `api/src/services/ingredient-mapper.ts:30` searches the entire medicine name with `/(MG|ML|MCG|G|IU)/i`, so the `g` in `Legs` matches before the actual `mg` unit. Line 122 combines that match with the first numeric value, producing `600 G`. `src/screens/AddMedicineScreen.tsx:145` trusts that structured strength and prefills the incorrect unit.
- Suggested fix: Parse a number and its adjacent unit as one strength token with appropriate boundaries and unit matching order. Do not extract unit letters from brand words. Preserve 600 mg for this product and validate other catalog strength formats.
- Evidence: [verify-shots/s05-brand-unit-mismatch.png](verify-shots/s05-brand-unit-mismatch.png), [catalog search results](verify-shots/s01-aspirin-results.png), [live API name and strength](verify-logs/host-aspirin.txt).

## Coverage completed and remaining limits

| Area / exploration gap | Independent verification result |
| --- | --- |
| Week swipe and refresh | Swiped to October 4–10 and back, then pulled to refresh. Navigation and persisted card statuses behaved as expected. Evidence: [next week](verify-shots/coverage-next-week.png), [refreshed calendar](verify-shots/coverage-refreshed.png). |
| Dosage and duration validation | Saved zero, negative and extreme numeric inputs; zero/negative acceptance is MED-S02. Reversed date order is MED-S03. Custom-name rejection was reproduced as MED-03. |
| Reschedule all future dates | Changed a disposable 0 mg QA record from 09:52 to 21:52 with the all-future option. Details and the next-day card reflected 21:52. Evidence: [success](verify-shots/coverage-all-success.png), [updated details](verify-shots/coverage-all-detail.png), [next day](verify-shots/coverage-all-tomorrow.png). Today Only failure is MED-05. |
| Remove confirmation and execution | Confirmed removal of that disposable QA record. Its future calendar card disappeared while other medication cards remained. Also removed the extreme-dose boundary record. Evidence: [confirmation](verify-shots/coverage-remove-confirm.png), [removed calendar](verify-shots/coverage-removed.png), [extreme record removed](verify-shots/coverage-extreme-removed.png). Actual reminder cancellation cannot be validated because scheduling fails under MED-01. |
| Camera permission and capture | Independently exercised denied permission, granted-camera entry, capture, no-medicine result, Manual Entry, Cancel and Retake. Denied permission blocks Manual Entry as MED-S04. |
| OCR and SelectScannedMedicine | Supplied a readable aspirin/warfarin fixture through the assigned emulator's virtual-scene wall/table controls. Preview showed the room, but the captured still was black with a timestamp; OCR extracted the timestamp and zero medicines. This is an emulator/fixture limitation, not a confirmed OCR app bug. Retake and no-medicine recovery were exercised. SelectScannedMedicine was not reached. Its source was inspected (`src/screens/ScanPrescriptionScreen.tsx:71`, `src/screens/SelectScannedMedicineScreen.tsx:31`), but candidate selection/confirmation remains unverified at runtime. Evidence: [fixture attempt](verify-shots/coverage-camera-fixture-attempt.png), [no medicine result](verify-shots/coverage-camera-fixture-no-medicine.png), [retake](verify-shots/coverage-retake-fixture.png), [OCR log](verify-logs/coverage-ocr-fixture.log). |
| MedicationManagement and MedicationInteractions screens | Rechecked visible navigation and attempted package-targeted `mykencing://MedicationManagement` and `mykencing://MedicationInteractions` VIEW intents. The app stayed on Home. Routes exist at `src/navigation/AppNavigator.tsx:350` and line 355, but no visible management entry was found; `src/screens/MedicationsScreen.tsx:208` is an unused interaction-navigation handler, and `src/navigation/AppNavigator.tsx:261` supplies no linking configuration. Screen controls remain unverified at runtime; source-only concerns are not counted as confirmed bugs. Evidence: [interaction route attempt](verify-shots/coverage-inaccessible-interactions.png), [management route attempt](verify-shots/coverage-inaccessible-management.png). |
| Warfarin + aspirin safety check | Added both catalog medicines and exercised add-time and detail checks against the live backend. HTTP 404 is MED-S01; missing error feedback is MED-02. Successful interaction rendering, risk acknowledgement and adherence gating remain blocked by that endpoint failure and the inaccessible dedicated screen. |
| Notification permission Deny | Independently recreated the prompt, chose Don't allow and confirmed `POST_NOTIFICATIONS: granted=false` plus `Notification permissions not granted` in logs. The app remained usable. Restored permission to granted afterwards. Evidence: [prompt](verify-shots/coverage-notification-prompt.png), [denied permission state](verify-logs/denied-permission-state.txt), [denial log](verify-logs/coverage-notification-denied.log), [restored permissions](verify-logs/restored-permission-state.txt). |
| Reminder delivery and notification actions | Scheduling failure is reproduced with permission granted. Delivery, notification Take/Skip, snooze and action-to-adherence behavior could not be exercised because no medication reminder was successfully scheduled; these are not claimed as passing. |
| Adherence and restart | Future Take/Skip and force-stop persistence independently reproduced MED-06. No AndroidRuntime fatal crash was observed in the collected logs. |

QA records were retained where needed to reproduce the findings; no app-data reset was performed. Disposable zero/extreme records were removed through the app. Repository writes for this verification are confined to `qa/medications/`. The final [report audit](verify-logs/report-audit.json) checked every evidence link and source anchor, and found all 150 tracked baseline files outside this QA directory unchanged. Temporary device setup restoration is recorded in [cleanup.txt](verify-logs/cleanup.txt).

## Summary

Seven original reports confirmed, five new bugs confirmed: four High, seven Medium and one Low. No original report was classified NOT REPRODUCED or ENVIRONMENT; the DNS and OCR-fixture limitations are separated above from the confirmed app defects.

| ID | Title | Verdict | Severity |
| --- | --- | --- | --- |
| MED-01 | Medication reminders fail to schedule | CONFIRMED | High |
| MED-02 | Failed interaction checks appear empty | CONFIRMED | High |
| MED-03 | Typed custom medicine name cannot save | CONFIRMED | Medium |
| MED-04 | Search failures lack error/retry feedback | CONFIRMED | Medium |
| MED-05 | Today Only reschedule deletes a past dose | CONFIRMED | Medium |
| MED-06 | Future doses can be taken/skipped early | CONFIRMED | Medium |
| MED-07 | Saved profile name disappears | CONFIRMED | Low |
| MED-S01 | Live safety-check endpoint returns 404 | CONFIRMED | High |
| MED-S02 | Zero and negative dosages are accepted | CONFIRMED | Medium |
| MED-S03 | Reversed dates save without doses | CONFIRMED | Medium |
| MED-S04 | Camera denial blocks Manual Entry | CONFIRMED | Medium |
| MED-S05 | Brand-name letter becomes strength unit | CONFIRMED | High |
